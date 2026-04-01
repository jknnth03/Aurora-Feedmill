import { useState, useRef, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PaletteIcon from "@mui/icons-material/Palette";
import CheckIcon from "@mui/icons-material/Check";
import "./PalettePickerDialog.scss";
import { PALETTES, applyPalette, initPalette } from "../../utils/paletteUtils";

export { applyPalette, initPalette };

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
      className="cp-popup"
      style={{ position: "fixed", left, top, zIndex: 9999 }}
      onMouseDown={(e) => e.stopPropagation()}>
      <div className="cp-sb-wrap">
        <canvas
          ref={canvasRef}
          width={196}
          height={140}
          className="cp-canvas"
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
        <div className="cp-cursor" style={{ left: cursorX, top: cursorY }} />
      </div>

      <input
        type="range"
        className="cp-hue"
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

      <div className="cp-hex-row">
        <div className="cp-hex-preview" style={{ background: previewHex }} />
        <input
          className="cp-hex-input"
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
        <button className="cp-done-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

const PalettePickerDialog = ({ open, onClose, selectedPalette, onSelect }) => {
  const [pickerState, setPickerState] = useState(null);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const handleSwatchClick = (e, paletteId, field) => {
    e.stopPropagation();
    if (
      pickerState &&
      pickerState.paletteId === paletteId &&
      pickerState.field === field
    ) {
      setPickerState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerState({
      paletteId,
      field,
      position: { top: rect.bottom + 6, left: rect.left },
    });
  };

  const handleColorChange = (paletteId, field, hex) => {
    const palette = PALETTES.find((p) => p.id === paletteId);
    if (!palette) return;
    palette[field] = hex;
    if (field === "light") palette.rowBg = hex;
    if (selectedPalette === paletteId) applyPalette(paletteId);
    refresh();
  };

  const handleNameChange = (paletteId, newName) => {
    const palette = PALETTES.find((p) => p.id === paletteId);
    if (!palette) return;
    palette.name = newName;
    refresh();
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
      PaperProps={{ className: "palette-dialog__paper" }}>
      <div className="palette-dialog__header">
        <div className="palette-dialog__title-row">
          <PaletteIcon className="palette-dialog__icon" />
          <span className="palette-dialog__title">
            PP &nbsp;–&nbsp; Palette Picker
          </span>
        </div>
        <IconButton
          className="palette-dialog__close"
          onClick={handleClose}
          size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent
        className="palette-dialog__content"
        onClick={() => setPickerState(null)}>
        <div className="palette-dialog__grid">
          {PALETTES.map((palette) => {
            const isSelected = selectedPalette === palette.id;
            return (
              <div
                key={palette.id}
                className={`palette-card ${isSelected ? "palette-card--selected" : ""}`}
                style={{
                  "--p-color": palette.primary,
                  "--p-light": palette.light,
                }}>
                <div className="palette-card__header">
                  {isSelected && (
                    <span className="palette-card__check">
                      <CheckIcon style={{ fontSize: 14 }} />
                    </span>
                  )}
                  <input
                    className="palette-card__name-input"
                    value={palette.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      handleNameChange(palette.id, e.target.value)
                    }
                    title="Click to rename"
                  />
                </div>

                <div className="palette-card__preview" />

                <div
                  className="palette-card__swatches"
                  onClick={(e) => e.stopPropagation()}>
                  {[
                    { field: "primary", label: "Primary" },
                    { field: "light", label: "Light" },
                    { field: "dark", label: "Dark" },
                  ].map(({ field, label }) => (
                    <div key={field} className="palette-card__swatch-row">
                      <span className="palette-card__swatch-label">
                        {label}
                      </span>
                      <button
                        className={`palette-card__swatch ${
                          pickerState?.paletteId === palette.id &&
                          pickerState?.field === field
                            ? "palette-card__swatch--active"
                            : ""
                        }`}
                        style={{ background: palette[field] }}
                        onClick={(e) => handleSwatchClick(e, palette.id, field)}
                        title={`Edit ${label} color`}
                      />
                      <span className="palette-card__swatch-hex">
                        {palette[field]}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="palette-card__btn"
                  onClick={() => onSelect(palette.id)}>
                  SELECT &nbsp;
                  <PaletteIcon style={{ fontSize: 14 }} />
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>

      {pickerState && (
        <ColorPicker
          color={
            PALETTES.find((p) => p.id === pickerState.paletteId)?.[
              pickerState.field
            ] ?? "#000000"
          }
          position={pickerState.position}
          onChange={(hex) =>
            handleColorChange(pickerState.paletteId, pickerState.field, hex)
          }
          onClose={() => setPickerState(null)}
        />
      )}
    </Dialog>
  );
};

export default PalettePickerDialog;
