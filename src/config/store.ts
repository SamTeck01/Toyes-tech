/**
 * Store settings — edit these to match Toyes Tech's real details.
 * Everything marked PLACEHOLDER must be replaced before launch.
 */

export const STORE = {
  name: "Toyes Tech",
  /** WhatsApp number in international format, digits only. PLACEHOLDER */
  whatsapp: "2348000000000",
  /** Shown on the contact page and footer. PLACEHOLDER */
  phoneDisplay: "+234 800 000 0000",
  email: "hello@toyestech.com", // PLACEHOLDER
};

/** Stores customers can pick up from. PLACEHOLDER addresses. */
export const PICKUP_LOCATIONS = [
  { id: "campus", name: "Campus store", address: "Main campus, beside the Student Union building", hours: "Mon–Sat, 9am–7pm" },
  { id: "branch-1", name: "City branch", address: "Add your branch address here", hours: "Mon–Sat, 9am–6pm" },
];

/** Delivery fees in naira by zone. PLACEHOLDER prices. */
export const DELIVERY_ZONES = {
  local: { label: "Same city", fee: 2500, eta: "1–2 working days" },
  near: { label: "Nearby states", fee: 4500, eta: "2–4 working days" },
  far: { label: "Rest of Nigeria", fee: 6500, eta: "3–6 working days" },
} as const;

/** Orders at or above this subtotal get free delivery. PLACEHOLDER */
export const FREE_DELIVERY_THRESHOLD = 500000;

/** Which zone each state falls in. Anything not listed uses "far". PLACEHOLDER — set your home state as "local". */
export const STATE_ZONES: Record<string, keyof typeof DELIVERY_ZONES> = {
  Lagos: "local",
  Ogun: "near",
  Oyo: "near",
  Osun: "near",
  Ondo: "near",
  Ekiti: "near",
  Kwara: "near",
  Edo: "near",
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export const deliveryQuote = (state: string, subtotal: number) => {
  const zone = DELIVERY_ZONES[STATE_ZONES[state] ?? "far"];
  const free = subtotal >= FREE_DELIVERY_THRESHOLD;
  return { ...zone, fee: free ? 0 : zone.fee, free };
};

export const whatsappLink = (message: string) =>
  `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
