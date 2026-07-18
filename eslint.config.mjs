import eslint from 'eslint';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'prisma/**',
      '**/*.config.js',
      '**/*.config.mjs',
      'scripts/**',
      'tests/**',
      'supabase/**',
    ],
  },
  
  // Main configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // Standard ESLint rules
      'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
      'no-undef': 'off', // TypeScript handles this
      'prefer-const': 'warn',
      'no-var': 'error',
      
      // Potential runtime issues
      'no-prototype-builtins': 'warn',
      'no-constant-condition': 'warn',
    },
  },
  
  // Configuration for JS files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-undef': 'error',
    },
  },
];