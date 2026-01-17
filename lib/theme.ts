import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

// Pulse Theme Colors
export const PULSE_COLORS = {
  light: {
    background: '#fafafa',
    foreground: '#18181b',
    card: '#ffffff',
    cardForeground: '#18181b',
    primary: '#e879f9',      // Fuchsia-400
    primaryForeground: '#18181b',
    secondary: '#d946ef',    // Fuchsia-500
    secondaryForeground: '#fafafa',
    muted: '#e4e4e7',        // Zinc-200
    mutedForeground: '#71717a',
    accent: '#a21caf',       // Fuchsia-700
    accentForeground: '#fafafa',
    border: '#e4e4e7',
    input: '#e4e4e7',
    destructive: '#ef4444',
  },
  dark: {
    background: '#09090b',   // Zinc-950
    foreground: '#fafafa',   // Zinc-50
    card: '#18181b',         // Zinc-900
    cardForeground: '#fafafa',
    primary: '#d946ef',      // Fuchsia-500
    primaryForeground: '#fafafa',
    secondary: '#a21caf',    // Fuchsia-700
    secondaryForeground: '#fafafa',
    muted: '#27272a',        // Zinc-800
    mutedForeground: '#a1a1aa',
    accent: '#e879f9',       // Fuchsia-400
    accentForeground: '#18181b',
    border: '#27272a',
    input: '#27272a',
    destructive: '#dc2626',
  },
};

// Heatmap color scale
export const HEATMAP_COLORS = {
  none: '#27272a',       // Zinc-800 - 0 hours
  low: '#701a75',        // Fuchsia-900 - 1-2 hours
  medium: '#a21caf',     // Fuchsia-700 - 2-4 hours
  high: '#d946ef',       // Fuchsia-500 - 4+ hours
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: PULSE_COLORS.light.background,
      border: PULSE_COLORS.light.border,
      card: PULSE_COLORS.light.card,
      notification: PULSE_COLORS.light.destructive,
      primary: PULSE_COLORS.light.primary,
      text: PULSE_COLORS.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: PULSE_COLORS.dark.background,
      border: PULSE_COLORS.dark.border,
      card: PULSE_COLORS.dark.card,
      notification: PULSE_COLORS.dark.destructive,
      primary: PULSE_COLORS.dark.primary,
      text: PULSE_COLORS.dark.foreground,
    },
  },
};