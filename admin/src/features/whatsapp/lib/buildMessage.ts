import { formatMoney, normalizeWhatsappNumber, ORDER_TYPE_LABELS, type OrderSettings, type OrderType } from '@merenda/shared';

/** Sample order rendered by the live preview. Prices are minor units (35000 = 350 ₽). */
export const SAMPLE_ORDER = {
  number: 1042,
  customerName: 'Иван',
  customerPhone: '+7 999 123-45-67',
  comment: 'Без сахара, пожалуйста',
  items: [
    { name: 'Капучино', quantity: 2, priceMinor: 35000 },
    { name: 'Чизкейк', quantity: 1, priceMinor: 45000 },
  ],
} as const;

/** Text sent by the "Проверить" button. */
export const TEST_MESSAGE = 'Тестовое сообщение из Merenda Admin';

/** Fewer digits than this cannot be a real wa.me target. */
export const MIN_WHATSAPP_DIGITS = 7;

export function hasWhatsappNumber(raw: string): boolean {
  return normalizeWhatsappNumber(raw).length >= MIN_WHATSAPP_DIGITS;
}

/** The sample is a takeaway order when takeaway is allowed, otherwise dine-in. */
export function sampleOrderType(settings: Pick<OrderSettings, 'allowTakeaway'>): OrderType {
  return settings.allowTakeaway ? 'takeaway' : 'dine_in';
}

/**
 * Builds the sample WhatsApp message in the exact backend format
 * (docs/API.md → "WhatsApp message format"): plain text, lines joined with "\n".
 */
export function buildSampleMessage(settings: OrderSettings): string {
  const lines: string[] = [];

  lines.push(settings.messageTitle.trim() || 'Новый заказ');
  lines.push(`Заказ №${SAMPLE_ORDER.number}`);
  lines.push(`Тип: ${ORDER_TYPE_LABELS[sampleOrderType(settings)]}`);
  if (settings.askName) lines.push(`Имя: ${SAMPLE_ORDER.customerName}`);
  if (settings.askPhone) lines.push(`Телефон: ${SAMPLE_ORDER.customerPhone}`);

  lines.push('');
  lines.push('Заказ:');
  let totalMinor = 0;
  for (const item of SAMPLE_ORDER.items) {
    const lineMinor = item.priceMinor * item.quantity;
    totalMinor += lineMinor;
    lines.push(`${item.name} × ${item.quantity} — ${formatMoney(lineMinor)}`);
  }

  lines.push('');
  lines.push(`Итого: ${formatMoney(totalMinor)}`);
  if (settings.askComment) lines.push(`Комментарий: ${SAMPLE_ORDER.comment}`);

  const footer = settings.messageFooter.trim();
  if (footer) lines.push(footer);

  return lines.join('\n');
}
