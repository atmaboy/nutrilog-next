import { nextConfig } from 'eslint-config-next/flat'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
]
