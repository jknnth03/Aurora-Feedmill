import { useRef, useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DrawIcon from "@mui/icons-material/Draw";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import "./SignatureDialog.scss";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const OUTPUT_WIDTH = 600;
const OUTPUT_HEIGHT = 260;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });

const processUploadedImage = async (file) => {
  const img = await loadImage(file);
  const ratio = Math.min(
    OUTPUT_WIDTH / img.width,
    OUTPUT_HEIGHT / img.height,
    1,
  );
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const alpha = Math.max(0, Math.min(255, ((240 - lum) * 255) / 60));
    px[i + 3] = Math.min(px[i + 3], alpha);
  }
  ctx.putImageData(imageData, 0, 0);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  return { dataUrl, blob };
};

const SignatureDialog = ({ open, onClose, onSubmit }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [tab, setTab] = useState("draw");
  const [uploaded, setUploaded] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    if (open) {
      setIsEmpty(true);
      setTab("draw");
      setUploaded(null);
      setUploadError("");
      setIsProcessing(false);
      setIsDragOver(false);
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

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Please attach a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Image is too large. Maximum size is 5MB.");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await processUploadedImage(file);
      setUploaded(result);
    } catch {
      setUploadError("Unable to read this image. Please try another file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemoveUpload = () => {
    setUploaded(null);
    setUploadError("");
  };

  const canSubmit = tab === "draw" ? !isEmpty : Boolean(uploaded);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (tab === "upload") {
      onSubmit({ dataUrl: uploaded.dataUrl, blob: uploaded.blob });
      return;
    }
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
        <div className="sig-dialog__tabs">
          <button
            type="button"
            className={`sig-dialog__tab${tab === "draw" ? " sig-dialog__tab--active" : ""}`}
            onClick={() => setTab("draw")}>
            <DrawIcon style={{ fontSize: 16 }} />
            Draw
          </button>
          <button
            type="button"
            className={`sig-dialog__tab${tab === "upload" ? " sig-dialog__tab--active" : ""}`}
            onClick={() => setTab("upload")}>
            <UploadFileIcon style={{ fontSize: 16 }} />
            Upload
          </button>
        </div>

        <div style={{ display: tab === "draw" ? "block" : "none" }}>
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
        </div>

        <div style={{ display: tab === "upload" ? "block" : "none" }}>
          <p className="sig-dialog__hint">
            Attach a clear photo or scan of your signature on white paper.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sig-dialog__file-input"
            onChange={handleFileChange}
          />

          {uploaded ? (
            <div className="sig-dialog__upload-preview">
              <img
                src={uploaded.dataUrl}
                alt="uploaded signature"
                className="sig-dialog__upload-preview-img"
              />
              <button
                type="button"
                className="sig-dialog__btn-clear"
                onClick={handleRemoveUpload}>
                <DeleteOutlineIcon style={{ fontSize: 16 }} />
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`sig-dialog__dropzone${isDragOver ? " sig-dialog__dropzone--active" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              disabled={isProcessing}>
              <UploadFileIcon style={{ fontSize: 32 }} />
              <span className="sig-dialog__dropzone-title">
                {isProcessing
                  ? "Processing..."
                  : "Click to attach or drag an image here"}
              </span>
              <span className="sig-dialog__dropzone-sub">
                PNG, JPG or WEBP, up to 5MB
              </span>
            </button>
          )}

          {uploadError && (
            <p className="sig-dialog__upload-error">{uploadError}</p>
          )}
        </div>
      </DialogContent>

      <div className="sig-dialog__footer">
        <button className="sig-dialog__btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className={`sig-dialog__btn-submit${!canSubmit ? " sig-dialog__btn-submit--disabled" : ""}`}
          onClick={handleSubmit}
          disabled={!canSubmit}>
          <CheckCircleIcon style={{ fontSize: 18 }} />
          Submit Signature
        </button>
      </div>
    </Dialog>
  );
};

export default SignatureDialog;
