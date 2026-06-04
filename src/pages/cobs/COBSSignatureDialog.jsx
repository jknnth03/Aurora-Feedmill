import { useRef, useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import CloseIcon from "@mui/icons-material/Close";
import DrawIcon from "@mui/icons-material/Draw";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useGetEvaluatorsQuery } from "../../features/api/usermanagement/userApi";
import "./COBSSignatureDialog.scss";

const buildOptions = (data) =>
  (data ?? []).map((u) => ({
    ...u,
    full_name:
      u.full_name || `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
  }));

const DropdownField = ({
  label,
  value,
  onChange,
  options,
  isLoading,
  disabled,
}) => (
  <div className="cobs-sig__field">
    <label className="cobs-sig__field-label">{label}</label>
    <FormControl fullWidth size="small" className="cobs-sig__select-control">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        disabled={disabled || isLoading}
        className="cobs-sig__select"
        MenuProps={{ PaperProps: { className: "cobs-sig__select-menu" } }}>
        <MenuItem value="" disabled>
          {isLoading ? "Loading..." : `Select ${label.toLowerCase()}`}
        </MenuItem>
        {options.map((u) => (
          <MenuItem key={u.id} value={String(u.id)}>
            {u.full_name || `User #${u.id}`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </div>
);

const COBSSignatureDialog = ({ open, onClose, onSubmit, isSubmitting }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState("");
  const lastPos = useRef(null);

  const { data: evaluatorsData, isFetching: isLoadingEvaluators } =
    useGetEvaluatorsQuery(undefined, { skip: !open });

  const evaluators = buildOptions(evaluatorsData?.data ?? evaluatorsData ?? []);

  useEffect(() => {
    if (open) {
      setIsEmpty(true);
      setSelectedEvaluatorId("");
      lastPos.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#2c1a0e";
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
    if (isSubmitting) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    setIsDrawing(true);
    setIsEmpty(false);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#2c1a0e";
    ctx.fill();
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || isSubmitting) return;
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
    if (isSubmitting) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const selectedEvaluator =
    evaluators.find((u) => String(u.id) === String(selectedEvaluatorId)) ??
    null;

  const handleSubmit = () => {
    if (isEmpty || isSubmitting || !selectedEvaluatorId) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    canvas.toBlob((blob) => {
      onSubmit({ dataUrl, blob, selectedEvaluator });
    }, "image/png");
  };

  const canSubmit = !isEmpty && !isSubmitting && !!selectedEvaluatorId;

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      className="cobs-sig"
      PaperProps={{ className: "cobs-sig__paper" }}>
      <div className="cobs-sig__header">
        <div className="cobs-sig__header-left">
          <DrawIcon className="cobs-sig__header-icon" />
          <span className="cobs-sig__header-title">Add Signature</span>
        </div>
        <IconButton
          size="small"
          className="cobs-sig__close"
          onClick={onClose}
          disabled={isSubmitting}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="cobs-sig__content">
        <DropdownField
          label="Evaluator"
          value={selectedEvaluatorId}
          onChange={setSelectedEvaluatorId}
          options={evaluators}
          isLoading={isLoadingEvaluators}
          disabled={isSubmitting}
        />

        <p className="cobs-sig__hint">
          Sign inside the box below using your mouse or finger.
        </p>

        <div className="cobs-sig__canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={600}
            height={280}
            className="cobs-sig__canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!isSubmitting && (
            <button className="cobs-sig__btn-clear" onClick={handleClear}>
              <DeleteOutlineIcon style={{ fontSize: 16 }} />
              Clear
            </button>
          )}
        </div>
      </DialogContent>

      <div className="cobs-sig__footer">
        <button
          className="cobs-sig__btn-cancel"
          onClick={onClose}
          disabled={isSubmitting}>
          Cancel
        </button>
        <button
          className={`cobs-sig__btn-submit${!canSubmit ? " cobs-sig__btn-submit--disabled" : ""}`}
          onClick={handleSubmit}
          disabled={!canSubmit}>
          {isSubmitting ? (
            <>
              <CircularProgress
                size={14}
                thickness={4}
                style={{ color: "inherit" }}
              />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon style={{ fontSize: 18 }} />
              Submit Signature
            </>
          )}
        </button>
      </div>
    </Dialog>
  );
};

export default COBSSignatureDialog;
