import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Password box with a show/hide eye button. Pass the same className you'd give a normal input. */
const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(({ className, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} {...props} type={show ? "text" : "password"} className={cn(className, "pr-12")} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink/45 transition hover:bg-stone-100 hover:text-ink"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
