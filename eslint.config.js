import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

// Dynamic imports for plugins
const reactPlugin = await import('eslint-plugin-react');
const reactHooksPlugin = await import('eslint-plugin-react-hooks');
const importPlugin = await import('eslint-plugin-import');
const jsx_a11yPlugin = await import('eslint-plugin-jsx-a11y');
const prettierPlugin = await import('eslint-plugin-prettier');
const tseslint = await import('@typescript-eslint/eslint-plugin');

export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: (await import('@typescript-eslint/parser')).default,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin.default,
      'react-hooks': reactHooksPlugin.default,
      import: importPlugin.default,
      'jsx-a11y': jsx_a11yPlugin.default,
      prettier: prettierPlugin.default,
      '@typescript-eslint': tseslint.default,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // We're using TypeScript
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      // Disable unused variable checks for function parameters since we're using interface-defined functions
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Import sorting rules - disabled due to compatibility issues with ESLint v10
      // 'import/order': 'off',
      // React prop ordering (using basic configuration to avoid conflicts)
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          reservedFirst: true,
        },
      ],
      // Accessibility rules
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
];
