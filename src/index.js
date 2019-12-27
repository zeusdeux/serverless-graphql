import { graphql } from 'graphql'
import { makeExecutableSchema } from './schema'

export function getQueryRunner(...args) {
  const schema = makeExecutableSchema(...args)

  return query => graphql(schema, query)
}

export { makeExecutableSchema }
