import { z } from 'zod';

import type { Database } from '@project/database';
import type { ObjectDef } from './object';

type RpcClient = {
  rpc: <T extends keyof Database['public']['Functions']>(
    name: T,
    args: Database['public']['Functions'][T]['Args'],
  ) => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
};

export type ActionContext = { db: RpcClient };

export type ActionDefinition<I extends z.ZodObject, O> = {
  name: string;
  description: string;
  input: I;
  objects: [ObjectDef, ...ObjectDef[]];
  run: (input: z.infer<I>, ctx: ActionContext) => Promise<O>;
};

export type ActionDef = {
  name: string;
  description: string;
  input: z.ZodObject;
  objects: [ObjectDef, ...ObjectDef[]];
  run: (input: never, ctx: ActionContext) => Promise<unknown>;
};

export const sqlFunction = <T extends keyof Database['public']['Functions']>(name: T) => async (
  input: Database['public']['Functions'][T]['Args'],
  ctx: ActionContext,
) => {
  const { data, error } = await ctx.db.rpc(name, input);

  if (error) throw Object.assign(new Error(error.message), { code: error.code });

  return data;
};

export const action = <I extends z.ZodObject, O>(definition: ActionDefinition<I, O>) => definition;
