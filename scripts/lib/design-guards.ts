export interface DesignViolation {
  line: number;
  rule: string;
  snippet: string;
}

interface Rule {
  name: string;
  pattern: RegExp;
  /** Files where the rule does not apply. */
  allowedIn?: readonly RegExp[];
  /** Matches that are acceptable even though the pattern hits. */
  except?: RegExp;
}

const TOKENS_FILE = /^src\/ds\/tokens\.css$/;

/** Spacing steps of the design system: multiples of 4 px, plus 2 px and 6 px for tight icon gaps. */
export const ALLOWED_SPACING = new Set([
  "0",
  "0.5",
  "1",
  "1.5",
  "2",
  "3",
  "4",
  "6",
  "8",
  "12",
  "16",
  "20",
  "24",
]);

const SPACING =
  /(?<![\w-])(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-(\d+(?:\.\d+)?)(?![\w.-])/g;

const PALETTE_NAMES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white";

const RULES: readonly Rule[] = [
  {
    name: "color literal outside the token file",
    pattern:
      /(?<![\w&])#[0-9a-fA-F]{6}\b|(?<![\w&])#[0-9a-fA-F]{3}\b|\b(?:rgba?|hsla?|hwb|oklab|oklch)\(/,
    // color.ts is the math behind the contrast tests: it parses values and never styles anything.
    allowedIn: [TOKENS_FILE, /^src\/ds\/color\.ts$/],
  },
  {
    name: "default palette color instead of a design token",
    pattern: new RegExp(
      `\\b(?:bg|text|border|ring|fill|stroke|outline|from|via|to|divide|decoration|caret|accent)-(?:${PALETTE_NAMES})(?:-\\d{2,3})?\\b`,
    ),
  },
  {
    name: "arbitrary color, shadow or radius value",
    pattern:
      /\b(?:bg|text|border|ring|fill|stroke|outline|from|via|to|shadow|divide|decoration|caret|accent|rounded)-\[/,
  },
  {
    name: "backdrop effect (glass)",
    pattern: /backdrop-(?:blur|filter|brightness|saturate)|backdrop-filter/,
  },
  {
    name: "decorative gradient",
    pattern: /\bbg-(?:gradient|linear|radial|conic)|(?:linear|radial|conic)-gradient\(/,
    allowedIn: [TOKENS_FILE],
  },
  {
    name: "shadow outside the floating-layer tokens",
    pattern: /\bshadow-(?!float\b|overlay\b|none\b)[\w-]+|box-shadow\s*:/,
    allowedIn: [TOKENS_FILE],
  },
  {
    name: "oversized radius",
    pattern: /\brounded(?:-[a-z]+)?-(?:2xl|3xl|4xl)\b/,
  },
  {
    name: "pill shape outside status indicators",
    pattern: /\brounded(?:-[a-z]+)?-full\b/,
    allowedIn: [/^src\/ds\/sync-status\.tsx$/],
  },
  {
    name: "motion outside the motion tokens",
    pattern:
      /\b(?:duration|delay|ease)-(?:\d|\[|in|out|linear)|\btransition-all\b|\banimate-(?:bounce|ping|spin-slow|pulse(?!-soft))\b/,
  },
  {
    name: "generic or promotional copy",
    pattern:
      /\b(?:Olá,\s+(?:usuário|atleta|campeão)|Bem-vindo de volta|Vamos lá!|Você consegue|Sem desculpas|Destrua|Oops|Ops!)/i,
  },
];

/** Reports places where a source file steps outside the design system. */
export function findDesignViolations(path: string, text: string): DesignViolation[] {
  const violations: DesignViolation[] = [];

  text.split(/\r?\n/).forEach((content, index) => {
    if (content.includes("guard-allow")) return;
    const line = index + 1;

    for (const rule of RULES) {
      if (rule.allowedIn?.some((allowed) => allowed.test(path))) continue;
      const match = rule.pattern.exec(content);
      if (match && !(rule.except?.test(match[0]) ?? false)) {
        violations.push({ line, rule: rule.name, snippet: match[0] });
      }
    }

    for (const match of content.matchAll(SPACING)) {
      const step = match[1];
      if (step !== undefined && !ALLOWED_SPACING.has(step)) {
        violations.push({ line, rule: "spacing outside the 4 px scale", snippet: match[0] });
      }
    }
  });

  return violations;
}
