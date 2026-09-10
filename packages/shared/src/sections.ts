import type { PageSection, SectionType } from './types';

/* ------------------------------------------------------------------ */
/* Field schema — the admin renders section settings forms from this  */
/* ------------------------------------------------------------------ */

export interface SectionFieldBase {
  key: string;
  label: string;
  help?: string;
  /** Group name for tabs/accordion inside the settings drawer. */
  group?: string;
  /** Show only when another field has the given value. */
  showIf?: { key: string; equals: unknown };
}

export type SectionField =
  | (SectionFieldBase & { type: 'text' | 'textarea' | 'url'; placeholder?: string; maxLength?: number })
  | (SectionFieldBase & { type: 'toggle' })
  | (SectionFieldBase & { type: 'number' | 'range'; min: number; max: number; step?: number; unit?: string })
  | (SectionFieldBase & { type: 'select'; options: { value: string; label: string }[] })
  | (SectionFieldBase & { type: 'media'; accept: 'image' | 'gif' | 'any' })
  | (SectionFieldBase & { type: 'media-list' })
  | (SectionFieldBase & { type: 'list'; itemLabel: string; fields: SectionField[]; max?: number });

export interface SectionDefinition {
  type: SectionType;
  label: string;
  description: string;
  /** Lucide icon name for the admin builder. */
  icon: string;
  /** Header/footer: pinned, cannot be removed or reordered. */
  locked?: boolean;
  /** Only one instance allowed. */
  unique?: boolean;
  defaults: Record<string, unknown>;
  fields: SectionField[];
}

/* ------------------------------------------------------------------ */
/* Typed settings per section (what the client reads)                 */
/* ------------------------------------------------------------------ */

export interface HeaderSettings {
  showLogo: boolean;
  showName: boolean;
  showTagline: boolean;
  showNav: boolean;
  showStatus: boolean;
  showCart: boolean;
  sticky: boolean;
  background: 'solid' | 'blur' | 'transparent';
  height: 'compact' | 'normal' | 'tall';
  ctaLabel: string;
  ctaUrl: string;
}

export interface HeroSettings {
  title: string;
  subtitle: string;
  layout: 'split' | 'centered' | 'cover';
  imageId: string | null;
  gifId: string | null;
  backgroundImageId: string | null;
  overlayOpacity: number;
  showStatus: boolean;
  primaryCtaLabel: string;
  primaryCtaAction: 'menu' | 'url' | 'none';
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  height: 'compact' | 'normal' | 'tall';
}

export interface MenuSectionSettings {
  title: string;
  subtitle: string;
  showMenuTabs: boolean;
  showCategoryNav: boolean;
  cardStyle: 'cards' | 'list' | 'compact';
  columnsDesktop: number;
  columnsTablet: number;
  columnsMobile: number;
  showImages: boolean;
  showDescriptions: boolean;
  showTags: boolean;
  showUnavailable: boolean;
  imageAspect: '1:1' | '4:3' | '3:2' | '16:9';
}

export interface RecommendedSettings {
  title: string;
  subtitle: string;
  source: 'recommended' | 'popular' | 'new';
  limit: number;
}

export interface PromotionItem {
  id: string;
  title: string;
  text: string;
  badge: string;
  imageId: string | null;
  gifId: string | null;
  url: string;
}

export interface PromotionsSettings {
  title: string;
  subtitle: string;
  layout: 'grid' | 'carousel';
  items: PromotionItem[];
}

export interface AboutFeature {
  id: string;
  icon: string;
  title: string;
  text: string;
}

export interface AboutSettings {
  title: string;
  text: string;
  imageId: string | null;
  gifId: string | null;
  imagePosition: 'left' | 'right';
  features: AboutFeature[];
}

export interface GallerySettings {
  title: string;
  subtitle: string;
  mediaIds: string[];
  layout: 'grid' | 'masonry';
  columns: number;
}

export interface HoursSettings {
  title: string;
  note: string;
  showAllSchedules: boolean;
}

export interface ContactsSettings {
  title: string;
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  showMap: boolean;
  showWhatsapp: boolean;
}

export interface SocialSettings {
  title: string;
  style: 'icons' | 'buttons';
}

export interface FooterSettings {
  text: string;
  showLogo: boolean;
  showContacts: boolean;
  showHours: boolean;
  showSocial: boolean;
  copyright: string;
}

export interface SectionSettingsMap {
  header: HeaderSettings;
  hero: HeroSettings;
  menu: MenuSectionSettings;
  recommended: RecommendedSettings;
  promotions: PromotionsSettings;
  about: AboutSettings;
  gallery: GallerySettings;
  hours: HoursSettings;
  contacts: ContactsSettings;
  social: SocialSettings;
  footer: FooterSettings;
}

/* ------------------------------------------------------------------ */
/* Definitions                                                         */
/* ------------------------------------------------------------------ */

const mediaField = (key: string, label: string, accept: 'image' | 'gif' | 'any', group?: string, help?: string): SectionField => ({
  key,
  label,
  type: 'media',
  accept,
  group,
  help,
});

export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
  header: {
    type: 'header',
    label: 'Шапка',
    description: 'Логотип, название, навигация и кнопка корзины.',
    icon: 'panel-top',
    locked: true,
    unique: true,
    defaults: {
      showLogo: true,
      showName: true,
      showTagline: false,
      showNav: true,
      showStatus: true,
      showCart: true,
      sticky: true,
      background: 'blur',
      height: 'normal',
      ctaLabel: '',
      ctaUrl: '',
    } satisfies HeaderSettings,
    fields: [
      { key: 'showLogo', label: 'Показывать логотип', type: 'toggle', group: 'Элементы' },
      { key: 'showName', label: 'Показывать название', type: 'toggle', group: 'Элементы' },
      { key: 'showTagline', label: 'Показывать слоган', type: 'toggle', group: 'Элементы' },
      { key: 'showNav', label: 'Навигация по разделам', type: 'toggle', group: 'Элементы' },
      { key: 'showStatus', label: 'Статус «открыто/закрыто»', type: 'toggle', group: 'Элементы' },
      { key: 'showCart', label: 'Кнопка корзины', type: 'toggle', group: 'Элементы' },
      { key: 'sticky', label: 'Закрепить при прокрутке', type: 'toggle', group: 'Вид' },
      {
        key: 'background',
        label: 'Фон',
        type: 'select',
        group: 'Вид',
        options: [
          { value: 'blur', label: 'Полупрозрачный с размытием' },
          { value: 'solid', label: 'Сплошной' },
          { value: 'transparent', label: 'Прозрачный' },
        ],
      },
      {
        key: 'height',
        label: 'Высота',
        type: 'select',
        group: 'Вид',
        options: [
          { value: 'compact', label: 'Компактная' },
          { value: 'normal', label: 'Обычная' },
          { value: 'tall', label: 'Высокая' },
        ],
      },
      { key: 'ctaLabel', label: 'Текст кнопки', type: 'text', group: 'Кнопка', placeholder: 'Например: Забронировать' },
      { key: 'ctaUrl', label: 'Ссылка кнопки', type: 'url', group: 'Кнопка', placeholder: 'https://…' },
    ],
  },

  hero: {
    type: 'hero',
    label: 'Главный экран',
    description: 'Первый экран с заголовком, изображением и кнопкой.',
    icon: 'image',
    unique: true,
    defaults: {
      title: 'Вкус · Уют · Гармония',
      subtitle: 'Кофейня с домашней кухней. Завтраки весь день, свежая выпечка и кофе, который хочется повторить.',
      layout: 'split',
      imageId: null,
      gifId: null,
      backgroundImageId: null,
      overlayOpacity: 40,
      showStatus: true,
      primaryCtaLabel: 'Смотреть меню',
      primaryCtaAction: 'menu',
      primaryCtaUrl: '',
      secondaryCtaLabel: '',
      secondaryCtaUrl: '',
      height: 'normal',
    } satisfies HeroSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text', group: 'Тексты' },
      { key: 'subtitle', label: 'Описание', type: 'textarea', group: 'Тексты' },
      { key: 'showStatus', label: 'Показывать статус работы', type: 'toggle', group: 'Тексты' },
      {
        key: 'layout',
        label: 'Компоновка',
        type: 'select',
        group: 'Вид',
        options: [
          { value: 'split', label: 'Текст слева, изображение справа' },
          { value: 'centered', label: 'По центру' },
          { value: 'cover', label: 'Изображение на весь экран' },
        ],
      },
      {
        key: 'height',
        label: 'Высота',
        type: 'select',
        group: 'Вид',
        options: [
          { value: 'compact', label: 'Компактная' },
          { value: 'normal', label: 'Обычная' },
          { value: 'tall', label: 'Во весь экран' },
        ],
      },
      mediaField('imageId', 'Изображение', 'image', 'Медиа', 'Показывается рядом с текстом.'),
      mediaField('gifId', 'GIF (вместо изображения)', 'gif', 'Медиа', 'Если задан, показывается GIF.'),
      mediaField('backgroundImageId', 'Фоновое изображение', 'image', 'Медиа', 'Используется для компоновки «на весь экран».'),
      { key: 'overlayOpacity', label: 'Затемнение фона', type: 'range', min: 0, max: 90, step: 5, unit: '%', group: 'Медиа', showIf: { key: 'layout', equals: 'cover' } },
      { key: 'primaryCtaLabel', label: 'Текст основной кнопки', type: 'text', group: 'Кнопки' },
      {
        key: 'primaryCtaAction',
        label: 'Действие основной кнопки',
        type: 'select',
        group: 'Кнопки',
        options: [
          { value: 'menu', label: 'Прокрутить к меню' },
          { value: 'url', label: 'Открыть ссылку' },
          { value: 'none', label: 'Скрыть кнопку' },
        ],
      },
      { key: 'primaryCtaUrl', label: 'Ссылка основной кнопки', type: 'url', group: 'Кнопки', showIf: { key: 'primaryCtaAction', equals: 'url' } },
      { key: 'secondaryCtaLabel', label: 'Текст второй кнопки', type: 'text', group: 'Кнопки' },
      { key: 'secondaryCtaUrl', label: 'Ссылка второй кнопки', type: 'url', group: 'Кнопки' },
    ],
  },

  menu: {
    type: 'menu',
    label: 'Меню',
    description: 'Блюда по категориям с добавлением в корзину.',
    icon: 'utensils',
    unique: true,
    defaults: {
      title: 'Меню',
      subtitle: '',
      showMenuTabs: true,
      showCategoryNav: true,
      cardStyle: 'cards',
      columnsDesktop: 3,
      columnsTablet: 2,
      columnsMobile: 1,
      showImages: true,
      showDescriptions: true,
      showTags: true,
      showUnavailable: true,
      imageAspect: '4:3',
    } satisfies MenuSectionSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text', group: 'Тексты' },
      { key: 'subtitle', label: 'Подзаголовок', type: 'textarea', group: 'Тексты' },
      { key: 'showMenuTabs', label: 'Переключатель меню (Кухня / Бар)', type: 'toggle', group: 'Навигация' },
      { key: 'showCategoryNav', label: 'Навигация по категориям', type: 'toggle', group: 'Навигация' },
      {
        key: 'cardStyle',
        label: 'Стиль карточек',
        type: 'select',
        group: 'Карточки',
        options: [
          { value: 'cards', label: 'Карточки с фото' },
          { value: 'list', label: 'Список' },
          { value: 'compact', label: 'Компактный список' },
        ],
      },
      {
        key: 'imageAspect',
        label: 'Пропорции фото',
        type: 'select',
        group: 'Карточки',
        options: [
          { value: '1:1', label: 'Квадрат' },
          { value: '4:3', label: '4:3' },
          { value: '3:2', label: '3:2' },
          { value: '16:9', label: '16:9' },
        ],
      },
      { key: 'showImages', label: 'Показывать фото', type: 'toggle', group: 'Карточки' },
      { key: 'showDescriptions', label: 'Показывать описания', type: 'toggle', group: 'Карточки' },
      { key: 'showTags', label: 'Показывать теги и метки', type: 'toggle', group: 'Карточки' },
      { key: 'showUnavailable', label: 'Показывать блюда «нет в наличии»', type: 'toggle', group: 'Карточки', help: 'Иначе они скрываются с сайта до возвращения.' },
      { key: 'columnsDesktop', label: 'Колонок на компьютере', type: 'range', min: 2, max: 4, step: 1, group: 'Сетка' },
      { key: 'columnsTablet', label: 'Колонок на планшете', type: 'range', min: 1, max: 3, step: 1, group: 'Сетка' },
      { key: 'columnsMobile', label: 'Колонок на телефоне', type: 'range', min: 1, max: 2, step: 1, group: 'Сетка' },
    ],
  },

  recommended: {
    type: 'recommended',
    label: 'Рекомендуем',
    description: 'Горизонтальная лента избранных блюд.',
    icon: 'sparkles',
    unique: true,
    defaults: { title: 'Рекомендуем попробовать', subtitle: '', source: 'recommended', limit: 8 } satisfies RecommendedSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'subtitle', label: 'Подзаголовок', type: 'text' },
      {
        key: 'source',
        label: 'Какие блюда показывать',
        type: 'select',
        options: [
          { value: 'recommended', label: 'Отмеченные как «Рекомендуем»' },
          { value: 'popular', label: 'Популярные' },
          { value: 'new', label: 'Новинки' },
        ],
      },
      { key: 'limit', label: 'Максимум блюд', type: 'range', min: 3, max: 12, step: 1 },
    ],
  },

  promotions: {
    type: 'promotions',
    label: 'Акции',
    description: 'Баннеры с акциями, новостями или сезонными предложениями.',
    icon: 'megaphone',
    defaults: { title: 'Акции и новости', subtitle: '', layout: 'grid', items: [] } satisfies PromotionsSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'subtitle', label: 'Подзаголовок', type: 'text' },
      {
        key: 'layout',
        label: 'Расположение',
        type: 'select',
        options: [
          { value: 'grid', label: 'Сетка' },
          { value: 'carousel', label: 'Лента' },
        ],
      },
      {
        key: 'items',
        label: 'Баннеры',
        type: 'list',
        itemLabel: 'Баннер',
        max: 8,
        fields: [
          { key: 'title', label: 'Заголовок', type: 'text' },
          { key: 'text', label: 'Текст', type: 'textarea' },
          { key: 'badge', label: 'Метка', type: 'text', placeholder: 'Например: −20%' },
          mediaField('imageId', 'Изображение', 'image'),
          mediaField('gifId', 'GIF', 'gif'),
          { key: 'url', label: 'Ссылка', type: 'url' },
        ],
      },
    ],
  },

  about: {
    type: 'about',
    label: 'О заведении',
    description: 'Текст о заведении, фото и преимущества.',
    icon: 'info',
    unique: true,
    defaults: {
      title: 'О нас',
      text: 'Меренда — больше, чем просто еда. Ароматный кофе, свежие продукты и уютная атмосфера каждый день.',
      imageId: null,
      gifId: null,
      imagePosition: 'right',
      features: [
        { id: 'f1', icon: 'coffee', title: 'Ароматный кофе', text: 'Свежая обжарка и бариста, которые любят своё дело.' },
        { id: 'f2', icon: 'leaf', title: 'Свежие продукты', text: 'Готовим из проверенных сезонных продуктов.' },
        { id: 'f3', icon: 'heart', title: 'Уютная атмосфера', text: 'Место, куда хочется возвращаться.' },
      ],
    } satisfies AboutSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text', group: 'Тексты' },
      { key: 'text', label: 'Текст', type: 'textarea', group: 'Тексты' },
      mediaField('imageId', 'Изображение', 'image', 'Медиа'),
      mediaField('gifId', 'GIF (вместо изображения)', 'gif', 'Медиа'),
      {
        key: 'imagePosition',
        label: 'Положение изображения',
        type: 'select',
        group: 'Медиа',
        options: [
          { value: 'right', label: 'Справа' },
          { value: 'left', label: 'Слева' },
        ],
      },
      {
        key: 'features',
        label: 'Преимущества',
        type: 'list',
        itemLabel: 'Преимущество',
        max: 6,
        group: 'Преимущества',
        fields: [
          { key: 'icon', label: 'Иконка (Lucide)', type: 'text', placeholder: 'coffee, leaf, heart, star…' },
          { key: 'title', label: 'Заголовок', type: 'text' },
          { key: 'text', label: 'Текст', type: 'textarea' },
        ],
      },
    ],
  },

  gallery: {
    type: 'gallery',
    label: 'Галерея',
    description: 'Фотографии интерьера и блюд.',
    icon: 'images',
    defaults: { title: 'Галерея', subtitle: '', mediaIds: [], layout: 'grid', columns: 3 } satisfies GallerySettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'subtitle', label: 'Подзаголовок', type: 'text' },
      { key: 'mediaIds', label: 'Изображения', type: 'media-list' },
      {
        key: 'layout',
        label: 'Расположение',
        type: 'select',
        options: [
          { value: 'grid', label: 'Сетка' },
          { value: 'masonry', label: 'Плитка' },
        ],
      },
      { key: 'columns', label: 'Колонок', type: 'range', min: 2, max: 4, step: 1 },
    ],
  },

  hours: {
    type: 'hours',
    label: 'Режим работы',
    description: 'Часы работы заведения, кухни и бара по дням недели.',
    icon: 'clock',
    unique: true,
    defaults: { title: 'Режим работы', note: '', showAllSchedules: true } satisfies HoursSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'note', label: 'Примечание', type: 'textarea', placeholder: 'Например: последний заказ за 30 минут до закрытия' },
      { key: 'showAllSchedules', label: 'Показывать кухню и бар отдельно', type: 'toggle' },
    ],
  },

  contacts: {
    type: 'contacts',
    label: 'Контакты',
    description: 'Телефон, адрес, карта.',
    icon: 'map-pin',
    unique: true,
    defaults: { title: 'Контакты', showPhone: true, showEmail: true, showAddress: true, showMap: true, showWhatsapp: true } satisfies ContactsSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'showPhone', label: 'Телефон', type: 'toggle' },
      { key: 'showWhatsapp', label: 'Кнопка WhatsApp', type: 'toggle' },
      { key: 'showEmail', label: 'E-mail', type: 'toggle' },
      { key: 'showAddress', label: 'Адрес', type: 'toggle' },
      { key: 'showMap', label: 'Карта', type: 'toggle', help: 'Ссылка на карту задаётся в Настройки → Контакты.' },
    ],
  },

  social: {
    type: 'social',
    label: 'Соцсети',
    description: 'Ссылки на социальные сети.',
    icon: 'share-2',
    unique: true,
    defaults: { title: 'Мы в соцсетях', style: 'buttons' } satisfies SocialSettings,
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      {
        key: 'style',
        label: 'Стиль',
        type: 'select',
        options: [
          { value: 'buttons', label: 'Кнопки' },
          { value: 'icons', label: 'Иконки' },
        ],
      },
    ],
  },

  footer: {
    type: 'footer',
    label: 'Подвал',
    description: 'Нижняя часть сайта с контактами и подписью.',
    icon: 'panel-bottom',
    locked: true,
    unique: true,
    defaults: {
      text: 'Меренда — больше, чем просто еда ♥',
      showLogo: true,
      showContacts: true,
      showHours: true,
      showSocial: true,
      copyright: '',
    } satisfies FooterSettings,
    fields: [
      { key: 'text', label: 'Текст', type: 'text' },
      { key: 'copyright', label: 'Подпись', type: 'text', placeholder: '© Меренда' },
      { key: 'showLogo', label: 'Логотип', type: 'toggle' },
      { key: 'showContacts', label: 'Контакты', type: 'toggle' },
      { key: 'showHours', label: 'Часы работы', type: 'toggle' },
      { key: 'showSocial', label: 'Соцсети', type: 'toggle' },
    ],
  },
};

/** Sections a user can add from the builder (non-locked). */
export const ADDABLE_SECTION_TYPES: SectionType[] = (Object.keys(SECTION_DEFINITIONS) as SectionType[]).filter(
  (t) => !SECTION_DEFINITIONS[t].locked,
);

/** Merge stored settings over defaults so every field is present and typed. */
export function getSectionSettings<T extends SectionType>(section: PageSection): SectionSettingsMap[T] {
  const def = SECTION_DEFINITIONS[section.type];
  return { ...(def.defaults as object), ...(section.settings as object) } as SectionSettingsMap[T];
}

export function sectionDefaults<T extends SectionType>(type: T): SectionSettingsMap[T] {
  return { ...(SECTION_DEFINITIONS[type].defaults as object) } as SectionSettingsMap[T];
}
