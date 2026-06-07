const DEFAULT_CC = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "212";

/** Normalise vers E.164 sans + (ex. 212612345678) */
export function normalizePhone(raw: string | null | undefined, countryCode = DEFAULT_CC): string | null {
  if (!raw?.trim()) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) {
    digits = countryCode + digits.slice(1);
  }
  if (!digits.startsWith(countryCode) && digits.length === 9) {
    digits = countryCode + digits;
  }
  if (digits.length < 10) return null;
  return digits;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 6) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}
