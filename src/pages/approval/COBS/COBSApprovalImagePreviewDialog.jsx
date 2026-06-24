import { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DownloadIcon from "@mui/icons-material/Download";
import DownloadingIcon from "@mui/icons-material/Downloading";
import "./COBSApprovalImagePreviewDialog.scss";

const downloadImage = async (url, filename) => {
  const response = await fetch(url, { mode: "cors" });
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
};

const COBSApprovalImagePreviewDialog = ({
  open,
  onClose,
  images = [],
  initialIndex = 0,
}) => {
  const [current, setCurrent] = useState(initialIndex);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadCurrent = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const url = images[current];
      const ext = url.split(".").pop().split("?")[0] || "jpg";
      await downloadImage(url, `image-${current + 1}.${ext}`);
    } catch {
      console.error("Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!images.length) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "cobs-aipd__paper" }}>
      <div className="cobs-aipd__header">
        <span className="cobs-aipd__counter">
          {current + 1} / {images.length}
        </span>
        <div className="cobs-aipd__header-actions">
          <Tooltip title="Download current" placement="bottom">
            <span>
              <IconButton
                size="small"
                className="cobs-aipd__action-btn"
                onClick={handleDownloadCurrent}
                disabled={isDownloading}>
                {isDownloading ? (
                  <DownloadingIcon fontSize="small" />
                ) : (
                  <DownloadIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <IconButton
            size="small"
            className="cobs-aipd__close"
            onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <div className="cobs-aipd__body">
        {images.length > 1 && (
          <IconButton
            className="cobs-aipd__nav cobs-aipd__nav--prev"
            onClick={handlePrev}>
            <ChevronLeftIcon />
          </IconButton>
        )}

        <div className="cobs-aipd__img-wrap">
          <img
            key={current}
            src={images[current]}
            alt={`preview-${current}`}
            className="cobs-aipd__img"
          />
        </div>

        {images.length > 1 && (
          <IconButton
            className="cobs-aipd__nav cobs-aipd__nav--next"
            onClick={handleNext}>
            <ChevronRightIcon />
          </IconButton>
        )}
      </div>

      {images.length > 1 && (
        <div className="cobs-aipd__dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`cobs-aipd__dot${i === current ? " cobs-aipd__dot--active" : ""}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </Dialog>
  );
};

export default COBSApprovalImagePreviewDialog;
