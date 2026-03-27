const injectedRules = new Set<string>();
const STYLE_ELEMENT_ID = "dynamic-color-style-rules";

type ColorVariant = "solid" | "outline";

function getStyleElement() {
  if (typeof document === "undefined") {
    return null;
  }

  let styleElement = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleElement);
  }

  return styleElement;
}

function hashColor(color: string) {
  let hash = 0;

  for (const character of color) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36);
}

function normalizeHexColor(color: string) {
  const normalized = color.trim().toLowerCase();

  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    return `#${normalized.slice(1).split("").map((digit) => `${digit}${digit}`).join("")}`;
  }

  if (/^#[0-9a-f]{6}$/.test(normalized)) {
    return normalized;
  }

  return "#334155";
}

function getContrastTextColor(color: string) {
  const hexColor = normalizeHexColor(color).slice(1);
  const red = Number.parseInt(hexColor.slice(0, 2), 16);
  const green = Number.parseInt(hexColor.slice(2, 4), 16);
  const blue = Number.parseInt(hexColor.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.62 ? "#0f172a" : "#f8fafc";
}

function createRule(className: string, color: string, variant: ColorVariant) {
  const normalizedColor = normalizeHexColor(color);

  if (variant === "outline") {
    return `.${className}{border-color:${normalizedColor};color:${normalizedColor};}`;
  }

  return `.${className}{background-color:${normalizedColor};border-color:${normalizedColor};color:${getContrastTextColor(normalizedColor)};}`;
}

export function getColorStyleClass(color: string, variant: ColorVariant) {
  const normalizedColor = normalizeHexColor(color);
  const className = `color-style-${variant}-${hashColor(`${variant}-${normalizedColor}`)}`;

  if (!injectedRules.has(className)) {
    const styleElement = getStyleElement();

    if (styleElement) {
      styleElement.appendChild(document.createTextNode(createRule(className, normalizedColor, variant)));
      injectedRules.add(className);
    }
  }

  return className;
}
