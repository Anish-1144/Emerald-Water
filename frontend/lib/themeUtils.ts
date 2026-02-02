// Theme utility functions for consistent theming across components

export const themeStyles = {
  background: { backgroundColor: 'var(--background)' },
  cardBg: { backgroundColor: 'var(--card-bg)' },
  border: { borderColor: 'var(--border-color)' },
  textPrimary: { color: 'var(--text-primary)' },
  textSecondary: { color: 'var(--text-secondary)' },
  textMuted: { color: 'var(--text-muted)' },
  inputBg: { backgroundColor: 'var(--input-bg)' },
  inputBorder: { borderColor: 'var(--input-border)' },
  hoverBg: { backgroundColor: 'var(--hover-bg)' },
};

export const getThemeClasses = {
  container: 'transition-colors',
  card: 'transition-colors',
  text: 'transition-colors',
  input: 'transition-colors',
  button: 'transition-colors',
};

