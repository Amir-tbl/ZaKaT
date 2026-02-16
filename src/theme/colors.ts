export const colors = {
  primary: '#0EA5A4',
  primaryDark: '#0B7A7A',
  accent: '#3B82F6',
  background: '#F6FAFB',
  surface: '#FFFFFF',
  text: '#0F172A',
  mutedText: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E2E8F0',
} as const;

export type ColorKey = keyof typeof colors;
