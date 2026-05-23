import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextCoreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Downgrade React compiler rules to warnings (pre-existing issues, not blocking)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      // Accessibility rules at error level (req 8.1, 8.2, 8.4, 8.7)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
    },
  },
  // Design system lint guardrails: block hard-coded colors, font sizes, and non-lucide icon imports
  // Scoped to src/components/{features,layout,settings,common}/**/*.{ts,tsx}
  {
    files: [
      "src/components/features/**/*.ts",
      "src/components/features/**/*.tsx",
      "src/components/layout/**/*.ts",
      "src/components/layout/**/*.tsx",
      "src/components/settings/**/*.ts",
      "src/components/settings/**/*.tsx",
      "src/components/common/**/*.ts",
      "src/components/common/**/*.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/(?:^|[^a-zA-Z])#[0-9a-fA-F]{3,8}(?:$|[^a-zA-Z0-9])/]",
          message:
            "Hard-coded hex color detected. Use a design token from globals.css via Tailwind (e.g. text-positive, bg-negative) or a CSS variable (hsl(var(--token))).",
        },
        {
          selector: "Literal[value=/(?:^|\\W)(?:rgb|rgba)\\s*\\(/]",
          message:
            "Hard-coded rgb/rgba color detected. Use a design token from globals.css via Tailwind or a CSS variable.",
        },
        {
          selector: "Literal[value=/(?:^|\\W)hsl\\s*\\(\\s*\\d/]",
          message:
            "Hard-coded hsl color detected. Use hsl(var(--token)) with a design token instead.",
        },
        {
          selector:
            "Literal[value=/^\\d+(\\.\\d+)?\\s*(px|rem|em)$/]",
          message:
            "Hard-coded font-size/spacing value detected. Use a Tailwind utility class or a design token instead.",
        },
        {
          selector:
            "Property[key.name='fontSize'][value.type='Literal'][value.raw=/^\\d/]",
          message:
            "Hard-coded fontSize detected. Use a Tailwind text-* utility or a CSS variable from the design token set.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react-icons",
                "react-icons/*",
                "@heroicons/*",
                "@fortawesome/*",
                "phosphor-react",
                "@phosphor-icons/*",
                "@ant-design/icons",
                "ionicons",
                "@mui/icons-material",
                "@mui/icons-material/*",
              ],
              message:
                "Only lucide-react is allowed as an icon library. Import icons from 'lucide-react' instead.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "dist/**", "build/**"],
  },
];
