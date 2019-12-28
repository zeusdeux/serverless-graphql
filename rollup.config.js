import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'

export default [
  // for unpkg with the all the dependencies rolled up Due to this
  // setup, ?module on unpkg will not work as module key in
  // package.json points to an esm module that doesn't have all the
  // dependencies rolled up in it (e.g., graphql)
  {
    input: './src/index.js',
    output: [
      {
        file: 'umd/serverless-gql.umd.js',
        format: 'umd',
        name: 'serverlessGql',
        sourcemap: true
      }
    ],
    // (node) resolve and the commonjs plugins let rollup resolve the
    // dependencies (graphql and graphql/utilities) and include them
    // in the bundle. This is useful only for the umd bundle served by
    // unpkg which, when used, might not have access to graphql,
    // etc. This does cause an issue where if the code that imports it
    // via unpkg, if it also includes graphql, etc via unpkg, then
    // graphql throws some weird errors as it detects two, potentially
    // different version of graphql might be available thus causing
    // weird behaviours during runtime and hence it throws.
    plugins: [replace({ 'process.env.NODE_ENV': '"production"' }), resolve(), commonjs(), terser()]
  },
  {
    // these bundle do NOT bundle up graphql and
    // graphql/utilities. That is left to the consumer which is
    // automatically done by the _application_ bundler. Here we only
    // bundle the library for _consumption_ from an application. For
    // the same reason, it doesn't minify these bundles as the
    // application bundler will do so during consumption.
    input: './src/index.js',
    external: ['graphql', 'graphql/utilities'],
    output: [
      {
        file: 'dist/serverless-gql.cjs.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/serverless-gql.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [replace({ 'process.env.NODE_ENV': '"production"' })]
  }
]
