import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { defineSkill } from 'eve/skills';
import { actions, objects } from '@project/ontology';
import * as ts from 'typescript';
import { z } from 'zod';

const require = createRequire(import.meta.url);
const ontologyDirectory = dirname(require.resolve('@project/ontology'));
const databaseTypesPath = require.resolve('@project/database');
const databaseTypes = ts.createSourceFile(
  databaseTypesPath,
  readFileSync(databaseTypesPath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

const propertyName = (name: ts.PropertyName) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;

  return undefined;
};

const propertyType = (type: ts.TypeNode | undefined, name: string) => {
  if (!type || !ts.isTypeLiteralNode(type)) return undefined;

  return type.members.find((member): member is ts.PropertySignature =>
    ts.isPropertySignature(member) && propertyName(member.name) === name,
  )?.type;
};

const databaseDefinition = databaseTypes.statements.find((statement): statement is ts.TypeAliasDeclaration =>
  ts.isTypeAliasDeclaration(statement) && statement.name.text === 'Database',
);
const publicDefinition = databaseDefinition && propertyType(databaseDefinition.type, 'public');
const tablesDefinition = publicDefinition && propertyType(publicDefinition, 'Tables');
const enumsDefinition = publicDefinition && propertyType(publicDefinition, 'Enums');

if (!tablesDefinition || !ts.isTypeLiteralNode(tablesDefinition)) {
  throw new Error('Could not parse Database.public.Tables from @project/database');
}

const tableTypes = new Map<string, ts.TypeNode>();

for (const member of tablesDefinition.members) {
  if (!ts.isPropertySignature(member) || !member.type) continue;

  const name = propertyName(member.name);

  if (name !== undefined) tableTypes.set(name, member.type);
}

const enumTypes = new Map<string, ts.TypeNode>();

if (enumsDefinition && ts.isTypeLiteralNode(enumsDefinition)) {
  for (const member of enumsDefinition.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;

    const name = propertyName(member.name);

    if (name !== undefined) enumTypes.set(name, member.type);
  }
}

const stringLiteralType = (type: ts.TypeNode | undefined) => {
  if (!type || !ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) return undefined;

  return type.literal.text;
};

const enumNameOf = (node: ts.Node) => {
  if (!ts.isIndexedAccessTypeNode(node) || !ts.isIndexedAccessTypeNode(node.objectType)) return undefined;

  const enumType = node.objectType;
  const publicType = enumType.objectType;

  if (
    stringLiteralType(enumType.indexType) !== 'Enums' ||
    !ts.isIndexedAccessTypeNode(publicType) ||
    stringLiteralType(publicType.indexType) !== 'public' ||
    !ts.isTypeReferenceNode(publicType.objectType) ||
    !ts.isIdentifier(publicType.objectType.typeName) ||
    publicType.objectType.typeName.text !== 'Database'
  ) return undefined;

  return stringLiteralType(node.indexType);
};

const typeTextWithEnums = (type: ts.TypeNode) => {
  const start = type.getStart(databaseTypes);
  const replacements: { start: number; end: number; text: string }[] = [];
  const visit = (node: ts.Node) => {
    const enumName = enumNameOf(node);

    if (enumName !== undefined) {
      const enumType = enumTypes.get(enumName);

      if (!enumType) throw new Error(`Could not find Database.public.Enums.${enumName}`);

      replacements.push({
        start: node.getStart(databaseTypes) - start,
        end: node.getEnd() - start,
        text: enumType.getText(databaseTypes),
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(type);

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce((text, replacement) =>
      text.slice(0, replacement.start) + replacement.text + text.slice(replacement.end),
    type.getText(databaseTypes));
};

const objectNameByTable = new Map<string, string>(
  objects.map(definition => [definition.source.table, definition.name] as const),
);

const objectsJson = objects.map(definition => {
  const tableDefinition = tableTypes.get(definition.source.table);

  if (!tableDefinition) {
    throw new Error(
      `Ontology object "${definition.name}" references missing table "${definition.source.table}" in Database.public.Tables`,
    );
  }

  const rowDefinition = propertyType(tableDefinition, 'Row');

  if (!rowDefinition || !ts.isTypeLiteralNode(rowDefinition)) {
    throw new Error(`Could not parse Database.public.Tables.${definition.source.table}.Row`);
  }

  const referencesByColumn = new Map<string, string>();
  const relationshipsType = propertyType(tableDefinition, 'Relationships');
  const relationshipEntries = relationshipsType && ts.isArrayTypeNode(relationshipsType)
    ? [relationshipsType.elementType]
    : relationshipsType && ts.isTupleTypeNode(relationshipsType)
      ? [...relationshipsType.elements]
      : [];

  for (const relationship of relationshipEntries) {
    const referencedRelation = stringLiteralType(propertyType(relationship, 'referencedRelation'));
    const columnsType = propertyType(relationship, 'columns');
    const columns = columnsType && ts.isTupleTypeNode(columnsType)
      ? columnsType.elements.flatMap(column => {
        const name = stringLiteralType(column);

        return name === undefined ? [] : [name];
      })
      : [];

    if (referencedRelation !== undefined) {
      for (const column of columns) referencesByColumn.set(column, referencedRelation);
    }
  }

  const fields = rowDefinition.members.flatMap(member => {
    if (!ts.isPropertySignature(member) || !member.type) return [];

    const name = propertyName(member.name);

    if (name === undefined) return [];

    const referencedRelation = referencesByColumn.get(name);

    return [{
      name,
      type: typeTextWithEnums(member.type),
      ...(referencedRelation === undefined
        ? {}
        : { references: objectNameByTable.get(referencedRelation) ?? referencedRelation }),
    }];
  });

  return {
    name: definition.name,
    description: definition.description,
    table: definition.source.table,
    fields,
    actions: actions
      .filter(action => action.objects.includes(definition))
      .map(action => action.name),
  };
});

const ruleFiles = readdirSync(ontologyDirectory, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.'))
  .map(entry => entry.name)
  .sort()
  .flatMap(area => {
    const readmePath = join(ontologyDirectory, area, 'README.md');

    return existsSync(readmePath) ? [[`rules/${area}.md`, readFileSync(readmePath, 'utf8')] as const] : [];
  });

const markdown = [
  "The app's business objects, the actions on them and the rules to apply. This skill's files are in `$HOME/.agents/skills/ontology/`; tools other than `bash` need that path with `$HOME` expanded.",
  '',
  "- `objects.json`: every business object, with its `name`, its `description` (what one row means), the `table` its rows are in, its `fields` (each column's type and the object it links to) and the names of the `actions` mainly about it.",
  '- `actions.json`: every business action, with its `name`, its `description`, the names of the main `objects` it is about (it may also touch others indirectly) and its `input` as JSON Schema.',
  '- `rules/<area>.md`: the rules of one business area that you apply by judgment.',
  '',
  'Run an action with the `run_ontology_action` tool.',
  '',
  'Read the objects, actions and rules of the area you work in before you read, change, import or report on its data.',
].join('\n');

const files = {
  'objects.json': JSON.stringify(objectsJson, null, 2),
  'actions.json': JSON.stringify(
    actions.map(action => ({
      name: action.name,
      description: action.description,
      objects: action.objects.map(object => object.name),
      input: z.toJSONSchema(action.input),
    })),
    null,
    2,
  ),
  ...Object.fromEntries(ruleFiles),
};

/** Packages the app's ontology as an agent skill. */
export default defineSkill({
  description: "The app's business objects, the actions on them and the rules to apply. Load it before reading, changing, importing or reporting on business data, and before answering questions about how the business works.",
  markdown,
  files,
});
