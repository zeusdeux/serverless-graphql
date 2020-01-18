import { ExecutionResult, GraphQLSchema } from 'graphql'

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

export interface GetQueryRunnerResult<Query = {}, Mutation = {}, Subscription = {}> {
  graphql: <T>(
    request: string | QueryRunnerOptions
  ) => Promise<ExecutionResult<keyof T extends keyof Mutation | keyof Query ? T : never>>
  subscribe: <T>(
    request: string | QueryRunnerOptions
  ) => Promise<AsyncIterable<ExecutionResult<keyof T extends keyof Subscription ? T : never>>>
}

export function getQueryRunner<Query = {}, Mutation = {}, Subscription = {}>(
  opts: MakeExecutableSchemaOptions | { schema: GraphQLSchema }
): GetQueryRunnerResult<Query, Mutation, Subscription>
export function makeExecutableSchema(opts: MakeExecutableSchemaOptions): GraphQLSchema
export const gql: typeof String.raw
