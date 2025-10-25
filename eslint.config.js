import js from '@eslint/js';
import unicornPlugin from 'eslint-plugin-unicorn';
import jestPlugin from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Apply recommended rules to all files
  js.configs.recommended,

  // Unicorn recommended rules
  unicornPlugin.configs['recommended'],

  // Main configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    rules: {
      // Keep original project rules
      'max-len': ['error', { code: 150, tabWidth: 4 }],
      'no-console': 'off',

      // Adjust unicorn rules for this project
      'unicorn/prefer-module': 'off', // Allow CommonJS if needed
      'unicorn/prevent-abbreviations': 'off', // Allow abbreviations
      'unicorn/no-null': 'off', // null has semantic meaning in this codebase
      'unicorn/prefer-event-target': 'off', // Node.js uses EventEmitter
      'unicorn/no-anonymous-default-export': 'off', // Allow anonymous exports
    },
  },

  // Test files configuration
  {
    files: ['test/**/*.js', 'test/**/*.ts'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'func-names': 'off',
      'prefer-arrow-callback': 'off',
      'jest/expect-expect': 'error',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-expect': 'error',
    },
  },

  // Prettier config should be last to override other formatting rules
  prettierConfig,
];
