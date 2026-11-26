import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Premium toasts: light, rounded, soft shadow, coloured icon, close button. */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    position="top-center"
    richColors
    closeButton
    duration={3500}
    className="toaster group"
    toastOptions={{
      classNames: {
        toast: "group toast !rounded-2xl !border !border-line !bg-white !text-ink !shadow-[0_16px_40px_-12px_rgba(16,16,20,0.3)] !px-4 !py-3.5 !text-[15px] !font-semibold !gap-3",
        description: "!text-ink/70 !font-normal",
        actionButton: "!bg-primary !text-white !rounded-lg",
        cancelButton: "!bg-stone-100 !text-ink !rounded-lg",
        closeButton: "!border-line !bg-white",
        success: "[&_[data-icon]]:!text-emerald-600",
        error: "[&_[data-icon]]:!text-red-600",
        warning: "[&_[data-icon]]:!text-amber-600",
      },
    }}
    {...props}
  />
);

export { Toaster, toast };
