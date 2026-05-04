import { useState, useEffect } from "react";

export const CHIP_VARS = [
  {
    id: "chip-active",
    label: "Active",
    defaultName: "Active",
    cssVar: "--chip-active-bg",
    cssVarText: "--chip-active-text",
    defaultLight: "#e8f5e9",
    defaultDark: "#1b3a1e",
    defaultTextLight: "#2e7d32",
    defaultTextDark: "#66bb6a",
  },
  {
    id: "chip-inactive",
    label: "Inactive",
    defaultName: "Inactive",
    cssVar: "--chip-inactive-bg",
    cssVarText: "--chip-inactive-text",
    defaultLight: "#f5f5f5",
    defaultDark: "#2a2a2a",
    defaultTextLight: "#757575",
    defaultTextDark: "#a0a0a0",
  },
  {
    id: "chip-pending",
    label: "Pending",
    defaultName: "Pending",
    cssVar: "--chip-pending-bg",
    cssVarText: "--chip-pending-text",
    defaultLight: "#fff8e1",
    defaultDark: "#3a2e00",
    defaultTextLight: "#f57f17",
    defaultTextDark: "#ffca28",
  },
  {
    id: "chip-approved",
    label: "Approved",
    defaultName: "Approved",
    cssVar: "--chip-approved-bg",
    cssVarText: "--chip-approved-text",
    defaultLight: "#e3f2fd",
    defaultDark: "#0d2a3a",
    defaultTextLight: "#1565c0",
    defaultTextDark: "#42a5f5",
  },
  {
    id: "chip-rejected",
    label: "Rejected",
    defaultName: "Rejected",
    cssVar: "--chip-rejected-bg",
    cssVarText: "--chip-rejected-text",
    defaultLight: "#ffebee",
    defaultDark: "#3a0d0d",
    defaultTextLight: "#c62828",
    defaultTextDark: "#ef9a9a",
  },
  {
    id: "chip-draft",
    label: "Draft",
    defaultName: "Draft",
    cssVar: "--chip-draft-bg",
    cssVarText: "--chip-draft-text",
    defaultLight: "#f3e5f5",
    defaultDark: "#2a1a2e",
    defaultTextLight: "#6a1b9a",
    defaultTextDark: "#ba68c8",
  },
  {
    id: "chip-processing",
    label: "Processing",
    defaultName: "Processing",
    cssVar: "--chip-processing-bg",
    cssVarText: "--chip-processing-text",
    defaultLight: "#e0f7fa",
    defaultDark: "#003a3a",
    defaultTextLight: "#00695c",
    defaultTextDark: "#4db6ac",
  },
  {
    id: "chip-cancelled",
    label: "Cancelled",
    defaultName: "Cancelled",
    cssVar: "--chip-cancelled-bg",
    cssVarText: "--chip-cancelled-text",
    defaultLight: "#fce4ec",
    defaultDark: "#3a0d1a",
    defaultTextLight: "#880e4f",
    defaultTextDark: "#f48fb1",
  },
  {
    id: "chip-completed",
    label: "Completed",
    defaultName: "Completed",
    cssVar: "--chip-completed-bg",
    cssVarText: "--chip-completed-text",
    defaultLight: "#e8f5e9",
    defaultDark: "#0a2e12",
    defaultTextLight: "#1b5e20",
    defaultTextDark: "#81c784",
  },
  {
    id: "chip-warning",
    label: "Warning",
    defaultName: "Warning",
    cssVar: "--chip-warning-bg",
    cssVarText: "--chip-warning-text",
    defaultLight: "#fff3e0",
    defaultDark: "#3a1e00",
    defaultTextLight: "#e65100",
    defaultTextDark: "#ffb74d",
  },
];

export const CHIP_GROUPS = [
  {
    label: "Status",
    ids: [
      "chip-active",
      "chip-inactive",
      "chip-pending",
      "chip-approved",
      "chip-rejected",
    ],
  },
  {
    label: "Workflow",
    ids: [
      "chip-draft",
      "chip-processing",
      "chip-cancelled",
      "chip-completed",
      "chip-warning",
    ],
  },
];

export const CHIP_SX = {
  fontWeight: 550,
  fontSize: "0.6rem",
  height: "22px",
  fontFamily: "Poppins, sans-serif",
};

export function getIsDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export function getDefaultBg(item) {
  return getIsDark() ? item.defaultDark : item.defaultLight;
}

export function getDefaultText(item) {
  return getIsDark() ? item.defaultTextDark : item.defaultTextLight;
}

export function applyChipColor(item, bg, text) {
  document.documentElement.style.setProperty(item.cssVar, bg);
  document.documentElement.style.setProperty(item.cssVarText, text);
}

export function initChipColors() {
  CHIP_VARS.forEach((item) => {
    const bg = localStorage.getItem(`cc_bg_${item.id}`) || getDefaultBg(item);
    const text =
      localStorage.getItem(`cc_text_${item.id}`) || getDefaultText(item);
    document.documentElement.style.setProperty(item.cssVar, bg);
    document.documentElement.style.setProperty(item.cssVarText, text);
  });
}

if (typeof window !== "undefined") {
  const _applyStoredColors = () => {
    initChipColors();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _applyStoredColors);
  } else {
    _applyStoredColors();
  }
}

export function dispatchChipChange() {
  window.dispatchEvent(new CustomEvent("chipColorsChanged"));
}

export function getChipName(id) {
  const item = CHIP_VARS.find((c) => c.id === id);
  if (!item) return id;
  return localStorage.getItem(`cc_name_${id}`) || item.defaultName;
}

export function getChipBg(id) {
  const item = CHIP_VARS.find((c) => c.id === id);
  if (!item) return "#e0e0e0";
  return localStorage.getItem(`cc_bg_${id}`) || getDefaultBg(item);
}

export function getChipTextColor(id) {
  const item = CHIP_VARS.find((c) => c.id === id);
  if (!item) return "#333";
  return localStorage.getItem(`cc_text_${id}`) || getDefaultText(item);
}

export function useChipColors() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("chipColorsChanged", handler);
    return () => window.removeEventListener("chipColorsChanged", handler);
  }, []);
}
