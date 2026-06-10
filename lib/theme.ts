export type ColorScheme = 'light';

export type Colors = {
  bg: string;
  accent: string;
  accentShadow: string;
  ink: string;
  inkInverse: string;
  white: string;
  danger: string;
  dangerShadow: string;
  success: string;
  warning: string;
  surface: string;
  surfaceAlt: string;
  grayLight: string;
  grayMid: string;
  grayDark: string;
  shadow: string;
  border: string;
  textMuted: string;
};

const LIGHT: Colors = {
  bg: '#EBEBEB',
  accent: '#AAEE00',
  accentShadow: '#7ab000',
  ink: '#1A1A1A',
  inkInverse: '#FFFFFF',
  white: '#FFFFFF',
  danger: '#E53935',
  dangerShadow: '#8b1a17',
  success: '#43A047',
  warning: '#FFB300',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7',
  grayLight: '#F7F7F7',
  grayMid: '#CCCCCC',
  grayDark: '#666666',
  shadow: '#1A1A1A',
  border: '#1A1A1A',
  textMuted: '#666666',
};

// Mantido como hook por compatibilidade — sempre retorna LIGHT.
export function useColors(): Colors {
  return LIGHT;
}

export function getColors(): Colors {
  return LIGHT;
}

export const theme = {
  colors: LIGHT,
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 28,
    pill: 999,
  },
  shadow: {
    offset: 4,
    color: '#1A1A1A',
  },
  font: {
    display: 'BebasNeue_400Regular',
    body: 'Nunito_700Bold',
    bodyHeavy: 'Nunito_900Black',
    bodyMid: 'Nunito_600SemiBold',
  },
} as const;

export type Theme = typeof theme;
