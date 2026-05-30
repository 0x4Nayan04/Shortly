import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 2022
      }
    },
    rules: {
      'no-undef': 'off'
    }
  }
];
