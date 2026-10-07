const VAGUE_SUBJECT = /^(update|updates|change|changes|wip|misc|stuff|fix stuff|update files)$/i;

// Automated dependency update commits follow their own generated phrasing.
const DEPENDENCY_BOT = /^(build|ci)\(deps(-dev)?\): bump /i;

export default {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => DEPENDENCY_BOT.test(message)],
  plugins: [
    {
      rules: {
        "subject-not-vague": ({ subject }) => [
          !subject || !VAGUE_SUBJECT.test(subject.trim()),
          "the subject must describe the concrete change",
        ],
      },
    },
  ],
  rules: {
    "header-max-length": [2, "always", 72],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "perf", "test", "docs", "build", "ci", "chore", "revert"],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "db",
        "ds",
        "shell",
        "exercises",
        "routines",
        "workout",
        "sync",
        "history",
        "records",
        "analytics",
        "settings",
        "pwa",
        "landing",
        "security",
        "a11y",
        "deps",
        "deps-dev",
        "release",
        "repo",
        "tooling",
      ],
    ],
    "subject-not-vague": [2, "always"],
  },
};
