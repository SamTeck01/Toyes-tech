import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme, ThemeColor } from "@/context/ThemeContext";

const VALID_THEMES = ["black", "blue", "orange", "red"] as const;

export const ThemeWatcher = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Check if the current pathname is just a theme name (e.g., /blue)
    // or starts with a theme name (e.g., /blue/)
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0]?.toLowerCase();

    if (firstSegment && (VALID_THEMES as readonly string[]).includes(firstSegment)) {
      setTheme(firstSegment as ThemeColor);
      
      // Remove the theme segment from the URL and redirect to the cleaner path
      const remainingPath = "/" + segments.slice(1).join("/");
      navigate(remainingPath, { replace: true });
    }
  }, [pathname, setTheme, navigate]);

  return null;
};
