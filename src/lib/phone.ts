/** Accepts 080/070/090/081... (11 digits) or +234 / 234 followed by 10 digits. Returns +234XXXXXXXXXX or null. */
export const normalisePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (/^0[789][01]\d{8}$/.test(digits)) return "+234" + digits.slice(1);
  if (/^234[789][01]\d{8}$/.test(digits)) return "+" + digits;
  return null;
};
