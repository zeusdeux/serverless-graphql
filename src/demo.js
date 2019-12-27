import { getQueryRunner } from './'

const DB = {}

const gql = String.raw

const delay = ms => {
  return new Promise(res => {
    setTimeout(res, ms)
  })
}

export async function main() {
  const typeDefs = gql`
    type Query {
      author(name: String!): Author!
    }

    type Author {
      name: String!
      age: Int!
      addedAt: String!
    }

    input AuthorInput {
      name: String!
      age: Int!
    }

    type Mutation {
      addAuthor(author: AuthorInput!): Author
    }
  `

  const resolvers = {
    Query: {
      async author(_, { name }) {
        await delay(2000)

        if (name in DB) {
          return DB[name]
        }

        throw new Error(`No author named ${name} found in database`)
      }
    },
    Mutation: {
      async addAuthor(_, { author }) {
        await delay(1000)

        const { name, age } = author

        if (name in DB) {
          throw new Error(`Author with name ${name} already exists in database`)
        }

        DB[name] = {
          name,
          age,
          addedAt: new Date().toISOString()
        }

        return DB[name]
      }
    }
  }
  const runQuery = getQueryRunner({ typeDefs, resolvers })

  const query1 = '{ author(name: "test") { name, age, addedAt }}'
  const res1 = await runQuery(query1) // will have an error in response
  console.log(`Result of query ${query1}`, res1)

  const mutation1 = `
    mutation {
      addAuthor(author: { name: "test", age: 99 }) {
        name
        age
        addedAt
      }
    }
  `
  const res2 = await runQuery(mutation1) // will add an author with name "test"
  console.log(`Result of mutation ${mutation1}`, res2)

  const res3 = await runQuery(query1) // will now give a success response
  console.log(`Result of query ${query1}`, res3)
}

// to run, paste the build bundle and type the line below in browser console:
// browserGqlDemo.main().catch(err => console.log(err))
