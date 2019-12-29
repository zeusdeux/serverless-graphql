import { GraphQLSchema, ExecutionResult } from 'graphql'

export type ResolverFunction = (...args: any[]) => any

export interface MakeExecutableSchemaOptions {
  typeDefs: string
  resolvers: {
    [key: string]:
      | {
          [key: string]: ResolverFunction
        }
      | ResolverFunction
  }
}

export interface QueryRunnerOptions {
  req: string
  variables?: { [key: string]: any }
  root?: any
  context?: any
  operationToRun?: string
}

export type QueryRunnerFunction<T = any> = (
  request: string | QueryRunnerOptions
) => Promise<ExecutionResult<T>>

export function getQueryRunner(opts: MakeExecutableSchemaOptions): QueryRunnerFunction
export function makeExecutableSchema(opts: MakeExecutableSchemaOptions): GraphQLSchema
export const gql: typeof String.raw
