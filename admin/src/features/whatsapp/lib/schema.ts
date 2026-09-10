import { z } from 'zod';

/** "+7 999 123-45-67", "+49 151 2345678": optional "+", then digits/spaces/()/- (7+ chars). */
export const WHATSAPP_NUMBER_RE = /^\+?[\d\s()-]{7,}$/;

export const orderSettingsSchema = z
  .object({
    enabled: z.boolean(),
    whatsappNumber: z
      .string()
      .trim()
      .max(32, 'Не больше 32 символов')
      .refine((v) => v === '' || WHATSAPP_NUMBER_RE.test(v), 'Введите номер в международном формате'),
    allowDineIn: z.boolean(),
    allowTakeaway: z.boolean(),
    askName: z.boolean(),
    askPhone: z.boolean(),
    askComment: z.boolean(),
    blockWhenClosed: z.boolean(),
    minOrderMinor: z.number().int('Введите целое число').min(0, 'Сумма не может быть отрицательной'),
    messageTitle: z.string().trim().min(1, 'Введите заголовок').max(120, 'Не больше 120 символов'),
    messageFooter: z.string().trim().max(300, 'Не больше 300 символов'),
  })
  .refine((v) => !v.enabled || v.allowDineIn || v.allowTakeaway, {
    message: 'Включите хотя бы один тип заказа',
    path: ['allowTakeaway'],
  });

export type OrderSettingsFormValues = z.infer<typeof orderSettingsSchema>;
