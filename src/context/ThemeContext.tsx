import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeColor = "black" | "blue" | "orange" | "red";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeConfigs: Record<ThemeColor, { primary: string; accent: string; ring: string }> = {
  black: {
    primary: "0 0% 0%",
    accent: "0 0% 96.1%",
    ring: "0 0% 14.9%",
  },
  blue: {
    primary: "225 91% 55%", // Toyes Blue (brand)
    accent: "225 91% 96%",
    ring: "225 91% 55%",
  },
  orange: {
    primary: "24.6 95% 53.1%", // Vibrant Orange
    accent: "24.6 95% 96%",
    ring: "24.6 95% 53.1%",
  },
  red: {
    primary: "0 84.2% 60.2%", // Bright Red
    accent: "0 84.2% 96%",
    ring: "0 84.2% 60.2%",
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    return (localStorage.getItem("toyes-theme") as ThemeColor) || "blue";
  });

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
    localStorage.setItem("toyes-theme", newTheme);
  };

  useEffect(() => {
    const config = themeConfigs[theme];
    const root = document.documentElement;
    
    root.style.setProperty("--primary", config.primary);
    root.style.setProperty("--accent", config.accent);
    root.style.setProperty("--ring", config.ring);
    
    // Update selection colors if needed or just rely on CSS using var(--primary)
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
