import { createContext, useContext, useState, useEffect } from "react";
import { initPalette } from "../utils/paletteUtils";
import { initTextColors } from "../components/accountmenu/TextColorPickerDialog";
import {
  initChipColors,
  dispatchChipChange,
} from "../components/accountmenu/ChipColorPickerUtils";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    localStorage.setItem("theme", isDark ? "dark" : "light");
    initPalette();
    initTextColors();
    initChipColors();
    dispatchChipChange();
  }, [isDark]);

  useEffect(() => {
    initPalette();
    initTextColors();
    initChipColors();
  }, []);

  const toggleTheme = () => setIsDark((p) => !p);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
