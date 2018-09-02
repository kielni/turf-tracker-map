module.exports = {
  globals: {
    server: true,
  },
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  extends: 'airbnb-base',
  env: {
    browser: true
  },

  // Use :false to indicate that global variables cannot be rebound
  globals: {
    server: true,
    d3: false,
  },
  rules: {
    'indent': ['error', 2],
    'array-callback-return': 0,
    'no-underscore-dangle': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'no-console': 0,
    'arrow-body-style': ['error', 'as-needed'],
    'no-trailing-spaces': ['error', { 'skipBlankLines': true }],
    'comma-dangle': ['error', 'always-multiline'],
    'newline-after-var': ['error', 'always'],
    'newline-before-return': 'error',
    'prefer-arrow-callback': ['error', { 'allowNamedFunctions': true }]
  }
};
