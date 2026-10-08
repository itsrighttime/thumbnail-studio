/**
 * Visual identity in one place. Change a font, weight or colour here and every
 * thumbnail (preview + export) follows.
 *
 * Fonts come from the @fontsource packages imported in main.tsx. If you swap a
 * family, install its @fontsource package and import the weight you use there.
 */
export const THEME = {
  bg: '#740e21',
  text: '#ffffff',
  /** Handle line: still white, just a lighter shade. */
  textSoft: 'rgba(255,255,255,0.72)',
  /** Large faded domain text behind everything (a darker shade of the background). */
  backdrop: 'rgba(0,0,0,0.11)',
  fonts: {
    header: 'Oswald',
    headerWeight: 700,
    title: 'Fira Sans',
    titleWeight: 600,
    backdrop: 'Anton',
    backdropWeight: 400,
    handle: 'Fira Sans',
    handleWeight: 600,
    channel: 'Fira Sans',
    channelWeight: 700,
    code: 'Anton',
    codeWeight: 400,
  },
} as const;

export const DEFAULT_BRAND = {
  handle: '@engrdanishan',
  channel: 'Engineer Danishan',
  bg: THEME.bg,
  showLevelInHeader: false,
};
