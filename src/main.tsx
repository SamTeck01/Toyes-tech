import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Pick up new versions without anyone having to clear the browser: check every minute,
// and when a new version is ready the page reloads itself into it.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (reg) setInterval(() => void reg.update(), 60_000);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
