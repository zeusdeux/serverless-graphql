# serverless-graphql

Run GraphQL on any schema directly from anywhere without the need for a graphql server.

This is _super_ experimental and just fun mostly.

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
