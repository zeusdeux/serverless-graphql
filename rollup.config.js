import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'

export default [
  {
    input: './src/index.js',
    output: [
      {
        file: 'dist/serverless-gql.umd.js',
        format: 'umd',
        name: 'serverlessGql',
        sourcemap: true
      },
      {
        file: 'dist/serverless-gql.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [replace({ 'process.env.NODE_ENV': '"production"' }), resolve(), commonjs(), terser()]
  }
]
