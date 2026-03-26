import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { useLazyGetCobsByIdQuery } from "../../../features/api/checklist-form/cobsApi";
import "./COBSModal.scss";

const SkeletonLoader = () => (
  <div className="cobsm__skeleton-wrap">
    {[50, 75, 60, 80, 55, 70, 65].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
  </div>
);

const COBSPreviewDialog = ({ open, onClose, checklist_id }) => {
  const [fetchCobsById] = useLazyGetCobsByIdQuery();
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (open && checklist_id) {
      setLoading(true);
      fetchCobsById(checklist_id, true)
        .unwrap()
        .then((res) => setSelectedRow(res?.data ?? null))
        .catch((err) => console.error("Fetch failed:", err))
        .finally(() => setLoading(false));
    } else {
      setSelectedRow(null);
    }
  }, [open, checklist_id, fetchCobsById]);

  const viewForms = selectedRow?.forms ?? [];

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "cobsm__paper" }}>
      <div className="cobsm__header">
        <div className="cobsm__header-title">
          <RemoveRedEyeIcon className="cobsm__header-icon" />
          <span>Checklist</span>
        </div>
        <IconButton className="cobsm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="cobsm__content">
        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="cobsm__group">
            {viewForms.length === 0 ? (
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: "20px 0",
                }}>
                No sections found.
              </p>
            ) : (
              viewForms.map((form, idx) => (
                <div
                  key={idx}
                  className="cobsm__section-card"
                  style={{ marginBottom: 12 }}>
                  <div className="cobsm__section-card-header">
                    <span className="cobsm__section-badge">
                      Section {idx + 1}
                    </span>
                  </div>
                  <div
                    className="cobsm__input-wrap cobsm__input-wrap--disabled"
                    style={{ marginBottom: 10 }}>
                    <label className="cobsm__label">Area / Section Name</label>
                    <input
                      type="text"
                      value={form.name ?? "—"}
                      disabled
                      readOnly
                      autoComplete="off"
                    />
                  </div>
                  <p className="cobsm__sub-label">Items</p>
                  {Array.isArray(form.item) &&
                    form.item.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="cobsm__item-row cobsm__item-row--disabled">
                        <div className="cobsm__input-wrap cobsm__input-wrap--disabled cobsm__input-wrap--grow">
                          <label className="cobsm__label">Item Name</label>
                          <input
                            type="text"
                            value={item.name}
                            disabled
                            readOnly
                            autoComplete="off"
                          />
                        </div>
                        <div className="cobsm__input-wrap cobsm__input-wrap--disabled cobsm__input-wrap--type">
                          <label className="cobsm__label">Type</label>
                          <input
                            type="text"
                            value={item.type}
                            disabled
                            readOnly
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default COBSPreviewDialog;
