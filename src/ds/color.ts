export interface Oklch {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

const OKLCH_PATTERN =
  /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/i;

export function parseOklch(value: string): Oklch {
  const match = OKLCH_PATTERN.exec(value.trim());
  if (!match) throw new Error(`Unsupported color value: ${value}`);

  const [, lightness, lightnessUnit, chroma, hue, alpha, alphaUnit] = match;
  return {
    l: Number(lightness) / (lightnessUnit === "%" ? 100 : 1),
    c: Number(chroma),
    h: Number(hue),
    alpha: alpha === undefined ? 1 : Number(alpha) / (alphaUnit === "%" ? 100 : 1),
  };
}

export type Rgb = readonly [number, number, number];

/** Converts to linear-light sRGB. Components can fall outside 0..1 for out-of-gamut colors. */
export function toLinearSrgb({ l, c, h }: Oklch): Rgb {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const EPSILON = 0.0005;

export function isInSrgbGamut(color: Oklch): boolean {
  return toLinearSrgb(color).every((channel) => channel >= -EPSILON && channel <= 1 + EPSILON);
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export function relativeLuminance(color: Oklch): number {
  const [r, g, b] = toLinearSrgb(color).map(clamp01) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two opaque colors. */
export function contrastRatio(foreground: Oklch, background: Oklch): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const [lighter, darker] = first >= second ? [first, second] : [second, first];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Euclidean distance in OKLab, used as a proxy for how distinguishable two colors are. */
export function oklabDistance(first: Oklch, second: Oklch): number {
  const lab = ({ l, c, h }: Oklch): readonly [number, number, number] => {
    const hue = (h * Math.PI) / 180;
    return [l, c * Math.cos(hue), c * Math.sin(hue)];
  };
  const [l1, a1, b1] = lab(first);
  const [l2, a2, b2] = lab(second);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}
