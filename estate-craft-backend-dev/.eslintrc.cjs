// .eslintrc.js
module.exports = {
  env: {
    browser: false,
    node: true,
    es2022: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'no-await-in-loop': 'off',
    'radix': 'off',
    'prettier/prettier': 'error',
    'no-continue': 'off', // allow continue statements
    'no-console': 'off', // allow console logs
    'no-underscore-dangle': 'off',
    'prefer-regenerator': 'off',
    'no-nested-ternary': 'off',
    'import/no-mutable-exports': 'off',
    'no-param-reassign': 'off',
    'no-unused-vars': 'off',
    'import/extensions': ['error', 'ignorePackages', {
      js: 'always'
    }],
    'class-methods-use-this': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops are not allowed',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode',
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js']
      }
    }
  }
};
