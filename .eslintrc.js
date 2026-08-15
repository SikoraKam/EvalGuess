// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', 'eslint:recommended', 'prettier'],
  // React Native supplies the timer and console globals the app code uses.
  env: { 'shared-node-browser': true },
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
