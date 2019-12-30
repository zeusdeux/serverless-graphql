# serverless-graphql

Run GraphQL on any schema directly from anywhere without the need for a graphql server.

Supports `Query`, `Mutation` _and_ `Subscription` types.

This is _super_ experimental and just fun mostly.

## Installation

```js
npm install @zeusdeux/serverless-graphql
```

> You can use other package managers as well.

## API

### `makeExecutableSchema`

This function accepts an `options` object with two properties for now.

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

// this schema can then be consumed by other packages such as apollo-server, etc to run a dev server for example.
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
missing, the default resolver is used. The default resolver comes from `graphql` package, which is
basically an identity function per field in a type.

The resolver function can also be `async` and use the `async/await` syntax.

If a resolver throws an error, the query execution is stopped and the error is returned to the user
in the `errors` key of the reponse.

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

  // Author: {}, // not providing this let's us use the default resolvers

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

This function accepts the same options as `makeExecutableSchema` and returns a function which
accepts a GraphQL query to execute on the provided schema (typedefs + resolvers).

In lieu of and object containing `{ typeDefs, resolvers }`, this function also accepts an object
containing a `GraphQLSchema` i.e., `{ schema: GraphQLSchema }`.

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

const runQuery = getQueryRunner({ typeDefs, resolvers })

runQuery('{ hello }').then(({ data }) => console.log(data)) // logs {hello: "world!"}

// or

const schema = makeExecutableSchema({ typeDefs, resolvers })
const runQuery = getQueryRunner({ schema })

runQuery('{ hello }').then(({ data }) => console.log(data)) // logs {hello: "world!"}
```

The function returned by `getQueryRunner` can be provided with the operation as a string as shown in
the example above. But not only that, it also supports `variables`, `context` which is passed to all
resolvers, `root` value which gets passed as the root value to the executor and `operationToRun`
which can be used to selection which operation to run if many are provided in the request string.

#### Using variables with the query runner

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

const runQuery = getQueryRunner({ typeDefs, resolvers })

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

When a `subscription` is requested using the function returned by `getQueryRunner`, the request
result is an async iterable which can be use with a
[for-await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_iterables)
loop.

#### `subscription` request example

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
  const q = getQueryRunner({ typeDefs, resolvers })

  for await (let x of await q('subscription { getNumber }')) {
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
