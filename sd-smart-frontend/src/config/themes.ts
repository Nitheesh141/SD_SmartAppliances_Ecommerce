/**
 * Primary Brand Colors
 * Used for main branding, CTAs, and emphasis
 */
export const PRIMARY_COLORS = {
  red: "#D71920",
  darkGray: "#1C1C1C",
  black: "#000000",
};

/**
 * Secondary Colors
 * Used for supporting UI elements, backgrounds, and hover states
 */
export const SECONDARY_COLORS = {
  lightGray: "#F3F4F6",
  neutralGray: "#6B7280",
  borderGray: "#E5E7EB",
  darkBorder: "#D1D5DB",
  hoverBg: "#FAFAFA",
};

/**
 * Neutral/Grayscale Palette
 * Used for text, borders, and backgrounds
 */
export const NEUTRAL_COLORS = {
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
};

/**
 * Semantic Colors
 * Used for success, warning, danger states
 */
export const SEMANTIC_COLORS = {
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

/**
 * Theme configuration
 * Easy switching between light and dark modes
 */
export const THEME = {
  light: {
    primary: PRIMARY_COLORS.red,
    secondary: PRIMARY_COLORS.darkGray,
    background: NEUTRAL_COLORS.white,
    text: PRIMARY_COLORS.darkGray,
    border: SECONDARY_COLORS.borderGray,
    hover: SECONDARY_COLORS.hoverBg,
  },
  dark: {
    primary: PRIMARY_COLORS.red,
    secondary: NEUTRAL_COLORS.gray300,
    background: NEUTRAL_COLORS.gray900,
    text: NEUTRAL_COLORS.gray100,
    border: NEUTRAL_COLORS.gray700,
    hover: NEUTRAL_COLORS.gray800,
  },
};

/**
 * Tailwind color classes mapped to theme colors
 */
export const THEME_CLASSES = {
  primaryText: "text-[#D71920]",
  primaryBg: "bg-[#D71920]",
  primaryBorder: "border-[#D71920]",
  darkText: "text-[#1C1C1C]",
  hoverPrimaryText: "hover:text-[#D71920]",
  hoverPrimaryBg: "hover:bg-[#D71920]",
  hoverNeutralBg: "hover:bg-neutral-50",
};
