import { graphql } from 'graphql'
import { makeExecutableSchema } from './schema'

const assert = (condition, failureMessage) => {
  if (condition) {
    throw new Error(failureMessage)
  }
}

const validateRequest = o => {
  // validates based on docs for graphql function: https://graphql.org/graphql-js/graphql/#graphql
  // Also, it normalizes the input object to always be of shape given below.
  const objectShape = `{
  req: string // any supported request string such as Query, Mutation or Subscription
  variables?: { [key: string]: any }
  root?: any
  context?: any
  operationToRun?: string
}`
  assert(
    !o || Array.isArray(o),
    `Request should be a string or an object with shape ${objectShape}`
  )

  if (typeof o === 'string') {
    return { req: o }
  }

  assert(o.req && typeof o.req !== 'string', '"req" property of request should be a string')

  if (o.variables) {
    assert(
      Array.isArray(o.variables) || typeof o.variables !== 'object',
      '"variables" property of request should be an object of type { [key: string]: any }'
    )
  }

  if (o.operation) {
    assert(typeof o.operation !== 'string', '"operation" property of request should be a string')
  }

  return o
}

export function getQueryRunner(...args) {
  const schema = makeExecutableSchema(...args)

  return requestStringOrObject => {
    const { req, variables, root, context, operationToRun } = validateRequest(requestStringOrObject)

    return graphql(schema, req, root, context, variables, operationToRun)
  }
}

export const gql = String.raw

export { makeExecutableSchema }
