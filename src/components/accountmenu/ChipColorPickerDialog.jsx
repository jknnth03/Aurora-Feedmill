import { useState, useRef, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import StyleIcon from "@mui/icons-material/Style";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import "./ChipColorPickerDialog.scss";
import {
  CHIP_VARS,
  CHIP_GROUPS,
  getDefaultBg,
  getDefaultText,
  applyChipColor,
  initChipColors,
  dispatchChipChange,
} from "./ChipColorPickerUtils";

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

  const vpW = window.innerWidth,
    vpH = window.innerHeight;
  let left = position.left,
    top = position.top;
  if (left + 228 > vpW - 8) left = vpW - 236;
  if (top + 270 > vpH - 8) top = position.top - 276;
  if (left < 8) left = 8;

  const cursorX = hsv[1] * 196;
  const cursorY = (1 - hsv[2]) * 140;
  const previewHex = getHex(...hsv);

  return (
    <div
      ref={popupRef}
      className="ccp-popup"
      style={{ position: "fixed", left, top, zIndex: 9999 }}
      onMouseDown={(e) => e.stopPropagation()}>
      <div className="ccp-sb-wrap">
        <canvas
          ref={canvasRef}
          width={196}
          height={140}
          className="ccp-canvas"
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
        <div className="ccp-cursor" style={{ left: cursorX, top: cursorY }} />
      </div>

      <input
        type="range"
        className="ccp-hue"
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

      <div className="ccp-hex-row">
        <div className="ccp-hex-preview" style={{ background: previewHex }} />
        <input
          className="ccp-hex-input"
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
        <button className="ccp-done-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

const ChipColorPickerDialog = ({ open, onClose }) => {
  const buildState = () => {
    const map = {};
    CHIP_VARS.forEach((item) => {
      map[item.id] = {
        name: localStorage.getItem(`cc_name_${item.id}`) || item.defaultName,
        bg: localStorage.getItem(`cc_bg_${item.id}`) || getDefaultBg(item),
        text:
          localStorage.getItem(`cc_text_${item.id}`) || getDefaultText(item),
      };
    });
    return map;
  };

  const [chips, setChips] = useState(buildState);
  const [pickerState, setPickerState] = useState(null);

  useEffect(() => {
    if (open) setChips(buildState());
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (open) initChipColors();
  }, [open]);

  const isDefaultChip = (id) => {
    const item = CHIP_VARS.find((c) => c.id === id);
    if (!item) return true;
    const c = chips[id];
    return (
      c.name === item.defaultName &&
      c.bg === getDefaultBg(item) &&
      c.text === getDefaultText(item)
    );
  };

  const handleSwatchClick = (e, id, field) => {
    e.stopPropagation();
    if (pickerState?.id === id && pickerState?.field === field) {
      setPickerState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerState({
      id,
      field,
      position: { top: rect.bottom + 6, left: rect.left },
    });
  };

  const handleColorChange = (id, field, hex) => {
    const item = CHIP_VARS.find((c) => c.id === id);
    if (!item) return;
    const cssVar = field === "bg" ? item.cssVar : item.cssVarText;
    document.documentElement.style.setProperty(cssVar, hex);
    localStorage.setItem(`cc_${field}_${id}`, hex);
    setChips((prev) => ({ ...prev, [id]: { ...prev[id], [field]: hex } }));
    dispatchChipChange();
  };

  const handleNameChange = (id, value) => {
    localStorage.setItem(`cc_name_${id}`, value);
    setChips((prev) => ({ ...prev, [id]: { ...prev[id], name: value } }));
    dispatchChipChange();
  };

  const handleReset = (id) => {
    const item = CHIP_VARS.find((c) => c.id === id);
    if (!item) return;
    const defBg = getDefaultBg(item);
    const defText = getDefaultText(item);
    applyChipColor(item, defBg, defText);
    localStorage.removeItem(`cc_bg_${id}`);
    localStorage.removeItem(`cc_text_${id}`);
    localStorage.removeItem(`cc_name_${id}`);
    setChips((prev) => ({
      ...prev,
      [id]: { name: item.defaultName, bg: defBg, text: defText },
    }));
    if (pickerState?.id === id) setPickerState(null);
    dispatchChipChange();
  };

  const handleResetAll = () => {
    CHIP_VARS.forEach((item) => {
      const defBg = getDefaultBg(item);
      const defText = getDefaultText(item);
      applyChipColor(item, defBg, defText);
      localStorage.removeItem(`cc_bg_${item.id}`);
      localStorage.removeItem(`cc_text_${item.id}`);
      localStorage.removeItem(`cc_name_${item.id}`);
    });
    setChips(buildState());
    setPickerState(null);
    dispatchChipChange();
  };

  const handleClose = () => {
    setPickerState(null);
    onClose();
  };

  const activeColor = pickerState
    ? chips[pickerState.id]?.[pickerState.field] || "#ffffff"
    : "#ffffff";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{ className: "ccd-paper" }}>
      <div className="ccd-header">
        <div className="ccd-title-row">
          <StyleIcon className="ccd-icon" />
          <span className="ccd-title">CC &nbsp;–&nbsp; Chip Color Picker</span>
        </div>
        <div className="ccd-header-actions">
          <button
            className="ccd-reset-all-btn"
            onClick={handleResetAll}
            title="Reset all to default">
            <RestartAltIcon style={{ fontSize: 15 }} />
            Reset All
          </button>
          <IconButton className="ccd-close" onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent
        className="ccd-content"
        onClick={() => setPickerState(null)}>
        <div className="ccd-col-header">
          <span className="ccd-col-label-name">Name</span>
          <span className="ccd-col-label-bg">Background</span>
          <span className="ccd-col-label-text">Text Color</span>
          <span className="ccd-col-label-preview">Preview</span>
          <span className="ccd-col-label-reset" />
        </div>

        <div className="ccd-groups">
          {CHIP_GROUPS.map((group) => (
            <div key={group.label} className="ccd-group">
              <div className="ccd-group-label">{group.label}</div>
              <div className="ccd-rows">
                {group.ids.map((id) => {
                  const item = CHIP_VARS.find((c) => c.id === id);
                  if (!item) return null;
                  const c = chips[id] || {};
                  const isBgActive =
                    pickerState?.id === id && pickerState?.field === "bg";
                  const isTextActive =
                    pickerState?.id === id && pickerState?.field === "text";
                  const isModified = !isDefaultChip(id);

                  return (
                    <div
                      key={id}
                      className={`ccd-row ${isBgActive || isTextActive ? "ccd-row--active" : ""}`}
                      onClick={(e) => e.stopPropagation()}>
                      <input
                        className="ccd-name-input"
                        value={c.name || ""}
                        maxLength={24}
                        onChange={(e) => handleNameChange(id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={item.defaultName}
                      />

                      <div className="ccd-swatch-group">
                        <button
                          className={`ccd-swatch ${isBgActive ? "ccd-swatch--active" : ""}`}
                          style={{ background: c.bg }}
                          onClick={(e) => handleSwatchClick(e, id, "bg")}
                          title="Pick background color"
                        />
                        <span className="ccd-hex-label">{c.bg}</span>
                      </div>

                      <div className="ccd-swatch-group">
                        <button
                          className={`ccd-swatch ${isTextActive ? "ccd-swatch--active" : ""}`}
                          style={{ background: c.text }}
                          onClick={(e) => handleSwatchClick(e, id, "text")}
                          title="Pick text color"
                        />
                        <span className="ccd-hex-label">{c.text}</span>
                      </div>

                      <span
                        className="ccd-preview-chip"
                        style={{ background: c.bg, color: c.text }}>
                        {c.name || item.defaultName}
                      </span>

                      <button
                        className={`ccd-reset-btn ${!isModified ? "ccd-reset-btn--hidden" : ""}`}
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
          key={`${pickerState.id}-${pickerState.field}`}
          color={activeColor}
          position={pickerState.position}
          onChange={(hex) =>
            handleColorChange(pickerState.id, pickerState.field, hex)
          }
          onClose={() => setPickerState(null)}
        />
      )}
    </Dialog>
  );
};

export default ChipColorPickerDialog;
