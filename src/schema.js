import { buildSchema } from 'graphql/utilities'

// From https://graphql.org/learn/schema/#scalar-types
const BUILT_IN_SCALARS = ['Int', 'Float', 'String', 'Boolean', 'ID']

export function makeExecutableSchema({ typeDefs, resolvers: typeToFieldResolversMap }) {
  const schema = buildSchema(typeDefs) // the returned schema has only default resolvers
  const typesInSchema = Object.keys(schema.getTypeMap()).filter(
    k => !k.startsWith('__') && !BUILT_IN_SCALARS.includes(k)
  )

  // overwrite default resolvers with ours where provided
  typesInSchema.forEach(type => {
    const fieldResolversForType = typeToFieldResolversMap[type]

    Object.keys(schema._typeMap[type]._fields).forEach(field => {
      schema._typeMap[type]._fields[field].resolve =
        fieldResolversForType && fieldResolversForType[field]

      // if resolve is set to undefined, then graphql uses default resolvers so we're good
    })
  })

  return schema
}
