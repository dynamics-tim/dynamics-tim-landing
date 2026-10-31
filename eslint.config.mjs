import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import astroPlugin from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist', '.astro', '.dist', 'node_modules', 'scripts', 'test-results']
  },
  js.configs.recommended,
  ...tseslint.configs['flat/recommended'],
  ...astroPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}', '**/*.astro', '**/*.astro/*.ts', '**/*.astro/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    // Plain browser scripts served as-is from /public
    files: ['public/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser
      }
    }
  },
  {
    // Tooling / config files executed by Node
    files: ['*.config.{js,mjs,ts}', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  prettier
];
