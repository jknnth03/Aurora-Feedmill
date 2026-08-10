import { useRef, useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DrawIcon from "@mui/icons-material/Draw";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./SignatureDialog.scss";

const SignatureDialog = ({ open, onClose, onSubmit }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const lastPos = useRef(null);

  useEffect(() => {
    if (open) {
      setIsEmpty(true);
      lastPos.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    setIsDrawing(true);
    setIsEmpty(false);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#1f1f1f";
    ctx.fill();
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = (e) => {
    e?.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSubmit = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    canvas.toBlob((blob) => {
      onSubmit({ dataUrl, blob });
    }, "image/png");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className="sig-dialog"
      PaperProps={{ className: "sig-dialog__paper" }}>
      <div className="sig-dialog__header">
        <div className="sig-dialog__header-left">
          <DrawIcon className="sig-dialog__header-icon" />
          <span className="sig-dialog__header-title">Add Signature</span>
        </div>
        <IconButton
          size="small"
          className="sig-dialog__close"
          onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="sig-dialog__content">
        <p className="sig-dialog__hint">
          Sign inside the box below using your mouse or finger.
        </p>

        <div className="sig-dialog__canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={600}
            height={260}
            className="sig-dialog__canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <button className="sig-dialog__btn-clear" onClick={handleClear}>
            <DeleteOutlineIcon style={{ fontSize: 16 }} />
            Clear
          </button>
        </div>
      </DialogContent>

      <div className="sig-dialog__footer">
        <button className="sig-dialog__btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className={`sig-dialog__btn-submit${isEmpty ? " sig-dialog__btn-submit--disabled" : ""}`}
          onClick={handleSubmit}
          disabled={isEmpty}>
          <CheckCircleIcon style={{ fontSize: 18 }} />
          Submit Signature
        </button>
      </div>
    </Dialog>
  );
};

export default SignatureDialog;
