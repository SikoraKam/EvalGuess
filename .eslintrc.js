// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', 'eslint:recommended', 'prettier'],
  plugins: ['prettier', 'react', 'react-hooks'],
  rules: {
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['/dist/*', '/app-example/*', '/positions/generated/*'],
  overrides: [
    {
      // Build tooling runs in Node, not in the app bundle.
      files: ['*.js'],
      env: { node: true },
    },
    {
      files: ['**/__tests__/**', '**/*.test.*', 'jest.setup.js'],
      env: { jest: true, node: true },
    },
  ],
};
