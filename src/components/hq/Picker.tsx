import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export type PickerOption = { value: string; label: string; hint?: string };

/** Premium dropdown: big touch target, soft shadow, checkmark on the chosen item, keyboard friendly. */
const Picker = ({ value, onChange, options, placeholder = "Choose…", ariaLabel, className, disabled }: {
  value: string; onChange: (v: string) => void; options: PickerOption[]; placeholder?: string; ariaLabel?: string; className?: string; disabled?: boolean;
}) => (
  <SelectPrimitive.Root value={value || undefined} onValueChange={onChange} disabled={disabled}>
    <SelectPrimitive.Trigger
      aria-label={ariaLabel}
      className={cn(
        "group inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 text-left text-[15px] font-semibold text-ink shadow-[0_1px_2px_rgba(16,16,20,0.04)] outline-none transition hover:border-ink/25 focus-visible:border-ink/40 focus-visible:ring-4 focus-visible:ring-ink/5 disabled:opacity-60 data-[placeholder]:font-normal data-[placeholder]:text-ink/50",
        className,
      )}
    >
      <span className="truncate"><SelectPrimitive.Value placeholder={placeholder} /></span>
      <SelectPrimitive.Icon asChild><ChevronDown className="h-4 w-4 shrink-0 text-ink/60 transition group-data-[state=open]:rotate-180" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        className="z-[60] max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(16,16,20,0.25)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
      >
        <SelectPrimitive.Viewport>
          {options.map((o) => (
            <SelectPrimitive.Item
              key={o.value}
              value={o.value}
              className="relative flex cursor-pointer select-none items-center gap-3 rounded-xl py-2.5 pl-3 pr-9 text-[15px] text-ink outline-none transition data-[highlighted]:bg-stone-100 data-[state=checked]:font-bold"
            >
              <span className="min-w-0">
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                {o.hint && <span className="block text-xs font-normal text-ink/60">{o.hint}</span>}
              </span>
              <SelectPrimitive.ItemIndicator className="absolute right-3"><Check className="h-4 w-4 text-primary" /></SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);

export default Picker;
