# serverless-graphql

Run GraphQL on any schema directly from anywhere without the need for a graphql server.

Supports `Query`, `Mutation` _and_ `Subscription` types.

This is _super_ experimental.

## Installation

```js
npm install @zeusdeux/serverless-graphql
```

> You can use other package managers as well.

## API

### `makeExecutableSchema`

This function accepts an `options` object with two properties for now and returns a `GraphQLSchema`.

#### Return type

`GraphQLSchema`

e.g.,

```js
import { makeExecutableSchema } from '@zeusdeux/serverless-graphql'

const typeDefs = gql`
  type Query {
    hello: String!
  }
`

const resolvers = {
  Query: {
    hello: () => 'world!'
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers })

// this schema can then be consumed by other packages
// such as apollo-server, etc to run a dev server for example.
```

#### `options.typeDefs`

These are the type definitions of your GraphQL server.

e.g.,

```gql
type Query {
  authors: [Author]!
  author(name: String!): Author!
  books: [Book]!
}

type Author {
  name: String!
  age: Int!
  addedAt: String!
  books: [Book]!
}

type Book {
  name: String!
  publisher: String!
  publishedYear: Int!
  authors: [Author!]
}

input AuthorInput {
  name: String!
  age: Int!
}

input BookInput {
  name: String!
  publisher: String!
  publishedYear: Int!
}

type Mutation {
  addAuthor(author: AuthorInput!): Author!
  addBookForAuthor(authorName: String!, book: BookInput): Book!
}
```

#### `options.resolvers`

This an object contain the resolvers for the types provided in the `typeDefs`. If any resolver is
missing, the
[default resolver](https://www.apollographql.com/docs/graphql-tools/resolvers/#default-resolver) is
used.

The resolver function can also be `async` and use the `async/await` syntax.

If a resolver throws an error, the query execution is aborted and the error is returned to the user
in the `errors` key of the response.

A working example matching the schema above is provided below.

```js
const AuthorDB = {}
const BookDB = {}

const delay = ms => {
  return new Promise(res => {
    setTimeout(res, ms)
  })
}

const resolvers = {
  Query: {
    authors() {
      return Object.values(AuthorDB)
    },
    author(_, { name }) {
      if (name in AuthorDB) {
        return AuthorDB[name]
      }

      throw new Error(`No author named ${name} found in database`)
    },
    books() {
      return Object.values(BookDB)
    }
  },

  // Author: {}, // not providing this lets us use the default resolvers

  Mutation: {
    addAuthor(_, { author }) {
      const { name, age } = author

      // add author if it doesn't exist in DB
      if (!(name in AuthorDB)) {
        AuthorDB[name] = {
          name,
          age,
          addedAt: new Date().toISOString(),
          books: []
        }
      }

      return AuthorDB[name]
    },

    async addBookForAuthor(_, { authorName, book: { name: bookName, publisher, publishedYear } }) {
      await delay(2500)

      if (authorName in AuthorDB) {
        const author = AuthorDB[authorName]
        const authorHasBook = !!author.books.filter(book => book.name === bookName).length
        const bookIdx = `${bookName}:${publisher}:${publishedYear}`
        const book = BookDB[bookIdx]

        if (authorHasBook) {
          return book
        }

        if (book) {
          book.authors.push(author)
          BookDB[bookIdx] = book
        } else {
          BookDB[bookIdx] = {
            name: bookName,
            publisher,
            publishedYear,
            authors: [author]
          }
        }

        author.books.push(BookDB[bookIdx])

        return BookDB[bookIdx]
      }

      throw new Error(`Author with name ${name} not found`)
    }
  }
}
```

### `getQueryRunner`

This function accepts the same options as [`makeExecutableSchema`](#makeexecutableschema) or an
object containing a `GraphQLSchema` i.e., `{ schema: GraphQLSchema }`. It returns an object with two
properties, `graphql` and `subscribe`.

#### Return type

```ts
type GetQueryRunnerResult<T = { [key: string]: any }> = {
  graphql: (request: string | QueryRunnerOptions) => Promise<ExecutionResult<T>>
  subscribe: (request: string | QueryRunnerOptions) => Promise<AsyncIterable<ExecutionResult<T>>>
}

type QueryRunnerOptions = {
  req: string
  variables?: { [key: string]: any }
  root?: any
  context?: any
  operationToRun?: string
}

type ExecutionResult<T> = {
  errors?: ReadonlyArray<GraphQLError>
  data?: T | null
}
```

Both functions returned by `getQueryRunner` can be provided with the operation as a string or as a
string assigned to `req` property of an object. The object also supports `variables` which let you
use graphql variables, `context` which is passed to all resolvers, `root` value which gets passed as
the root value to the executor and `operationToRun` which can be used to select which operation to
run if many are provided in the request (`req`) string.

The functions on the returned object are explained below.

#### `graphql`

This function accepts a GraphQL request to execute on the given schema or schema generated from
`{ typeDefs, resolvers }` (i.e., the args to `getQueryRunner`). It should _only be used for queries
and mutations_.

It returns a `Promise` which resolves to an object containing `data` and `errors` properties, _one_
of which is usually populated. `data` maps to the resolved response. `errors` contains errors that
occured during execution. This maps to the `ExecutionResult` type shown above.

e.g.,

```js
import { makeExecutableSchema, getQueryRunner, gql } from '@zeusdeux/serverless-graphql'

const typeDefs = gql`
  type Query {
    hello: String!
  }
`

const resolvers = {
  Query: {
    hello: () => 'world!'
  }
}

const { graphql: runQuery } = getQueryRunner({ typeDefs, resolvers })

runQuery('{ hello }').then(({ data }) => console.log(data)) // logs {hello: "world!"}

// or

const schema = makeExecutableSchema({ typeDefs, resolvers })
const { graphql: runQuery } = getQueryRunner({ schema })

runQuery('{ hello }').then(({ data }) => console.log(data)) // logs {hello: "world!"}
```

An example with the `variables` option being used

```js
import { getQueryRunner, gql } from '@zeusdeux/serverless-graphql'

const typeDefs = gql`
  type Query {
    hello: String!
  }

  type Mutation {
    getTime(iso: Boolean = false): String
  }
`

const resolvers = {
  Query: {
    hello: () => 'world!'
  },
  Mutation: {
    getTime(_, { iso }) {
      const t = new Date()
      return iso ? t.toISOString() : t.getTime()
    }
  }
}

const { graphql: runQuery } = getQueryRunner({ typeDefs, resolvers })

runQuery({
  req: gql`
    mutation whatTimeIsIt($iso: Boolean) {
      currentServerTime: getTime(iso: $iso)
    }
  `,
  variables: {
    iso: true
  }
}).then(({ data }) => console.log(data)) // logs server time in ISO format
```

#### `subscribe`

This function accepts a GraphQL _`subscription`_ request to execute on the given schema or schema
generated from `{ typeDefs, resolvers }` (i.e., the args to `getQueryRunner`). It should _only be
used for `subscription` requests_.

It returns a `Promise` that resolves to an
[`async iterable`](https://javascript.info/async-iterators-generators#async-iterables) that can be
consumed using the new
[`for await...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
syntax for example.

The values generated by the async iterable have the same shape and type as those returned by the
`graphql` function mentioned above. I.e., `Promise`s that resolve to `{ data?, errors? }` aka
`ExecutionResult`.

e.g.,

```js
import { getQueryRunner, gql } from '@zeusdeux/serverless-graphql'

const delay = ms => {
  return new Promise(res => {
    setTimeout(res, ms)
  })
}

const typeDefs = gql`
  type Subscription {
    getNumber: Int!
  }
`

const resolvers = {
  Subscription: {
    getNumber: {
      subscribe: () => generateNumbers()
    }
  }
}

async function* generateNumbers() {
  let x = 1
  while (x < 5) {
    // synthetic delay
    await delay(1000)

    // whatever is yielded is passed as the root value
    // to the resolve function next to the subscribe.
    // In this example, there isn't one which means
    // GraphQL uses the default resolver which in
    // this case is resolve(root) = root.getNumber
    yield {
      getNumber: x++
    }
  }
}

async function main() {
  const { subscribe } = getQueryRunner({ typeDefs, resolvers })

  for await (let x of await subscribe('subscription { getNumber }')) {
    console.log('Number:', x) // prints Number: 1, Number: 2, and so on
  }
}

main().catch(err => console.log.bind('😱', err))
```

### `gql`

An alias for `String.raw`. This lets `prettier` format the type definitions for you automatically.

## Packages published

This repo publishes a umd package with its external dependencies, `graphql` and `graphql/utilities`,
all bundled up together as a UMD bundle for ease of usage from a browser.

For usage from an application, it _does not_ bundle up any of its external dependencies (`graphql`
and `graphql/utilities`). It instead marks `graphql` (which includes `graphql/utilities`) as a peer
dependency under `peerDependencies`. It is up to the consumer of this package to install the
`peerDependencies` in their application. This is because, at any given time, only one instance of
`graphql` can be installed otherwise it starts throwing when it's functions are consumed.

### UNPKG

[UNPKG](https://unpkg.com/) serves `umd/serverless-gql.umd.js` which is minified and contains the
dependencies within.

### CJS

Usage of this package using `require` or in CJS environments consumes `dist/serverless-gql.cjs.js`.

### ESM

In the context of an ESM based codebase, bundlers can choose to consume `dist/serverless-gql.esm.js`
which is a build with `import`/`export` statements kept intact for better tree-shaking to enable
dead code elimination.

## Development

1. Fork (if not the author) and clone the repository
2. `cd` in the directory and run `npm i`
3. `npm install` the `peerDependencies` of this package if you will be building the code (to
   publish, test, etc)
4. Make your changes as required on a well named branch
5. Open a PR against the origin repository
