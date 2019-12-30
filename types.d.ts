import { GraphQLSchema, ExecutionResult, subscribe } from 'graphql'

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

export type QueryRunnerFunction<T = { [key: string]: any }> = (
  request: string | QueryRunnerOptions
) => Promise<AsyncIterable<ExecutionResult<T>> | ExecutionResult<T>>

export function getQueryRunner<T>(
  opts: MakeExecutableSchemaOptions | { schema: GraphQLSchema }
): QueryRunnerFunction<T>
export function makeExecutableSchema(opts: MakeExecutableSchemaOptions): GraphQLSchema
export const gql: typeof String.raw
