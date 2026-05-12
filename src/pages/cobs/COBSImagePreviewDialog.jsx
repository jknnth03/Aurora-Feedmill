import { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./COBSImagePreviewDialog.scss";

const COBSImagePreviewDialog = ({
  open,
  onClose,
  images = [],
  initialIndex = 0,
}) => {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    if (open) setCurrent(initialIndex);
  }, [open, initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrent((p) => (p === 0 ? images.length - 1 : p - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrent((p) => (p === images.length - 1 ? 0 : p + 1));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handlePrev, handleNext, onClose]);

  if (!images.length) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "cobs-img__paper" }}>
      <div className="cobs-img__header">
        <span className="cobs-img__counter">
          {current + 1} / {images.length}
        </span>
        <IconButton size="small" className="cobs-img__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="cobs-img__body">
        {images.length > 1 && (
          <IconButton
            className="cobs-img__nav cobs-img__nav--prev"
            onClick={handlePrev}>
            <ChevronLeftIcon />
          </IconButton>
        )}

        <div className="cobs-img__img-wrap">
          <img
            key={current}
            src={images[current]}
            alt={`preview-${current}`}
            className="cobs-img__img"
          />
        </div>

        {images.length > 1 && (
          <IconButton
            className="cobs-img__nav cobs-img__nav--next"
            onClick={handleNext}>
            <ChevronRightIcon />
          </IconButton>
        )}
      </div>

      {images.length > 1 && (
        <div className="cobs-img__dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`cobs-img__dot${i === current ? " cobs-img__dot--active" : ""}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </Dialog>
  );
};

export default COBSImagePreviewDialog;
