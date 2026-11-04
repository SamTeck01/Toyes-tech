import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  invert?: boolean;
}

/** Toyes Tech brand mark: a rounded "T" chip with the wordmark. */
export const LogoMark = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <rect width="40" height="40" rx="11" fill="hsl(var(--primary))" />
    <path d="M11 13h18v4.2h-6.8V29h-4.4V17.2H11z" fill="#fff" />
    <circle cx="29" cy="27" r="2.6" fill="#fff" opacity=".85" />
  </svg>
);

const Logo = ({ className = "", invert = false }: LogoProps) => (
  <Link to="/" className={`flex items-center gap-2.5 shrink-0 ${className}`} aria-label="Toyes Tech home">
    <LogoMark />
    <span className={`text-lg sm:text-xl font-extrabold tracking-tight leading-none ${invert ? "text-white" : "text-foreground"}`}>
      Toyes<span className="text-primary">Tech</span>
    </span>
  </Link>
);

export default Logo;
