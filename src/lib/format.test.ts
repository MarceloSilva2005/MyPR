import { describe, expect, it } from "vitest";

import { formatDuration, formatLoad, formatNumber, formatSigned } from "./format";

describe("formatNumber", () => {
  it("uses the decimal comma and the dot for thousands", () => {
    expect(formatNumber(1234.5)).toBe("1.234,5");
  });

  it("drops trailing zeros and rounds to the requested precision", () => {
    expect(formatNumber(80)).toBe("80");
    expect(formatNumber(82.456, 1)).toBe("82,5");
  });
});

describe("formatLoad", () => {
  it("joins value and unit with a non-breaking space", () => {
    expect(formatLoad(82.5, "kg")).toBe("82,5 kg");
    expect(formatLoad(135, "lb")).toBe("135 lb");
  });

  it("keeps up to two decimals so plate math stays visible", () => {
    expect(formatLoad(61.235, "kg")).toBe("61,24 kg");
  });
});

describe("formatSigned", () => {
  it("prefixes positive values and uses a true minus sign for negatives", () => {
    expect(formatSigned(2.5)).toBe("+2,5");
    expect(formatSigned(-1)).toBe("−1");
  });

  it("shows zero without a sign, including values that round to zero", () => {
    expect(formatSigned(0)).toBe("0");
    expect(formatSigned(0.04)).toBe("0");
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(9)).toBe("0:09");
  });

  it("adds hours only when needed", () => {
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("clamps negative and fractional input", () => {
    expect(formatDuration(-4)).toBe("0:00");
    expect(formatDuration(59.9)).toBe("0:59");
  });
});
