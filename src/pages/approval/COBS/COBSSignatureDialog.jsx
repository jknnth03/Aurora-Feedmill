import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DrawIcon from "@mui/icons-material/Draw";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useState, useRef, useEffect, useCallback } from "react";
import "./COBSSignatureDialog.scss";

const COBSSignatureDialog = ({
  open,
  onClose,
  onSubmit,
  signerName = "",
  isSubmitting = false,
}) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (open) {
      setIsEmpty(true);
    }
  }, [open]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  }, []);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);
    return () => {
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  const handleSubmit = () => {
    if (isEmpty || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    canvasRef.current.toBlob((blob) => {
      onSubmit?.({ dataUrl, blob });
    }, "image/png");
  };

  const handleClose = () => {
    clearPad();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        handleClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "cobssig__paper" }}>
      <div className="cobssig__header">
        <div className="cobssig__header-title">
          <DrawIcon sx={{ fontSize: 17 }} />
          <span>Add Signature</span>
        </div>
        <IconButton
          size="small"
          className="cobssig__close"
          onClick={handleClose}
          disabled={isSubmitting}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="cobssig__content">
        <p className="cobssig__instruction">
          Sign inside the box below using your mouse or finger.
        </p>

        <div className="cobssig__canvas-wrap">
          <div className="cobssig__clear-row">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
              onClick={clearPad}
              disabled={isEmpty || isSubmitting}
              className="cobssig__clear-btn">
              Clear
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={560}
            height={200}
            className="cobssig__canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
          />

          <div className="cobssig__baseline-row">
            <div className="cobssig__baseline" />
            {signerName && (
              <span className="cobssig__signer-watermark">
                {signerName.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </DialogContent>

      <DialogActions className="cobssig__footer">
        <Button
          variant="text"
          onClick={handleClose}
          disabled={isSubmitting}
          className="cobssig__btn-cancel">
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
          onClick={handleSubmit}
          disabled={isEmpty || isSubmitting}
          className="cobssig__btn-submit">
          {isSubmitting ? "SUBMITTING…" : "ACKNOWLEDGE"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default COBSSignatureDialog;
