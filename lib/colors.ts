export type PlayerColor = {
  bg: string;
  shadow: string;
  text: string;
  name: string;
};

export const PLAYER_COLORS: PlayerColor[] = [
  { bg: '#FFD600', shadow: '#b89e00', text: '#1a1a1a', name: 'Amarelo' },
  { bg: '#FF6B6B', shadow: '#a03030', text: '#ffffff', name: 'Vermelho' },
  { bg: '#4FC3F7', shadow: '#1a6e99', text: '#ffffff', name: 'Azul' },
  { bg: '#81C784', shadow: '#2e6b30', text: '#ffffff', name: 'Verde' },
  { bg: '#CE93D8', shadow: '#7b3f8a', text: '#ffffff', name: 'Roxo' },
  { bg: '#FFB74D', shadow: '#9a5e00', text: '#1a1a1a', name: 'Laranja' },
  { bg: '#F06292', shadow: '#8f1a44', text: '#ffffff', name: 'Rosa' },
  { bg: '#4DB6AC', shadow: '#1a6b65', text: '#ffffff', name: 'Teal' },
  { bg: '#FFF176', shadow: '#b8a800', text: '#1a1a1a', name: 'Limão' },
  { bg: '#90CAF9', shadow: '#1a4a8a', text: '#1a1a1a', name: 'Celeste' },
  { bg: '#FFAB91', shadow: '#a03010', text: '#1a1a1a', name: 'Salmão' },
  { bg: '#B0BEC5', shadow: '#455A64', text: '#1a1a1a', name: 'Prata' },
];

export const colorFor = (i: number): PlayerColor =>
  PLAYER_COLORS[i % PLAYER_COLORS.length]!;

export const IMP_EMOJIS = ['🕵️', '🦹', '🎭', '👺', '🤫'] as const;
