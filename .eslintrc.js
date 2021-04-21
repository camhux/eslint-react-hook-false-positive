module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    jsx: true,
    sourceType: "module",
  },
  plugins: ["react-hooks"],
  rules: {
    "react-hooks/rules-of-hooks": "error"
  }
};