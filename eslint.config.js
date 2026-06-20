export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        navigator: "readonly",
        caches: "readonly",
        self: "readonly",
        Promise: "readonly",
        setTimeout: "readonly",
        FileReader: "readonly",
        Blob: "readonly",
        URL: "readonly",
        alert: "readonly",
        process: "readonly",
        fetch: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-console": "off",
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-shadow": "error",
      "no-eval": "error",
      "semi": ["error", "always"]
    }
  }
];
