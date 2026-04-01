export const PALETTES = [
  {
    id: "default-orange",
    name: "Default Orange",
    primary: "#f37925",
    light: "#fff5ec",
    dark: "#c85c00",
    rowBg: "#fff5ec",
  },
  {
    id: "ambatali",
    name: "Ambatali",
    primary: "#e05a5a",
    light: "#fff0f0",
    dark: "#b03030",
    rowBg: "#fff0f0",
  },
  {
    id: "arjay",
    name: "Arjay",
    primary: "#5b7fd4",
    light: "#eef2fc",
    dark: "#3a5faa",
    rowBg: "#eef2fc",
  },
  {
    id: "berry",
    name: "Berry",
    primary: "#9c2d6e",
    light: "#fdf0f7",
    dark: "#6e1a4a",
    rowBg: "#fdf0f7",
  },
  {
    id: "blue",
    name: "Blue",
    primary: "#1e88e5",
    light: "#e8f4fd",
    dark: "#1565c0",
    rowBg: "#e8f4fd",
  },
  {
    id: "boris",
    name: "Boris",
    primary: "#e91e8c",
    light: "#fde8f4",
    dark: "#b0006a",
    rowBg: "#fde8f4",
  },
  {
    id: "boss-bry",
    name: "Boss Bry",
    primary: "#3a3a3a",
    light: "#f0f0f0",
    dark: "#1a1a1a",
    rowBg: "#f0f0f0",
  },
  {
    id: "carljustine",
    name: "CarlJustine",
    primary: "#1c3a5e",
    light: "#edf2f8",
    dark: "#0e2040",
    rowBg: "#edf2f8",
  },
  {
    id: "forest",
    name: "Forest",
    primary: "#2e7d32",
    light: "#edf7ee",
    dark: "#1b5e20",
    rowBg: "#edf7ee",
  },
  {
    id: "lavender",
    name: "Lavender",
    primary: "#7b5ea7",
    light: "#f3eefb",
    dark: "#553d80",
    rowBg: "#f3eefb",
  },
  {
    id: "crimson",
    name: "Crimson",
    primary: "#c62828",
    light: "#fdeaea",
    dark: "#8e0000",
    rowBg: "#fdeaea",
  },
  {
    id: "teal",
    name: "Teal",
    primary: "#00796b",
    light: "#e0f2f1",
    dark: "#004d40",
    rowBg: "#e0f2f1",
  },
];

export const applyPalette = (paletteId) => {
  const palette = PALETTES.find((p) => p.id === paletteId);
  if (!palette) return;
  const root = document.documentElement;
  root.style.setProperty("--palette-primary", palette.primary);
  root.style.setProperty("--palette-primary-light", palette.light);
  root.style.setProperty(
    "--palette-primary-dark",
    palette.dark ?? palette.primary,
  );
  root.style.setProperty("--palette-row-bg", palette.rowBg);
  root.style.setProperty("--bg-left", palette.primary);
  localStorage.setItem("selectedPalette", paletteId);
};

export const initPalette = () => {
  const saved = localStorage.getItem("selectedPalette") || "default-orange";
  applyPalette(saved);
  return saved;
};
