import { defineConfig } from "orval";

export default defineConfig({
  pyapi: {
    input: "./pyapi-openapi.json",
    output: {
      mode: "tags-split",
      target: "./src/generated/pyapi",
      schemas: "./src/generated/pyapi/model",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/lib/orval-fetcher.ts",
          name: "customFetch",
        },
        useTypeOverInterfaces: true,
      },
    },
  },
});
