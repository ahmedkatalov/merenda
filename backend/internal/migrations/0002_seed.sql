-- Initial content for Merenda: real kitchen + bar menu (names, prices, compositions, categories),
-- exported from production. Schedules, settings and page sections seed sensible defaults.

-- Schedules -----------------------------------------------------------------
INSERT INTO schedules (id, key, name, kind, sort_order) VALUES
  ('11111111-0000-4000-8000-000000000001', 'venue',   'Заведение', 'venue',  0),
  ('11111111-0000-4000-8000-000000000002', 'kitchen', 'Кухня',     'custom', 1),
  ('11111111-0000-4000-8000-000000000003', 'bar',     'Бар',       'custom', 2)
ON CONFLICT (key) DO NOTHING;

INSERT INTO schedule_hours (schedule_id, weekday, is_closed, opens_at, closes_at)
SELECT '11111111-0000-4000-8000-000000000001', d, false, '08:00', '22:00' FROM generate_series(0,6) d
ON CONFLICT DO NOTHING;
INSERT INTO schedule_hours (schedule_id, weekday, is_closed, opens_at, closes_at)
SELECT '11111111-0000-4000-8000-000000000002', d, false, '11:00', '21:00' FROM generate_series(0,6) d
ON CONFLICT DO NOTHING;
INSERT INTO schedule_hours (schedule_id, weekday, is_closed, opens_at, closes_at)
SELECT '11111111-0000-4000-8000-000000000003', d, false, '08:00', '22:00' FROM generate_series(0,6) d
ON CONFLICT DO NOTHING;

-- Menus ---------------------------------------------------------------------
INSERT INTO menus (id, slug, name, description, icon, sort_order, is_active, schedule_id) VALUES
  ('22222222-0000-4000-8000-000000000001', 'kitchen', 'Кухня', 'Завтраки весь день, салаты, супы и горячие блюда', 'utensils', 0, true, '11111111-0000-4000-8000-000000000002'),
  ('22222222-0000-4000-8000-000000000002', 'bar',     'Бар',   'Кофе, чай, лимонады и десерты',                  'coffee',   1, true, '11111111-0000-4000-8000-000000000003')
ON CONFLICT (slug) DO NOTHING;

-- Categories ----------------------------------------------------------------
INSERT INTO categories (id, menu_id, slug, name, description, sort_order, is_active) VALUES
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'breakfast', 'Завтраки — целый день', 'Подаём с открытия до закрытия кухни', 0, true),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'salads', 'Салаты', '', 1, true),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'soups', 'Супы', '', 2, true),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'bowls', 'Боулы', '', 3, true),
  ('33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 'pasta', 'Паста', '', 4, true),
  ('33333333-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000001', 'hot', 'Горячие блюда', '', 5, true),
  ('33333333-0000-4000-8000-000000000011', '22222222-0000-4000-8000-000000000002', 'coffee', 'Кофе', '', 0, true),
  ('a2185a73-c449-45dd-8762-2d142861a763', '22222222-0000-4000-8000-000000000002', 'raf', 'Раф', '', 10, true),
  ('7aab34c0-7dd6-40c1-a869-ef1645dca3d0', '22222222-0000-4000-8000-000000000002', 'kokteyli', 'Коктейли', '', 20, true),
  ('93e5ef30-4959-404f-b245-b71c85ff040a', '22222222-0000-4000-8000-000000000002', 'freshi', 'Фреши', '', 30, true),
  ('126843d5-b3ef-45cf-8c89-2cbad5cb0420', '22222222-0000-4000-8000-000000000002', 'limonady', 'Лимонады', '', 40, true),
  ('6fa4a248-220e-48e7-bf5b-4afd9b7e38e6', '22222222-0000-4000-8000-000000000002', 'mokhito', 'Мохито', '', 50, true),
  ('a4b2c790-90ec-4620-855d-36b4b9d751c4', '22222222-0000-4000-8000-000000000002', 'toniziruyushchie-napitki', 'Тонизирующие напитки', '', 60, true),
  ('ace6c16d-9883-4a31-98c3-008b18492a53', '22222222-0000-4000-8000-000000000002', 'gazirovannye-napitki', 'Газированные напитки', '', 70, true),
  ('33333333-0000-4000-8000-000000000012', '22222222-0000-4000-8000-000000000002', 'tea', 'Чай', '', 80, true),
  ('33333333-0000-4000-8000-000000000013', '22222222-0000-4000-8000-000000000002', 'cold', 'Холодные напитки', '', 90, true),
  ('33333333-0000-4000-8000-000000000014', '22222222-0000-4000-8000-000000000002', 'desserts', 'Десерты', '', 100, true)
ON CONFLICT (id) DO NOTHING;

-- Products ------------------------------------------------------------------
INSERT INTO products (id, category_id, slug, name, description, price_minor, old_price_minor, availability, is_popular, is_recommended, is_new, tags, attributes, sort_order) VALUES
  ('21f91baa-eb6a-4990-b3e4-0af06e674341', '33333333-0000-4000-8000-000000000001', 'chechen-breakfast', 'Чеченский завтрак', 'Каша из кукурузной муки, творог, молоко, топлёное масло', 32000, NULL, 'available', true, true, false, '{"Традиционное"}', '[]'::jsonb, 0),
  ('39c637b0-092e-4da6-bf8a-22f20f1595b8', '33333333-0000-4000-8000-000000000001', 'siskal', 'Сискал — т1о берам', 'Кукурузная лепёшка сискал с т1о-берам', 29000, NULL, 'available', false, false, false, '{"Традиционное"}', '[]'::jsonb, 1),
  ('2856aa7f-a4cb-4295-b9c7-0300ad0e63a7', '33333333-0000-4000-8000-000000000001', 'english-breakfast', 'Английский завтрак', 'Яичница, бекон, сосиски, запечённая фасоль, томаты гриль, тосты', 45000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 2),
  ('f91a3892-b9f9-4176-a12a-8151e4597cfb', '33333333-0000-4000-8000-000000000001', 'scramble-salmon', 'Скрэмбл с малосольной сёмгой и авокадо', 'Яичный скрэмбл, малосольная сёмга, авокадо, кунжут, тост', 52000, NULL, 'available', true, true, false, '{}', '[]'::jsonb, 3),
  ('3c082107-78ce-4c03-b7bc-6f468f644618', '33333333-0000-4000-8000-000000000001', 'eggs-cream', 'Яичница на сливках с кунжутом', 'Яйца на сливках, кунжут, зелень, тост', 33000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 4),
  ('06a0cfa9-f08e-4b95-aa80-63200241681f', '33333333-0000-4000-8000-000000000001', 'buckwheat-egg', 'Гречневая каша с яйцом и соусом', 'Гречка, яйцо, сливочный соус, зелень', 31000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 5),
  ('3cfcf6cc-365e-47cb-8111-0ff26d5d4030', '33333333-0000-4000-8000-000000000001', 'syrniki', 'Сырники со сметаной и вишнёвым соусом', 'Творожные сырники, сметана, вишнёвый соус', 38000, NULL, 'available', true, false, false, '{}', '[]'::jsonb, 6),
  ('64dd877d-f6d7-41ef-bb21-f2b3dca03a24', '33333333-0000-4000-8000-000000000001', 'bliny', 'Блины со сметаной и вишнёвым соусом', 'Тонкие блины, сметана, вишнёвый соус', 34000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 7),
  ('c29e3e0a-5936-4f19-8679-9d07a422e438', '33333333-0000-4000-8000-000000000001', 'lokumy', 'Локумы со сметаной и аджикой', 'Жареные лепёшки локум, сметана, аджика', 30000, NULL, 'available', false, false, false, '{"Традиционное"}', '[]'::jsonb, 8),
  ('8b18b7aa-1463-4013-9678-1df93021b372', '33333333-0000-4000-8000-000000000002', 'greek', 'Греческий салат', 'Микс салатов, помидоры, огурцы, болгарский перец, красный лук, сыр фетакса, маслины, оливковое масло', 42000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('b8264d6b-0c54-4de8-ad9e-6f48349cf948', '33333333-0000-4000-8000-000000000002', 'caesar-chicken', 'Цезарь с курицей', 'Салат романо, айсберг, куриное филе, помидоры черри, пармезан, сухарики, соус цезарь', 48000, NULL, 'available', true, false, false, '{}', '[]'::jsonb, 1),
  ('a746ca5e-fc6e-4e85-af54-d25bfad9b112', '33333333-0000-4000-8000-000000000002', 'caesar-shrimp', 'Цезарь с креветками', 'Салат романо, айсберг, тигровые креветки, помидоры черри, пармезан, сухарики, соус цезарь', 56000, NULL, 'available', false, true, false, '{}', '[]'::jsonb, 2),
  ('70975239-0857-40db-9d79-a445b0930799', '33333333-0000-4000-8000-000000000002', 'vegetable', 'Овощной салат', 'Помидоры, огурцы, болгарский перец, красный лук, микс салатов, специи', 35000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 3),
  ('c96f4627-307f-432c-bc22-99d1611995ad', '33333333-0000-4000-8000-000000000002', 'eggplant', 'Салат с хрустящими баклажанами', 'Хрустящие баклажаны, помидоры черри, зелёный лук, кунжут, соус чили', 47000, NULL, 'available', true, false, true, '{"Острое"}', '[]'::jsonb, 4),
  ('610107cc-1272-42c0-8ebd-673a72f318f2', '33333333-0000-4000-8000-000000000003', 'chicken-soup', 'Куриный суп', 'Куриное филе, картофель, морковь, лук, вермишель', 29000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('eb716b9a-0e12-43e3-b7f5-78be17d534f1', '33333333-0000-4000-8000-000000000003', 'lentil-soup', 'Суп-пюре чечевичный', 'Красная чечевица, лимон, сухарики, специи', 30000, NULL, 'available', false, false, false, '{"Вегетарианское"}', '[]'::jsonb, 1),
  ('a7f58504-838b-4286-8572-d75a989f75ee', '33333333-0000-4000-8000-000000000003', 'nohchi-chorpa', 'Нохчи чорпа', 'Говядина, картофель, лук, морковь, специи', 30000, NULL, 'available', false, true, false, '{"Традиционное"}', '[]'::jsonb, 2),
  ('ded396c6-17f1-466e-8e68-48e5c0a80da3', '33333333-0000-4000-8000-000000000003', 'tom-yum', 'Том ям', 'Бульон том ям, креветки, шампиньоны, кокосовое молоко, паста том ям', 50000, NULL, 'available', true, false, false, '{"Острое"}', '[]'::jsonb, 3),
  ('14d008a5-cc63-4b15-93c4-2ac8e7f58f51', '33333333-0000-4000-8000-000000000003', 'borshch', 'Борщ', 'Говядина, свёкла, капуста, картофель, морковь, томатная паста', 35000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 13),
  ('5dddd946-08c3-44cc-8ae9-52318adec320', '33333333-0000-4000-8000-000000000004', 'bowl-chicken', 'Боул с курицей', 'Куриное филе, рис для суши, огурцы, помидоры черри, айсберг, зелень, кунжут, соус для боула', 49000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('474bdb42-8c45-4fcf-b18c-285d5fb86aa8', '33333333-0000-4000-8000-000000000004', 'bowl-shrimp', 'Боул с креветками', 'Рис, креветки, авокадо, овощи, соус', 45000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 1),
  ('833259df-2ed9-4e2c-9ba3-22a094acb8e7', '33333333-0000-4000-8000-000000000005', 'fettuccine-chicken', 'Фетучини с курицей и грибами', 'Фетучини, куриное филе, шампиньоны, сливки, молоко, пармезан', 52000, NULL, 'available', true, false, false, '{}', '[]'::jsonb, 0),
  ('7989a87f-01d4-4ce2-9de1-f8eb3ccc4cdc', '33333333-0000-4000-8000-000000000005', 'spaghetti-tomato', 'Спагетти в томатном соусе', 'Спагетти, томатный соус, чеснок, пармезан, базилик', 40000, NULL, 'available', false, false, false, '{"Вегетарианское"}', '[]'::jsonb, 1),
  ('74a8a93f-ebb9-45e9-8783-856b2c8e8deb', '33333333-0000-4000-8000-000000000005', 'fetuchini-s-krevetkoy', 'Фетучини с креветкой', 'Фетучини, креветки, сливки, томатный соус, пармезан', 50000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 11),
  ('43ffe1a3-6328-4f3d-bd24-f42c37f909cf', '33333333-0000-4000-8000-000000000005', 'rizoni', 'Ризони', 'Ризони, куриное филе, сливки, пармезан, овощи', 50000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 21),
  ('025bb5c4-26d3-4de5-9497-fd793ff56e15', '33333333-0000-4000-8000-000000000006', 'zharkoe-beef', 'Жаркое по-домашнему с говядиной', 'Говядина, картофель, лук, морковь, соус', 45000, NULL, 'available', true, false, false, '{}', '[]'::jsonb, 0),
  ('6df40ef5-64a9-4fb5-a076-0398b31ef729', '33333333-0000-4000-8000-000000000006', 'zharkoe-chicken', 'Жаркое по-домашнему с курицей', 'Куриное филе, картофель, лук, морковь, соус', 45000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 1),
  ('68edaf61-8897-4066-8082-0aa0b174ba93', '33333333-0000-4000-8000-000000000006', 'pelmeni-tom-yum', 'Пельмени в соусе Том ям', 'Пельмени, бульон том ям, кокосовое молоко, паста том ям', 50000, NULL, 'available', false, true, true, '{"Острое"}', '[]'::jsonb, 2),
  ('25f7e59e-63aa-447c-8623-dcacef9c139c', '33333333-0000-4000-8000-000000000006', 'salmon-buckwheat', 'Лосось с гречкой и свёклой', 'Стейк лосося, зелёная гречка, печёная свёкла, соус', 79000, NULL, 'available', true, true, false, '{}', '[]'::jsonb, 3),
  ('ca17734d-5e85-4481-8702-1b4259163936', '33333333-0000-4000-8000-000000000006', 'medallions', 'Медальоны в грибном соусе с картофельным пюре', 'Говяжьи медальоны, сливочно-грибной соус, картофельное пюре', 74000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 4),
  ('3028f9a8-bf40-4658-b269-8c406441573b', '33333333-0000-4000-8000-000000000006', 'liver-vegetables', 'Печень с овощами', 'Куриная печень, лук, морковь, соус', 45000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 5),
  ('da1771d1-e61b-4f74-8b8a-d6625469bf99', '33333333-0000-4000-8000-000000000006', 'risoni-teriyaki', 'Ризонни с говядиной в соусе терияки', 'Паста ризони, говядина, соус терияки, овощи, кунжут', 56000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 6),
  ('d9acb33e-6f8c-4783-ab4d-80bea3954bdd', '33333333-0000-4000-8000-000000000006', 'chicken-broccoli', 'Курица с брокколи в остром соусе', 'Куриное филе, брокколи, острый соус, чеснок', 40000, NULL, 'available', false, false, false, '{"Острое"}', '[]'::jsonb, 7),
  ('a850143c-48b2-4924-afda-23e9c5969a5a', '33333333-0000-4000-8000-000000000006', 'udon-s-kuritsey-i-ovoshchami', 'Удон с курицей и овощами', 'Лапша удон, куриное филе, овощи, соус терияки', 46000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 17),
  ('75db157e-9bb8-4c5c-ad88-646d0e478b7c', '33333333-0000-4000-8000-000000000006', 'myaso-po-tayski', 'Мясо по-тайски', 'Говядина, болгарский перец, лук, тайский соус, рис', 50000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 27),
  ('66564f22-9793-42fd-b74d-52a798ab968e', '33333333-0000-4000-8000-000000000011', 'espresso', 'Эспрессо', 'Классический эспрессо из свежеобжаренных зёрен', 20000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('e33541bb-33ec-434f-8a6a-b05355d21cda', '33333333-0000-4000-8000-000000000011', 'americano', 'Американо', 'Эспрессо и горячая вода', 22000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 1),
  ('18d1f116-7ce8-4c82-ba81-58c6957115c4', '33333333-0000-4000-8000-000000000011', 'cappuccino', 'Капучино средний', 'Эспрессо, молоко и нежная молочная пенка', 25000, NULL, 'available', true, true, false, '{}', '[]'::jsonb, 2),
  ('f75e0afc-0423-4fac-a8b6-eaed43eb5824', '33333333-0000-4000-8000-000000000011', 'latte', 'Латте', 'Эспрессо с большим количеством молока', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 3),
  ('4ce1fe56-fb9c-4ea4-bc92-7fd11eb67573', '33333333-0000-4000-8000-000000000011', 'flat-white', 'Флэт уайт', 'Двойной эспрессо и бархатистое молоко', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 4),
  ('c4b9827c-b8fc-4176-a17f-6a2534daa30e', '33333333-0000-4000-8000-000000000011', 'lungo', 'Лунго', '', 20000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 14),
  ('743fe7a0-4236-41f5-8bb7-fd7f03c72529', '33333333-0000-4000-8000-000000000011', 'kapuchino-bol-shoy', 'Капучино большой', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 24),
  ('e36e300c-20d3-48fa-ae02-661a498daaa5', 'a2185a73-c449-45dd-8762-2d142861a763', 'raf-banan', 'Раф банан', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('0aa99b07-1ee2-40a3-b46b-6c077cc35df4', 'a2185a73-c449-45dd-8762-2d142861a763', 'raf-karamel-nyy', 'Раф карамельный', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('d88e3ea3-2529-4805-b8d8-20fc89a14402', 'a2185a73-c449-45dd-8762-2d142861a763', 'raf-urbech', 'Раф урбеч', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 20),
  ('a50c8bbc-0da2-4251-b01f-1d3a674e31e1', 'a2185a73-c449-45dd-8762-2d142861a763', 'raf-vanil-nyy', 'Раф ванильный', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 30),
  ('7f8d34e7-7ee8-445e-bb85-9a8aa48acc82', 'a2185a73-c449-45dd-8762-2d142861a763', 'raf-fistashkovyy', 'Раф фисташковый', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 40),
  ('e778295d-8d64-4630-abf4-d03fc30c445d', 'a2185a73-c449-45dd-8762-2d142861a763', 'raf-kokosovyy', 'Раф кокосовый', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 50),
  ('8238533e-c26f-442e-b59c-e1d213cc9c00', '7aab34c0-7dd6-40c1-a869-ef1645dca3d0', 'bananovyy', 'Банановый', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('58aa4963-d75e-4cad-a77b-3906ce9e2085', '7aab34c0-7dd6-40c1-a869-ef1645dca3d0', 'klubnichno-bananovyy', 'Клубнично-банановый', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('2d64f805-6c6c-458c-b121-b33ae87a5c8e', '7aab34c0-7dd6-40c1-a869-ef1645dca3d0', 'klubnichnyy', 'Клубничный', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 20),
  ('4be574c5-5778-45c7-bc35-6b621d99782c', '7aab34c0-7dd6-40c1-a869-ef1645dca3d0', 'shokoladnyy', 'Шоколадный', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 30),
  ('99171fdf-059a-4d77-8866-edeac06d111c', '93e5ef30-4959-404f-b245-b71c85ff040a', 'apel-sinovyy-fresh', 'Апельсиновый фреш', 'Свежевыжатый', 40000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('20edb1b4-ca2a-4928-80c3-b326e39cf689', '93e5ef30-4959-404f-b245-b71c85ff040a', 'ananasovyy-fresh', 'Ананасовый фреш', 'Свежевыжатый', 45000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('6eb34315-4d1b-4b11-973e-0ee2bbf8f58f', '93e5ef30-4959-404f-b245-b71c85ff040a', 'granatovyy-fresh', 'Гранатовый фреш', 'Свежевыжатый', 40000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 20),
  ('7e1a6069-1b9c-4053-a968-bfb9da09b84c', '93e5ef30-4959-404f-b245-b71c85ff040a', 'grin-fresh', 'Грин фреш', 'Свежевыжатый', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 30),
  ('7332794b-8d28-4b94-8f2f-5762779fb48f', '93e5ef30-4959-404f-b245-b71c85ff040a', 'miks-fresh', 'Микс фреш', 'Свежевыжатый', 45000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 40),
  ('ddc668b2-d158-425c-af5c-76d2b26c163e', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'yagodnyy', 'Ягодный', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('d4a5f5fb-c207-43b7-84ed-235a4d351e5c', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'klubnichnyy', 'Клубничный', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('6a2682e8-b0c1-4dfb-bd52-58013f6deedd', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'malinovyy', 'Малиновый', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 20),
  ('6b1e22cb-19de-4b58-bfe6-4ec622b06c62', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'mango-marakuyya', 'Манго-маракуйя', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 30),
  ('b45edb86-067f-46ed-89f4-686544e68ef6', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'ananasovyy', 'Ананасовый', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 40),
  ('da24e60c-4700-49a7-b1a1-c16c23ac8cb5', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'golubaya-laguna', 'Голубая лагуна', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 50),
  ('cea63b20-bf08-45ad-9312-b5d9377847db', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'kivi', 'Киви', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 60),
  ('9c2472a6-08e9-4f90-8e82-e72b9644273f', '126843d5-b3ef-45cf-8c89-2cbad5cb0420', 'tarkhun', 'Тархун', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 70),
  ('78f1e0b4-d23c-4110-a458-7a97fbd37027', '6fa4a248-220e-48e7-bf5b-4afd9b7e38e6', 'mokhito-klassicheskiy', 'Мохито классический', 'Графин', 55000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('5a2c1a9c-8518-48c7-90f4-75dfd6bf3449', '6fa4a248-220e-48e7-bf5b-4afd9b7e38e6', 'mokhito-klubnichnyy', 'Мохито клубничный', 'Графин', 55000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('ff35e9bf-2dc4-4f87-8a06-72bf19984a39', '6fa4a248-220e-48e7-bf5b-4afd9b7e38e6', 'mokhito-golubaya-laguna', 'Мохито голубая лагуна', 'Графин', 55000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 20),
  ('0d15166c-f6a4-4123-ab3b-762bd57403c1', '6fa4a248-220e-48e7-bf5b-4afd9b7e38e6', 'mokhito-malinovyy', 'Мохито малиновый', 'Графин', 55000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 30),
  ('bd22ac31-6e3a-4728-9f7a-c3fd8dccf99d', '6fa4a248-220e-48e7-bf5b-4afd9b7e38e6', 'mokhito-mango-marakuyya', 'Мохито манго-маракуйя', 'Графин', 55000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 40),
  ('c75491e2-7643-44db-8a37-103395813d1e', 'a4b2c790-90ec-4620-855d-36b4b9d751c4', 'apel-sinovyy-bambl', 'Апельсиновый бамбл', '', 45000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('dfa0bd03-d8ab-455e-b38f-d4bc3466ca57', 'a4b2c790-90ec-4620-855d-36b4b9d751c4', 'adrenalin-tonik', 'Адреналин тоник', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('1b3a9932-563e-4973-8b79-9c335e71d790', 'a4b2c790-90ec-4620-855d-36b4b9d751c4', 'granatovyy-tonik', 'Гранатовый тоник', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 20),
  ('685277d1-ddb1-4b2a-89f2-b6dc0e4e12e5', 'a4b2c790-90ec-4620-855d-36b4b9d751c4', 'vyzhatyy-granatovyy-tonik', 'Выжатый гранатовый тоник', '', 44800, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 30),
  ('3b33a79e-d3b1-4ac8-9d9b-e469cd71de14', 'a4b2c790-90ec-4620-855d-36b4b9d751c4', 'gin-tonik', 'Гин тоник', '', 50000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 40),
  ('27d3af7b-4ddd-4d54-8b19-ea0985f7e78c', 'a4b2c790-90ec-4620-855d-36b4b9d751c4', 'redbul-tonik', 'Редбул тоник', '', 30000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 50),
  ('581df83f-d3be-467f-9d7f-d0a4cbfcbb71', 'ace6c16d-9883-4a31-98c3-008b18492a53', 'koka-kola', 'Кока-кола', '', 15000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('07535a05-7350-4c1c-a4f1-b0e9c8454bd6', 'ace6c16d-9883-4a31-98c3-008b18492a53', 'pepsi', 'Пепси', '', 15000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('5eeeb6f7-4838-45a5-93b5-ceff525260a9', 'ace6c16d-9883-4a31-98c3-008b18492a53', 'sprayt', 'Спрайт', '', 15000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 20),
  ('3b5a14ed-c997-4fef-acef-7b50148791b1', 'ace6c16d-9883-4a31-98c3-008b18492a53', 'kinza', 'Кинза', '', 15000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 30),
  ('03a987f2-5756-47bc-8af2-8c78bfa60d16', 'ace6c16d-9883-4a31-98c3-008b18492a53', 'red-bull', 'Ред Булл', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 40),
  ('654baa07-b1d3-4171-8132-269b2cfcf5ca', 'ace6c16d-9883-4a31-98c3-008b18492a53', 'adrenalin', 'Адреналин', '', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 50),
  ('64102bb6-a363-4795-a0e3-f74cfa5aa489', '33333333-0000-4000-8000-000000000012', 'black-tea', 'Чёрный чай', 'Чайник 500 мл', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('388bd556-00c7-4d85-89d3-cd7d0b1bdd8e', '33333333-0000-4000-8000-000000000012', 'green-tea', 'Зелёный чай', 'Чайник 500 мл', 25000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 1),
  ('ee2ec27d-a7ed-40c0-9496-f496d2d30a10', '33333333-0000-4000-8000-000000000012', 'herbal-tea', 'Травяной чай', 'Чабрец, мята, ромашка. Чайник 500 мл', 28000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 2),
  ('5aa06bc0-6973-46e1-8a68-5c772c17872e', '33333333-0000-4000-8000-000000000012', 'seabuckthorn-tea', 'Чай с облепихой', 'Облепиха, мёд, имбирь. Чайник 500 мл', 32000, NULL, 'available', true, false, false, '{}', '[]'::jsonb, 3),
  ('67ffc22b-bdbc-4b5d-90d2-29fc3bd35ed5', '33333333-0000-4000-8000-000000000013', 'ays-latte', 'Айс латте', '', 28000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 0),
  ('d8fd8b5a-bffb-442f-b31f-b352c6a8e0ab', '33333333-0000-4000-8000-000000000013', 'urbech', 'Урбеч', '', 35000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 10),
  ('d47c6cc2-1589-4719-b07c-da93da0aa91c', '33333333-0000-4000-8000-000000000014', 'cheesecake', 'Чизкейк', 'Классический нью-йорк с ягодным соусом', 45000, NULL, 'available', true, false, false, '{}', '[]'::jsonb, 0),
  ('441e2c4a-9406-4e16-b8c1-553f7d58b452', '33333333-0000-4000-8000-000000000014', 'tiramisu', 'Тирамису', 'Савоярди, маскарпоне, эспрессо', 42000, NULL, 'available', false, false, false, '{}', '[]'::jsonb, 1),
  ('07513929-6bb4-4628-bfff-90cc2de472ca', '33333333-0000-4000-8000-000000000014', 'medovik', 'Медовик', 'Домашний медовый торт со сметанным кремом', 38000, NULL, 'available', false, true, false, '{}', '[]'::jsonb, 2)
ON CONFLICT (id) DO NOTHING;

-- Settings ------------------------------------------------------------------
INSERT INTO settings (key, value) VALUES
  ('business', '{"name":"Меренда","tagline":"Кофейня","description":"Вкус · Уют · Гармония. Кофейня с домашней кухней: завтраки весь день, свежая выпечка и ароматный кофе.","logoId":null,"faviconId":null,"currency":{"code":"RUB","symbol":"₽","decimals":0},"timezone":"Europe/Moscow"}'),
  ('contacts', '{"phone":"","email":"","address":"","addressNote":"","mapUrl":"","mapEmbedUrl":"","social":[]}'),
  ('orders',   '{"enabled":true,"whatsappNumber":"","allowDineIn":true,"allowTakeaway":true,"askName":true,"askPhone":false,"askComment":true,"minOrderMinor":0,"blockWhenClosed":true,"messageTitle":"Новый заказ — Меренда","messageFooter":""}'),
  ('seo',      '{"title":"Меренда — кофейня. Меню и заказ","description":"Меню кофейни Меренда: завтраки весь день, салаты, супы, горячие блюда, кофе и десерты. Закажите онлайн.","keywords":"кофейня, меню, завтраки, кофе, заказ","ogImageId":null,"canonicalUrl":"","robotsIndex":true}'),
  ('status',   '{"mode":"auto","message":""}'),
  ('theme',    '{"preset":"elegant"}')
ON CONFLICT (key) DO NOTHING;

-- Page sections -------------------------------------------------------------
INSERT INTO page_sections (id, type, title, is_enabled, sort_order, is_locked, settings) VALUES
  ('44444444-0000-4000-8000-000000000001', 'header',      'Шапка',          true,  0,  true,  '{}'),
  ('44444444-0000-4000-8000-000000000002', 'hero',        'Главный экран',  true,  10, false, '{}'),
  ('44444444-0000-4000-8000-000000000003', 'recommended', 'Рекомендуем',    true,  20, false, '{}'),
  ('44444444-0000-4000-8000-000000000004', 'menu',        'Меню',           true,  30, false, '{}'),
  ('44444444-0000-4000-8000-000000000005', 'about',       'О заведении',    true,  40, false, '{}'),
  ('44444444-0000-4000-8000-000000000006', 'promotions',  'Акции',          false, 50, false, '{}'),
  ('44444444-0000-4000-8000-000000000007', 'gallery',     'Галерея',        false, 60, false, '{}'),
  ('44444444-0000-4000-8000-000000000008', 'hours',       'Режим работы',   true,  70, false, '{}'),
  ('44444444-0000-4000-8000-000000000009', 'contacts',    'Контакты',       true,  80, false, '{}'),
  ('44444444-0000-4000-8000-000000000010', 'social',      'Соцсети',        false, 90, false, '{}'),
  ('44444444-0000-4000-8000-000000000011', 'footer',      'Подвал',         true,  100, true, '{}')
ON CONFLICT (id) DO NOTHING;
