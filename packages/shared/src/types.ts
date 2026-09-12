/**
 * Merenda — shared API contract.
 *
 * This file is the single source of truth for the JSON shapes exchanged between
 * the Go backend, the client site (frontend/) and the admin CMS (admin/).
 * Backend structs use camelCase JSON tags matching these fields exactly.
 *
 * Conventions
 *  - All ids are UUID strings.
 *  - Dates/times are ISO-8601 strings in UTC (e.g. "2026-09-10T12:00:00Z").
 *  - Money is stored/transferred in minor units (kopecks): 35000 = 350.00 ₽.
 *  - Weekdays are 0..6 where 0 = Monday, 6 = Sunday.
 *  - Times of day are "HH:MM" (24h). If closesAt <= opensAt the interval
 *    crosses midnight (e.g. 18:00 → 02:00).
 */

export type UUID = string;
export type ISODateTime = string;
export type ISODate = string; // YYYY-MM-DD
export type TimeOfDay = string; // HH:MM

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export type Availability = 'available' | 'unavailable' | 'hidden';
export const AVAILABILITY_VALUES: Availability[] = ['available', 'unavailable', 'hidden'];

export type OrderType = 'dine_in' | 'takeaway';
export const ORDER_TYPE_VALUES: OrderType[] = ['dine_in', 'takeaway'];

export type OrderStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';
export const ORDER_STATUS_VALUES: OrderStatus[] = ['new', 'confirmed', 'completed', 'cancelled'];

/** How the venue status is decided: by schedule or forced closed by the admin. */
export type VenueMode = 'auto' | 'temporarily_closed';

export type MediaKind = 'image' | 'gif';

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export interface Media {
  id: UUID;
  kind: MediaKind;
  mime: string;
  /** Original file URL (absolute path like /uploads/ab/abcd.jpg or absolute URL). */
  url: string;
  /** ≤ 480px variant. Equals `url` for GIFs (animation must be preserved). */
  thumbUrl: string;
  /** ≤ 1400px variant. Equals `url` for GIFs. */
  mediumUrl: string;
  width: number;
  height: number;
  /** Bytes. */
  size: number;
  originalName: string;
  alt: string;
  createdAt: ISODateTime;
}

/* ------------------------------------------------------------------ */
/* Menu structure                                                      */
/* ------------------------------------------------------------------ */

export interface Menu {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  /** Lucide icon name (e.g. "utensils", "coffee"). Optional. */
  icon: string;
  sortOrder: number;
  isActive: boolean;
  /** Schedule that governs when this menu is orderable (e.g. kitchen hours). null = venue hours. */
  scheduleId: UUID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Category {
  id: UUID;
  menuId: UUID;
  slug: string;
  name: string;
  description: string;
  imageId: UUID | null;
  image: Media | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ProductAttribute {
  /** e.g. "Вес" */
  label: string;
  /** e.g. "250 г" */
  value: string;
}

export interface Product {
  id: UUID;
  categoryId: UUID;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  oldPriceMinor: number | null;
  imageId: UUID | null;
  image: Media | null;
  gifId: UUID | null;
  gif: Media | null;
  availability: Availability;
  isPopular: boolean;
  isRecommended: boolean;
  isNew: boolean;
  tags: string[];
  attributes: ProductAttribute[];
  sortOrder: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Admin list view joins menu/category names for convenience. */
export interface ProductListItem extends Product {
  categoryName: string;
  menuId: UUID;
  menuName: string;
}

/* ---- admin write payloads ---- */

export interface MenuInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  scheduleId?: UUID | null;
}

export interface CategoryInput {
  menuId: UUID;
  name: string;
  slug?: string;
  description?: string;
  imageId?: UUID | null;
  isActive?: boolean;
}

export interface ProductInput {
  categoryId: UUID;
  name: string;
  slug?: string;
  description?: string;
  priceMinor: number;
  oldPriceMinor?: number | null;
  imageId?: UUID | null;
  gifId?: UUID | null;
  availability?: Availability;
  isPopular?: boolean;
  isRecommended?: boolean;
  isNew?: boolean;
  tags?: string[];
  attributes?: ProductAttribute[];
}

export interface ReorderRequest {
  /** Ordered ids; sortOrder is assigned by index. */
  ids: UUID[];
}

/* ---- public menu payload ---- */

export interface PublicCategory extends Category {
  products: Product[]; // availability !== 'hidden'
}

export interface PublicMenu extends Menu {
  categories: PublicCategory[]; // isActive only
}

export interface PublicMenuResponse {
  menus: PublicMenu[];
}

/* ------------------------------------------------------------------ */
/* Working hours                                                       */
/* ------------------------------------------------------------------ */

export type ScheduleKind = 'venue' | 'custom';

export interface ScheduleDay {
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  isClosed: boolean;
  opensAt: TimeOfDay;
  closesAt: TimeOfDay;
}

export interface ScheduleException {
  id: UUID;
  scheduleId: UUID;
  date: ISODate;
  isClosed: boolean;
  opensAt: TimeOfDay | null;
  closesAt: TimeOfDay | null;
  note: string;
}

export interface Schedule {
  id: UUID;
  /** Stable key: "venue" for the venue itself; free-form for others ("kitchen", "bar"). */
  key: string;
  name: string;
  kind: ScheduleKind;
  sortOrder: number;
  hours: ScheduleDay[]; // always 7 entries, weekday 0..6
  exceptions: ScheduleException[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ScheduleInput {
  name: string;
  key?: string;
}

export interface ScheduleHoursInput {
  hours: ScheduleDay[];
}

export interface ScheduleExceptionInput {
  date: ISODate;
  isClosed: boolean;
  opensAt?: TimeOfDay | null;
  closesAt?: TimeOfDay | null;
  note?: string;
}

/** Computed status for one schedule at server time. */
export interface ScheduleStatus {
  scheduleId: UUID;
  key: string;
  name: string;
  isOpen: boolean;
  /** Today's interval (or null when closed today). */
  opensAt: TimeOfDay | null;
  closesAt: TimeOfDay | null;
  /** Next moment the schedule opens, when currently closed. */
  nextOpenAt: ISODateTime | null;
  /** Human text, e.g. "Кухня работает до 21:00" / "Кухня откроется в 11:00". */
  message: string;
}

export interface SiteStatus {
  serverTime: ISODateTime;
  timezone: string;
  venue: {
    mode: VenueMode;
    /** false when temporarily closed regardless of schedule. */
    isOpen: boolean;
    /** Admin-provided reason when temporarily closed. */
    closedMessage: string;
    /** e.g. "Сегодня открыто до 22:00" */
    message: string;
    opensAt: TimeOfDay | null;
    closesAt: TimeOfDay | null;
    nextOpenAt: ISODateTime | null;
  };
  /** Custom schedules (kitchen, bar, …) — never includes the venue schedule. */
  schedules: ScheduleStatus[];
}

/* ------------------------------------------------------------------ */
/* Settings (key/value, each key has a typed shape)                    */
/* ------------------------------------------------------------------ */

export interface Currency {
  code: string; // "RUB"
  symbol: string; // "₽"
  decimals: number; // 0 or 2
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  description: string;
  logoId: UUID | null;
  faviconId: UUID | null;
  currency: Currency;
  timezone: string; // IANA, e.g. "Europe/Moscow"
}

export type SocialType = 'instagram' | 'telegram' | 'vk' | 'whatsapp' | 'youtube' | 'tiktok' | 'website' | 'other';

export interface SocialLink {
  id: string;
  type: SocialType;
  label: string;
  url: string;
}

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  addressNote: string;
  /** External map link (e.g. Yandex Maps share URL). */
  mapUrl: string;
  /** iframe embed URL for the map block. */
  mapEmbedUrl: string;
  social: SocialLink[];
}

export interface OrderSettings {
  /** Master switch for ordering on the site. */
  enabled: boolean;
  /** E.164-ish digits, e.g. "+49 151 2345678". Empty = orders are stored only, no WhatsApp handoff. */
  whatsappNumber: string;
  allowDineIn: boolean;
  allowTakeaway: boolean;
  askName: boolean;
  askPhone: boolean;
  askComment: boolean;
  /** Minimum order total in minor units. 0 = no minimum. */
  minOrderMinor: number;
  /** Block ordering when the venue (or the menu's schedule) is closed. */
  blockWhenClosed: boolean;
  /** First line of the WhatsApp message. */
  messageTitle: string;
  /** Optional text appended to every message. */
  messageFooter: string;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  ogImageId: UUID | null;
  canonicalUrl: string;
  robotsIndex: boolean;
}

export interface StatusSettings {
  mode: VenueMode;
  /** Text shown to visitors while temporarily closed. */
  message: string;
}

export interface SettingsMap {
  business: BusinessSettings;
  contacts: ContactSettings;
  orders: OrderSettings;
  seo: SeoSettings;
  status: StatusSettings;
  theme: ThemeSettings;
}

export type SettingsKey = keyof SettingsMap;

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  /** Text on primary buttons. */
  onPrimary: string;
  secondary: string;
  accent: string;
  /** Text/icon color on top of the accent color. */
  onAccent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  heading: string;
  success: string;
  warning: string;
  danger: string;
  disabled: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  /** Base body size in px (14–18). */
  baseSize: number;
  headingWeight: number; // 400..800
  bodyWeight: number; // 300..600
  lineHeight: number; // 1.3..1.9
  /** em units, e.g. -0.02 */
  headingLetterSpacing: number;
  headingTransform: 'none' | 'uppercase';
}

export interface ThemeShape {
  radiusButton: number; // px
  radiusCard: number;
  radiusImage: number;
  radiusInput: number;
  borderWidth: number; // 0..3
}

export interface ThemeEffects {
  shadow: 'none' | 'sm' | 'md' | 'lg';
  /** 0..100 */
  shadowIntensity: number;
  /** px of backdrop blur for sticky header / overlays */
  blur: number;
  /** 0..100 — opacity of card surfaces over the background */
  surfaceOpacity: number;
}

export interface ThemeLayout {
  density: 'compact' | 'comfortable' | 'spacious';
  /** Content max width in px */
  maxWidth: number;
  buttonStyle: 'solid' | 'soft' | 'outline';
}

export interface ThemeSettings {
  /** Preset id the theme was derived from, or null when customized. */
  preset: string | null;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  shape: ThemeShape;
  effects: ThemeEffects;
  layout: ThemeLayout;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ThemeSettings;
}

/* ------------------------------------------------------------------ */
/* Page sections (site builder)                                        */
/* ------------------------------------------------------------------ */

export type SectionType =
  | 'header'
  | 'hero'
  | 'menu'
  | 'recommended'
  | 'promotions'
  | 'about'
  | 'gallery'
  | 'hours'
  | 'contacts'
  | 'social'
  | 'footer';

export const SECTION_TYPES: SectionType[] = [
  'header',
  'hero',
  'menu',
  'recommended',
  'promotions',
  'about',
  'gallery',
  'hours',
  'contacts',
  'social',
  'footer',
];

export interface PageSection<S = Record<string, unknown>> {
  id: UUID;
  type: SectionType;
  /** Admin label. */
  title: string;
  isEnabled: boolean;
  sortOrder: number;
  /** header/footer are locked in place and cannot be deleted. */
  isLocked: boolean;
  settings: S;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface SectionInput {
  type: SectionType;
  title?: string;
  isEnabled?: boolean;
  settings?: Record<string, unknown>;
}

export interface SectionPatch {
  title?: string;
  isEnabled?: boolean;
  settings?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export interface OrderItem {
  id: UUID;
  productId: UUID | null;
  name: string;
  priceMinor: number;
  quantity: number;
  totalMinor: number;
}

export interface Order {
  id: UUID;
  /** Human friendly sequential number. */
  number: number;
  type: OrderType;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  comment: string;
  subtotalMinor: number;
  totalMinor: number;
  items: OrderItem[];
  /** The WhatsApp message that was generated for this order. */
  whatsappMessage: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CreateOrderRequest {
  type: OrderType;
  customerName?: string;
  customerPhone?: string;
  comment?: string;
  items: { productId: UUID; quantity: number }[];
}

export interface CreateOrderResponse {
  order: Order;
  /** https://wa.me/<number>?text=<encoded>; null when WhatsApp number is not configured. */
  whatsappUrl: string | null;
  message: string;
}

export interface OrderListQuery {
  status?: OrderStatus;
  type?: OrderType;
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

/* ------------------------------------------------------------------ */
/* Public site bootstrap                                               */
/* ------------------------------------------------------------------ */

export interface PublicOrderSettings {
  enabled: boolean;
  /** true when a WhatsApp number is configured. */
  whatsappConfigured: boolean;
  allowDineIn: boolean;
  allowTakeaway: boolean;
  askName: boolean;
  askPhone: boolean;
  askComment: boolean;
  minOrderMinor: number;
  blockWhenClosed: boolean;
}

export interface PublicSchedule {
  id: UUID;
  key: string;
  name: string;
  kind: ScheduleKind;
  hours: ScheduleDay[];
}

export interface SiteBootstrap {
  business: BusinessSettings;
  contacts: ContactSettings;
  orders: PublicOrderSettings;
  seo: SeoSettings;
  theme: ThemeSettings;
  sections: PageSection[]; // enabled only, sorted
  schedules: PublicSchedule[]; // venue + custom, for the hours block
  status: SiteStatus;
  /** Every media object referenced by business/seo/sections, keyed by id. */
  media: Record<UUID, Media>;
}

/* ------------------------------------------------------------------ */
/* Admin: auth & dashboard                                             */
/* ------------------------------------------------------------------ */

export interface AdminUser {
  id: UUID;
  email: string;
  name: string;
  role: 'owner' | 'manager';
  lastLoginAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  /** seconds */
  expiresIn: number;
  user: AdminUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface AdminSession {
  id: UUID;
  userAgent: string;
  ip: string;
  createdAt: ISODateTime;
  expiresAt: ISODateTime;
  current: boolean;
}

export interface DashboardStats {
  products: { total: number; available: number; unavailable: number; hidden: number };
  categories: number;
  menus: number;
  media: number;
  orders: { new: number; today: number; total: number };
  status: SiteStatus;
  /** Things the owner should fix, e.g. WhatsApp number missing. */
  warnings: { code: string; message: string }[];
  recentOrders: Order[];
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export interface ApiError {
  error: {
    code: string; // "validation_error" | "unauthorized" | "not_found" | "conflict" | "rate_limited" | "internal"
    message: string;
    /** field → message for validation errors */
    fields?: Record<string, string>;
  };
}

/* ------------------------------------------------------------------ */
/* Live preview protocol (admin → site iframe via postMessage)         */
/* ------------------------------------------------------------------ */

export type PreviewMessage =
  | { type: 'merenda:preview:theme'; theme: ThemeSettings }
  | { type: 'merenda:preview:sections'; sections: PageSection[]; media?: Record<UUID, Media> }
  | { type: 'merenda:preview:business'; business: BusinessSettings }
  | { type: 'merenda:preview:scroll'; sectionId: UUID }
  | { type: 'merenda:preview:ready' };
