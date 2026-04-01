import { createContext, useContext, useState, useEffect } from "react";
import { initPalette } from "../utils/paletteUtils";
import { initTextColors } from "../components/accountmenu/TextColorPickerDialog";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  // Runs on every theme toggle — applies palette + text color vars for the new theme
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    localStorage.setItem("theme", isDark ? "dark" : "light");
    initPalette();
    initTextColors();
  }, [isDark]);

  // Also run once on mount to restore any saved colors
  useEffect(() => {
    initPalette();
    initTextColors();
  }, []);

  const toggleTheme = () => setIsDark((p) => !p);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
