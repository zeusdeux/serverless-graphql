import { buildSchema } from 'graphql/utilities'

export function makeExecutableSchema({ typeDefs, resolvers }) {
  const schemaWithoutResolvers = buildSchema(typeDefs)
  const queryResolvers = Object.keys(resolvers.Query)
  const mutationResolvers = Object.keys(resolvers.Mutation)

  queryResolvers.forEach(field => {
    schemaWithoutResolvers._queryType._fields[field].resolve = resolvers.Query[field]
  })

  mutationResolvers.forEach(mutation => {
    schemaWithoutResolvers._mutationType._fields[mutation].resolve = resolvers.Mutation[mutation]
  })

  return schemaWithoutResolvers
}
