import { useId } from "react";
import { cn } from "@/lib/utils";

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const under1000 = (n: number): string => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const rest = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? "-" + ONES[r % 10] : ""}`;
  return [h ? `${ONES[h]} hundred` : "", h && r ? "and" : "", rest].filter(Boolean).join(" ");
};

/** 1550000 → "One million, five hundred and fifty thousand naira". Helps catch a missing or extra zero. */
export const nairaInWords = (amount: number): string => {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return "Zero naira";
  const parts: string[] = [];
  const scales: [number, string][] = [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"], [1, ""]];
  let rest = n;
  for (const [size, name] of scales) {
    const chunk = Math.floor(rest / size);
    if (chunk) {
      parts.push(`${under1000(chunk)}${name ? " " + name : ""}`);
      rest %= size;
    }
  }
  // "one thousand and fifty" reads naturally when the last part is under 100
  let text = parts.join(", ");
  if (parts.length > 1 && n % 1000 < 100 && n % 1000 > 0) text = parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  return text.charAt(0).toUpperCase() + text.slice(1) + " naira";
};

/** Digits only, as a number. */
/** Digits only, plus shortcuts for speed at a busy counter: "5k" = 5,000, "2m" = 2,000,000. */
/** No single price in the shop is above ₦1 billion; anything bigger is a typing mistake. */
export const MAX_PRICE = 1_000_000_000;

/**
 * Focus selects the whole amount so typing replaces it. A mouse click would normally undo the selection
 * on mouse-up; we skip that one mouse-up so the click-then-type flow works too.
 */
let skipMouseUp = false;
export const selectAllOnFocus = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => { skipMouseUp = true; e.currentTarget.select(); },
  onMouseUp: (e: React.MouseEvent<HTMLInputElement>) => { if (skipMouseUp) { e.preventDefault(); skipMouseUp = false; } },
};

export const parse = (v: string) => {
  const t = v.toLowerCase().replace(/[,\s₦]/g, "");
  const m = t.match(/^(\d*\.?\d+)([km])$/);
  if (m) return Math.round(Number(m[1]) * (m[2] === "k" ? 1_000 : 1_000_000));
  return Number(t.replace(/[^\d]/g, "")) || 0;
};

interface Props {
  value: number | null | undefined;
  onChange: (value: number) => void;
  label?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
  showWords?: boolean;
  className?: string;
  id?: string;
}

/**
 * Naira amount box: always shows ₦ and thousands commas while typing (1,550,000),
 * in large even digits, with the amount in words underneath so mistakes are easy to spot.
 */
const MoneyInput = ({ value, onChange, label, size = "md", autoFocus, placeholder = "0", showWords = true, className, id }: Props) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const n = value ?? 0;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-ink/80">{label}</label>}
      <div className="relative">
        <span className={cn("pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-ink/70", size === "lg" ? "text-xl" : "text-base")}>₦</span>
        <input
          id={inputId}
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={n ? n.toLocaleString("en-NG") : ""}
          onChange={(e) => { const v = parse(e.target.value); if (v <= MAX_PRICE) onChange(v); }}
          {...selectAllOnFocus}
          className={cn(
            "w-full rounded-xl border border-line bg-white pl-10 pr-4 text-right font-bold tabular-nums tracking-wide text-ink outline-none transition placeholder:font-semibold placeholder:text-ink/25 focus:border-ink/40 focus:ring-4 focus:ring-ink/5",
            size === "lg" ? "py-3.5 text-2xl" : "py-2.5 text-lg",
          )}
        />
      </div>
      {showWords && n > 0 && <p className="mt-1.5 text-right text-xs font-medium text-ink/70">{nairaInWords(n)}</p>}
    </div>
  );
};

export default MoneyInput;
