import type { Database } from '@project/database';

type TableName = keyof Database['public']['Tables'];

/** A table that holds a business object's rows. */
export const table = <T extends TableName>(name: T) => ({ kind: 'table' as const, table: name });

/** A business object: its name, what one row means and where its rows live. */
export type ObjectDefinition<T extends TableName> = {
  name: string;
  description: string;
  source: { kind: 'table'; table: T };
};

export type ObjectDef = ObjectDefinition<TableName>;

/** Declares a business object. */
export const object = <T extends TableName>(definition: ObjectDefinition<T>) => definition;
