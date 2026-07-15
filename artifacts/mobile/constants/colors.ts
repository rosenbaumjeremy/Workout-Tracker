/**
 * Semantic design tokens for the mobile app.
 *
 * Theme: "Volt Log" — a fitness tracker that feels like the LED glow of a
 * late-night gym session. Near-black surfaces with an electric lime accent
 * that reads as energy and momentum, not decoration.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#12130f',
    tint: '#4E8A00',

    // Core surfaces
    background: '#F5F5F0',
    foreground: '#12130f',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#12130f',

    // Primary action color (buttons, links, active states)
    primary: '#4E8A00',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EAEAE1',
    secondaryForeground: '#12130f',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EAEAE1',
    mutedForeground: '#6E6E64',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E6F7C8',
    accentForeground: '#3D6B00',

    // Destructive actions (delete, error states)
    destructive: '#D8433D',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#DFDFD5',
    input: '#DFDFD5',
  },

  dark: {
    text: '#F4F4EE',
    tint: '#C6FF3D',

    background: '#0A0A0D',
    foreground: '#F4F4EE',

    card: '#161619',
    cardForeground: '#F4F4EE',

    primary: '#C6FF3D',
    primaryForeground: '#0A0A0D',

    secondary: '#1F1F24',
    secondaryForeground: '#F4F4EE',

    muted: '#1F1F24',
    mutedForeground: '#8E8E96',

    accent: '#20241a',
    accentForeground: '#C6FF3D',

    destructive: '#FF5C56',
    destructiveForeground: '#0A0A0D',

    border: '#26262C',
    input: '#1F1F24',
  },

  // Border radius (in px). Applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
