import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "bot-AI/**",
      "src/**",
      "scripts/**",
      "next-env.d.ts",
      "coverage/**",
      "dist/**",
      "build/**",
    ],
  },
]

export default config
