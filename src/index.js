import { graphql } from 'graphql'
import { makeExecutableSchema } from './schema'

export function getQueryRunner(...args) {
  const schema = makeExecutableSchema(...args)

  return query => graphql(schema, query)
}

export const gql = String.raw

export { makeExecutableSchema }
