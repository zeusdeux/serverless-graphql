import { GraphQLSchema, ExecutionResult, subscribe, graphql } from 'graphql'

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

export interface GetQueryRunnerResult<T> {
  graphql: (request: string | QueryRunnerOptions) => Promise<ExecutionResult<T>>
  subscribe: (request: string | QueryRunnerOptions) => Promise<AsyncIterable<ExecutionResult<T>>>
}

export function getQueryRunner<T = { [key: string]: any }>(
  opts: MakeExecutableSchemaOptions | { schema: GraphQLSchema }
): GetQueryRunnerResult<T>
export function makeExecutableSchema(opts: MakeExecutableSchemaOptions): GraphQLSchema
export const gql: typeof String.raw
