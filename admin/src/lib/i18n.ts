import type { Availability, MediaKind, OrderStatus, SocialType, VenueMode } from '@merenda/shared';

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: 'В наличии',
  unavailable: 'Нет в наличии',
  hidden: 'Скрыто',
};

export const AVAILABILITY_SHORT: Record<Availability, string> = {
  available: 'Есть',
  unavailable: 'Нет',
  hidden: 'Скрыто',
};

export const AVAILABILITY_DESC: Record<Availability, string> = {
  available: 'Гости могут добавить блюдо в корзину.',
  unavailable: 'Видно на сайте с пометкой «нет в наличии».',
  hidden: 'Полностью скрыто с сайта.',
};

export const ORDER_STATUS_FILTER_LABELS: Record<OrderStatus | 'all', string> = {
  new: 'Новые',
  confirmed: 'Подтверждённые',
  completed: 'Выполненные',
  cancelled: 'Отменённые',
  all: 'Все',
};

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  image: 'Фото',
  gif: 'GIF',
};

export const SOCIAL_TYPE_LABELS: Record<SocialType, string> = {
  instagram: 'Instagram',
  telegram: 'Telegram',
  vk: 'VK',
  whatsapp: 'WhatsApp',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  website: 'Сайт',
  other: 'Другое',
};

export const VENUE_MODE_LABELS: Record<VenueMode, string> = {
  auto: 'Работает по расписанию',
  temporarily_closed: 'Временно закрыто',
};

export const ERROR_MESSAGES: Record<string, string> = {
  validation_error: 'Проверьте заполненные поля',
  unauthorized: 'Нужно войти заново',
  forbidden: 'Недостаточно прав',
  not_found: 'Не найдено',
  conflict: 'Конфликт данных: такая запись уже существует',
  payload_too_large: 'Файл слишком большой',
  unsupported_media: 'Неподдерживаемый формат файла',
  rate_limited: 'Слишком много запросов. Подождите минуту и попробуйте снова',
  internal: 'Ошибка сервера. Попробуйте ещё раз',
  network: 'Нет соединения с сервером',
};

export const WARNING_LINKS: Record<string, string> = {
  whatsapp_number_missing: '/whatsapp',
  whatsapp_missing: '/whatsapp',
  orders_disabled: '/whatsapp',
  no_menus: '/menus',
  no_categories: '/categories',
  no_products: '/products',
  no_logo: '/settings',
  seo_missing: '/settings',
  seo_title_missing: '/settings',
  contacts_missing: '/settings',
  phone_missing: '/settings',
  address_missing: '/settings',
  hours_missing: '/hours',
  temporarily_closed: '/hours',
  hidden_products: '/products',
  unavailable_products: '/products',
  default_password: '/security',
  weak_password: '/security',
};

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
