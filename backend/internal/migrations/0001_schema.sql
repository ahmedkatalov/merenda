-- Merenda schema. All ids are UUIDs, money in minor units, weekdays 0=Mon..6=Sun.

CREATE TABLE IF NOT EXISTS admins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','manager')),
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  user_agent  text NOT NULL DEFAULT '',
  ip          text NOT NULL DEFAULT '',
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_admin_idx ON admin_sessions(admin_id);

CREATE TABLE IF NOT EXISTS media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL CHECK (kind IN ('image','gif')),
  mime          text NOT NULL,
  path          text NOT NULL,            -- relative path inside the upload dir (original)
  thumb_path    text NOT NULL DEFAULT '', -- '' => use original
  medium_path   text NOT NULL DEFAULT '',
  width         int  NOT NULL DEFAULT 0,
  height        int  NOT NULL DEFAULT 0,
  size          bigint NOT NULL DEFAULT 0,
  original_name text NOT NULL DEFAULT '',
  alt           text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_created_idx ON media(created_at DESC);

CREATE TABLE IF NOT EXISTS schedules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  name       text NOT NULL,
  kind       text NOT NULL DEFAULT 'custom' CHECK (kind IN ('venue','custom')),
  sort_order int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_hours (
  schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  weekday     smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  is_closed   boolean NOT NULL DEFAULT false,
  opens_at    time NOT NULL DEFAULT '09:00',
  closes_at   time NOT NULL DEFAULT '21:00',
  PRIMARY KEY (schedule_id, weekday)
);

CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  date        date NOT NULL,
  is_closed   boolean NOT NULL DEFAULT true,
  opens_at    time,
  closes_at   time,
  note        text NOT NULL DEFAULT '',
  UNIQUE (schedule_id, date)
);

CREATE TABLE IF NOT EXISTS menus (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon        text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id     uuid NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_id    uuid REFERENCES media(id) ON DELETE SET NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (menu_id, slug)
);
CREATE INDEX IF NOT EXISTS categories_menu_idx ON categories(menu_id, sort_order);

CREATE TABLE IF NOT EXISTS products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug            text NOT NULL,
  name            text NOT NULL,
  description     text NOT NULL DEFAULT '',
  price_minor     bigint NOT NULL CHECK (price_minor >= 0),
  old_price_minor bigint CHECK (old_price_minor IS NULL OR old_price_minor >= 0),
  image_id        uuid REFERENCES media(id) ON DELETE SET NULL,
  gif_id          uuid REFERENCES media(id) ON DELETE SET NULL,
  availability    text NOT NULL DEFAULT 'available' CHECK (availability IN ('available','unavailable','hidden')),
  is_popular      boolean NOT NULL DEFAULT false,
  is_recommended  boolean NOT NULL DEFAULT false,
  is_new          boolean NOT NULL DEFAULT false,
  tags            text[] NOT NULL DEFAULT '{}',
  attributes      jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id, sort_order);
CREATE INDEX IF NOT EXISTS products_availability_idx ON products(availability);

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number           bigint NOT NULL UNIQUE DEFAULT nextval('order_number_seq'),
  type             text NOT NULL CHECK (type IN ('dine_in','takeaway')),
  status           text NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','completed','cancelled')),
  customer_name    text NOT NULL DEFAULT '',
  customer_phone   text NOT NULL DEFAULT '',
  comment          text NOT NULL DEFAULT '',
  subtotal_minor   bigint NOT NULL DEFAULT 0,
  total_minor      bigint NOT NULL DEFAULT 0,
  whatsapp_message text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  name        text NOT NULL,
  price_minor bigint NOT NULL,
  quantity    int NOT NULL CHECK (quantity > 0),
  total_minor bigint NOT NULL,
  sort_order  int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

-- Typed settings stored as JSON per key: business, contacts, orders, seo, status, theme.
CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_sections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL,
  title      text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  is_locked  boolean NOT NULL DEFAULT false,
  settings   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_sections_order_idx ON page_sections(sort_order);
