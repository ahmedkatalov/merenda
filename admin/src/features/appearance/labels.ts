import type { ThemeColors } from '@merenda/shared';

export const COLOR_GROUPS: { title: string; keys: (keyof ThemeColors)[] }[] = [
  { title: 'Основные', keys: ['primary', 'primaryHover', 'primaryActive', 'onPrimary', 'secondary', 'accent', 'onAccent'] },
  { title: 'Поверхности', keys: ['background', 'surface', 'surfaceAlt', 'border'] },
  { title: 'Текст', keys: ['text', 'textMuted', 'heading'] },
  { title: 'Состояния', keys: ['success', 'warning', 'danger', 'disabled'] },
];

export const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: 'Основной',
  primaryHover: 'Основной — наведение',
  primaryActive: 'Основной — нажатие',
  onPrimary: 'Текст на основном',
  secondary: 'Вторичный',
  accent: 'Акцент',
  onAccent: 'Текст на акценте',
  background: 'Фон страницы',
  surface: 'Карточки',
  surfaceAlt: 'Карточки — альтернативный',
  border: 'Границы',
  text: 'Текст',
  textMuted: 'Приглушённый текст',
  heading: 'Заголовки',
  success: 'Успех',
  warning: 'Предупреждение',
  danger: 'Ошибка',
  disabled: 'Недоступно',
};

export const FONT_CATEGORY_LABELS = { sans: 'Без засечек', serif: 'С засечками', display: 'Акцидентные' } as const;

export const SHADOW_OPTIONS = [
  { value: 'none', label: 'Без тени' },
  { value: 'sm', label: 'Лёгкая' },
  { value: 'md', label: 'Средняя' },
  { value: 'lg', label: 'Глубокая' },
];

export const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Плотный' },
  { value: 'comfortable', label: 'Обычный' },
  { value: 'spacious', label: 'Просторный' },
] as const;

export const BUTTON_STYLE_OPTIONS = [
  { value: 'solid', label: 'Заливка' },
  { value: 'soft', label: 'Мягкий' },
  { value: 'outline', label: 'Контур' },
] as const;
