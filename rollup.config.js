import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'

export default [
  {
    input: './src/index.js',
    output: {
      file: 'dist/browser-gql.umd.js',
      format: 'umd',
      name: 'browserGql'
    },
    plugins: [replace({ 'process.env.NODE_ENV': '"production"' }), resolve(), commonjs()]
  },
  {
    input: './src/demo.js',
    output: {
      file: 'dist/browser-gql-demo.umd.js',
      format: 'umd',
      name: 'browserGqlDemo'
    },
    plugins: [replace({ 'process.env.NODE_ENV': '"production"' }), resolve(), commonjs()]
  }
]
