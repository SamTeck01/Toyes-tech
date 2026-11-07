import { useLocation } from "react-router-dom";
import { whatsappLink } from "@/config/store";

/** WhatsApp glyph (brand mark, drawn inline so it renders in the official green). */
export const WhatsAppGlyph = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.43 9.43 0 01-4.8-1.31l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.24-9.43 9.45-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 012.76 6.67c0 5.2-4.24 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0012.04.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.95 1.52 5.67L.58 23.3l5.7-1.5a11.3 11.3 0 005.76 1.47h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.34-8.03z" />
  </svg>
);

const HIDDEN_ON = ["/checkout", "/admin", "/pos"];

/** Floating "chat with us" button. Sits above the mobile bottom bar. */
const WhatsAppButton = () => {
  const { pathname } = useLocation();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  return (
    <a
      href={whatsappLink("Hi Toyes Tech, I have a question about a product.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Toyes Tech on WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 md:bottom-6 md:right-6 md:h-auto md:w-auto md:gap-2 md:px-5 md:py-3.5"
    >
      <WhatsAppGlyph className="h-7 w-7 md:h-5 md:w-5" />
      <span className="hidden text-sm font-bold md:inline">Chat with us</span>
    </a>
  );
};

export default WhatsAppButton;
