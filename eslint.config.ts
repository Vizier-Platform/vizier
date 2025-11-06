import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: { globals: globals.browser }, extends: [eslintConfigPrettier]  },
  tseslint.configs.recommended
]);
