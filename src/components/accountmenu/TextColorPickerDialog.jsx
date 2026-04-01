import { useState, useRef, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import TextFormatIcon from "@mui/icons-material/TextFormat";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import "./TextColorPickerDialog.scss";

const TEXT_COLOR_VARS = [
  {
    id: "sidebar-text",
    label: "Sidebar Text",
    cssVar: "--text-sidebar",
    defaultLight: "#616161",
    defaultDark: "#d4d0cb",
  },
  {
    id: "sidebar-icon",
    label: "Sidebar Icons",
    cssVar: "--text-sidebar-icon",
    defaultLight: "#757575",
    defaultDark: "#a8a49d",
  },
  {
    id: "sidebar-active",
    label: "Sidebar Active Text",
    cssVar: "--text-sidebar-active",
    defaultLight: "#ffffff",
    defaultDark: "#ffffff",
  },
  {
    id: "sidebar-sub",
    label: "Sidebar Sub Text",
    cssVar: "--text-sidebar-sub",
    defaultLight: "#757575",
    defaultDark: "#a8a49d",
  },
  {
    id: "appbar-text",
    label: "App Bar Text",
    cssVar: "--text-appbar",
    defaultLight: "#262210",
    defaultDark: "#d4d0cb",
  },
  {
    id: "appbar-icon",
    label: "App Bar Icons",
    cssVar: "--text-appbar-icon",
    defaultLight: "#616161",
    defaultDark: "#a8a49d",
  },
  {
    id: "table-header",
    label: "Table Header Text",
    cssVar: "--text-table-header",
    defaultLight: "#f37925",
    defaultDark: "#f37925",
  },
  {
    id: "table-body",
    label: "Table Body Text",
    cssVar: "--text-table-body",
    defaultLight: "#433b20",
    defaultDark: "#d4d0cb",
  },
  {
    id: "table-action",
    label: "Table Action Icons",
    cssVar: "--text-table-action",
    defaultLight: "#757575",
    defaultDark: "#a8a49d",
  },
  {
    id: "card-title",
    label: "Card Title Text",
    cssVar: "--text-card-title",
    defaultLight: "#262210",
    defaultDark: "#d4d0cb",
  },
  {
    id: "card-label",
    label: "Card Label / Sub Text",
    cssVar: "--text-card-label",
    defaultLight: "#888888",
    defaultDark: "#a0a0b8",
  },
  {
    id: "btn-primary-text",
    label: "Button Primary Text",
    cssVar: "--text-btn-primary",
    defaultLight: "#ffffff",
    defaultDark: "#ffffff",
  },
  {
    id: "btn-secondary-text",
    label: "Button Secondary Text",
    cssVar: "--text-btn-secondary",
    defaultLight: "#433b20",
    defaultDark: "#d4d0cb",
  },
  {
    id: "input-text",
    label: "Input / Form Text",
    cssVar: "--text-input",
    defaultLight: "#262210",
    defaultDark: "#d4d0cb",
  },
  {
    id: "input-placeholder",
    label: "Input Placeholder",
    cssVar: "--text-placeholder",
    defaultLight: "#9ca3af",
    defaultDark: "#a0a0b8",
  },
  {
    id: "input-label",
    label: "Input Label",
    cssVar: "--text-input-label",
    defaultLight: "#433b20",
    defaultDark: "#a8a49d",
  },
  {
    id: "dialog-title",
    label: "Dialog Title Text",
    cssVar: "--text-dialog-title",
    defaultLight: "#262210",
    defaultDark: "#d4d0cb",
  },
  {
    id: "dialog-body",
    label: "Dialog Body Text",
    cssVar: "--text-dialog-body",
    defaultLight: "#433b20",
    defaultDark: "#a8a49d",
  },
  {
    id: "badge-text",
    label: "Badge / Chip Text",
    cssVar: "--text-badge",
    defaultLight: "#ffffff",
    defaultDark: "#ffffff",
  },
  {
    id: "link-text",
    label: "Link Text",
    cssVar: "--text-link",
    defaultLight: "#2563eb",
    defaultDark: "#60a5fa",
  },
  {
    id: "muted-text",
    label: "Muted / Helper Text",
    cssVar: "--text-muted-custom",
    defaultLight: "#888888",
    defaultDark: "#a0a0b8",
  },
];

const GROUPS = [
  {
    label: "Sidebar",
    ids: ["sidebar-text", "sidebar-icon", "sidebar-active", "sidebar-sub"],
  },
  { label: "App Bar", ids: ["appbar-text", "appbar-icon"] },
  { label: "Table", ids: ["table-header", "table-body", "table-action"] },
  { label: "Cards", ids: ["card-title", "card-label"] },
  { label: "Buttons", ids: ["btn-primary-text", "btn-secondary-text"] },
  { label: "Inputs", ids: ["input-text", "input-placeholder", "input-label"] },
  { label: "Dialogs", ids: ["dialog-title", "dialog-body"] },
  { label: "Others", ids: ["badge-text", "link-text", "muted-text"] },
];

function getIsDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function getDefault(item) {
  return getIsDark() ? item.defaultDark : item.defaultLight;
}

function applyTextColor(cssVar, hex) {
  document.documentElement.style.setProperty(cssVar, hex);
}

/**
 * Call this after theme switches so stored custom colors are re-applied,
 * and vars without a stored override fall back to the correct theme default.
 */
function initTextColors() {
  TEXT_COLOR_VARS.forEach((item) => {
    const stored = localStorage.getItem(`tc_${item.cssVar}`);
    // If the user has never customised this var, use the theme default.
    // If they have customised it, honour their choice across both themes.
    applyTextColor(item.cssVar, stored || getDefault(item));
  });
}

export { initTextColors };

// ─── Color math helpers ───────────────────────────────────────────────────────

function hsvToRgb(h, s, v) {
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const m = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][i % 6];
  return m.map((x) => Math.round(x * 255));
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return [h, s, v];
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : null;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ─── Inline Color Picker popup ────────────────────────────────────────────────

const ColorPicker = ({ color, position, onChange, onClose }) => {
  const canvasRef = useRef(null);
  const popupRef = useRef(null);
  const dragging = useRef(false);

  const [hsv, setHsv] = useState(() => {
    const rgb = hexToRgb(color);
    return rgb ? rgbToHsv(...rgb) : [0, 1, 1];
  });
  const [hexVal, setHexVal] = useState(color);

  const getHex = (h, s, v) => {
    const [r, g, b] = hsvToRgb(h, s, v);
    return rgbToHex(r, g, b);
  };

  const drawCanvas = useCallback((h) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width,
      ht = canvas.height;
    const wGrad = ctx.createLinearGradient(0, 0, w, 0);
    wGrad.addColorStop(0, "#fff");
    wGrad.addColorStop(1, `hsl(${h},100%,50%)`);
    ctx.fillStyle = wGrad;
    ctx.fillRect(0, 0, w, ht);
    const bGrad = ctx.createLinearGradient(0, 0, 0, ht);
    bGrad.addColorStop(0, "rgba(0,0,0,0)");
    bGrad.addColorStop(1, "#000");
    ctx.fillStyle = bGrad;
    ctx.fillRect(0, 0, w, ht);
  }, []);

  useEffect(() => {
    drawCanvas(hsv[0]);
  }, [hsv[0], drawCanvas]);

  useEffect(() => {
    const handle = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handle), 0);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const handleCanvasMove = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    setHsv((prev) => {
      const next = [prev[0], x / rect.width, 1 - y / rect.height];
      const hex = getHex(...next);
      setHexVal(hex);
      onChange(hex);
      return next;
    });
  }, []); // eslint-disable-line

  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  let left = position.left;
  let top = position.top;
  if (left + 228 > vpW - 8) left = vpW - 236;
  if (top + 270 > vpH - 8) top = position.top - 276;
  if (left < 8) left = 8;

  const cursorX = hsv[1] * 196;
  const cursorY = (1 - hsv[2]) * 140;
  const previewHex = getHex(...hsv);

  return (
    <div
      ref={popupRef}
      className="tcp-popup"
      style={{ position: "fixed", left, top, zIndex: 9999 }}
      onMouseDown={(e) => e.stopPropagation()}>
      <div className="tcp-sb-wrap">
        <canvas
          ref={canvasRef}
          width={196}
          height={140}
          className="tcp-canvas"
          onMouseDown={(e) => {
            dragging.current = true;
            handleCanvasMove(e.clientX, e.clientY);
          }}
          onMouseMove={(e) => {
            if (dragging.current) handleCanvasMove(e.clientX, e.clientY);
          }}
          onMouseUp={() => {
            dragging.current = false;
          }}
          onMouseLeave={() => {
            dragging.current = false;
          }}
          onTouchStart={(e) =>
            handleCanvasMove(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchMove={(e) =>
            handleCanvasMove(e.touches[0].clientX, e.touches[0].clientY)
          }
        />
        <div className="tcp-cursor" style={{ left: cursorX, top: cursorY }} />
      </div>

      <input
        type="range"
        className="tcp-hue"
        min={0}
        max={360}
        step={1}
        value={Math.round(hsv[0])}
        onChange={(e) => {
          const newH = parseFloat(e.target.value);
          drawCanvas(newH);
          setHsv((prev) => {
            const next = [newH, prev[1], prev[2]];
            const hex = getHex(...next);
            setHexVal(hex);
            onChange(hex);
            return next;
          });
        }}
      />

      <div className="tcp-hex-row">
        <div className="tcp-hex-preview" style={{ background: previewHex }} />
        <input
          className="tcp-hex-input"
          value={hexVal}
          maxLength={7}
          onChange={(e) => {
            setHexVal(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              const rgb = hexToRgb(e.target.value);
              if (rgb) {
                const newHsv = rgbToHsv(...rgb);
                setHsv(newHsv);
                drawCanvas(newHsv[0]);
                onChange(e.target.value);
              }
            }
          }}
        />
        <button className="tcp-done-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────

const TextColorPickerDialog = ({ open, onClose }) => {
  // Re-derive defaults every time the dialog opens so it reads the current theme
  const buildColorMap = () => {
    const map = {};
    TEXT_COLOR_VARS.forEach((item) => {
      map[item.id] =
        localStorage.getItem(`tc_${item.cssVar}`) || getDefault(item);
    });
    return map;
  };

  const [colors, setColors] = useState(buildColorMap);
  const [pickerState, setPickerState] = useState(null);

  // Re-read defaults when the dialog opens (handles theme switch before open)
  useEffect(() => {
    if (open) {
      setColors(buildColorMap());
    }
  }, [open]); // eslint-disable-line

  const handleSwatchClick = (e, id) => {
    e.stopPropagation();
    if (pickerState?.id === id) {
      setPickerState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerState({ id, position: { top: rect.bottom + 6, left: rect.left } });
  };

  const handleColorChange = (id, hex) => {
    const item = TEXT_COLOR_VARS.find((t) => t.id === id);
    if (!item) return;
    applyTextColor(item.cssVar, hex);
    localStorage.setItem(`tc_${item.cssVar}`, hex);
    setColors((prev) => ({ ...prev, [id]: hex }));
  };

  const handleReset = (id) => {
    const item = TEXT_COLOR_VARS.find((t) => t.id === id);
    if (!item) return;
    const def = getDefault(item);
    applyTextColor(item.cssVar, def);
    localStorage.removeItem(`tc_${item.cssVar}`);
    setColors((prev) => ({ ...prev, [id]: def }));
    if (pickerState?.id === id) setPickerState(null);
  };

  const handleResetAll = () => {
    TEXT_COLOR_VARS.forEach((item) => {
      const def = getDefault(item);
      applyTextColor(item.cssVar, def);
      localStorage.removeItem(`tc_${item.cssVar}`);
    });
    setColors(buildColorMap());
    setPickerState(null);
  };

  const handleClose = () => {
    setPickerState(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{ className: "tcd-paper" }}>
      <div className="tcd-header">
        <div className="tcd-title-row">
          <TextFormatIcon className="tcd-icon" />
          <span className="tcd-title">TC &nbsp;–&nbsp; Text Color Picker</span>
        </div>
        <div className="tcd-header-actions">
          <button
            className="tcd-reset-all-btn"
            onClick={handleResetAll}
            title="Reset all to default">
            <RestartAltIcon style={{ fontSize: 15 }} />
            Reset All
          </button>
          <IconButton className="tcd-close" onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent
        className="tcd-content"
        onClick={() => setPickerState(null)}>
        <div className="tcd-groups">
          {GROUPS.map((group) => (
            <div key={group.label} className="tcd-group">
              <div className="tcd-group-label">{group.label}</div>
              <div className="tcd-rows">
                {group.ids.map((id) => {
                  const item = TEXT_COLOR_VARS.find((t) => t.id === id);
                  if (!item) return null;
                  const hex = colors[id];
                  const isDefault = hex === getDefault(item);
                  const isActive = pickerState?.id === id;
                  return (
                    <div
                      key={id}
                      className={`tcd-row ${isActive ? "tcd-row--active" : ""}`}
                      onClick={(e) => e.stopPropagation()}>
                      <span className="tcd-row-label">{item.label}</span>
                      <span className="tcd-row-sample" style={{ color: hex }}>
                        Aa
                      </span>
                      <span className="tcd-row-hex">{hex}</span>
                      <button
                        className={`tcd-swatch ${isActive ? "tcd-swatch--active" : ""}`}
                        style={{ background: hex }}
                        onClick={(e) => handleSwatchClick(e, id)}
                        title="Pick color"
                      />
                      <button
                        className={`tcd-reset-btn ${isDefault ? "tcd-reset-btn--hidden" : ""}`}
                        onClick={() => handleReset(id)}
                        title="Reset to default">
                        <RestartAltIcon style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>

      {pickerState && (
        <ColorPicker
          color={colors[pickerState.id]}
          position={pickerState.position}
          onChange={(hex) => handleColorChange(pickerState.id, hex)}
          onClose={() => setPickerState(null)}
        />
      )}
    </Dialog>
  );
};

export default TextColorPickerDialog;
