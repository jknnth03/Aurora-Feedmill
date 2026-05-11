import { useState, useRef, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  useGetQuestionnaireQuery,
  useCreateCobMutation,
} from "../../features/api/cobs/cobsApi";
import "./COBSStartCheckingDialog.scss";

const SCORE_OPTIONS = [0, 50, 75, 100];
const TEMPORAL_AUDIT_OPTIONS = [
  "Spot/Ongoing",
  "Pre-operation",
  "Post-operation",
];

const getNow = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const COBSStartCheckingDialog = ({
  open,
  onClose,
  unitName,
  week,
  month,
  year,
  checklistId = 1,
  unitId,
  approverId,
}) => {
  const [answers, setAnswers] = useState({});
  const [remarks, setRemarks] = useState({});
  const [images, setImages] = useState({});
  const [temporalAudit, setTemporalAudit] = useState("");
  const [goodPoints, setGoodPoints] = useState("");
  const [othersRemarks, setOthersRemarks] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const fileInputRefs = useRef({});
  const intervalRef = useRef(null);

  const { data, isFetching } = useGetQuestionnaireQuery(checklistId, {
    skip: !open,
  });
  const [createCob, { isLoading }] = useCreateCobMutation();

  const questionnaireData = data?.data;

  useEffect(() => {
    if (!open) {
      clearInterval(intervalRef.current);
      return;
    }
    setStartTime(getNow());
    setEndTime(getNow());
    intervalRef.current = setInterval(() => {
      setEndTime(getNow());
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [open]);

  const getKey = (categoryName, itemName, itemIndex, subItemIndex) =>
    `${categoryName}__${itemName}__${itemIndex}__${subItemIndex}`;

  const handleScore = (key, score) =>
    setAnswers((prev) => ({ ...prev, [key]: score }));

  const handleRemarks = (key, value) =>
    setRemarks((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (key, files) =>
    setImages((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), ...Array.from(files)],
    }));

  const handleRemoveImage = (key, idx) =>
    setImages((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));

  const buildFormData = (isCompleted) => {
    const formData = new FormData();
    formData.append("checklist_id", checklistId);
    formData.append("unit_id", unitId ?? "");
    formData.append("approver_id", approverId ?? "");
    formData.append("is_completed", isCompleted);

    let responseIndex = 0;
    const keyToIndex = {};

    questionnaireData?.items?.forEach((category) => {
      category.items?.forEach((item, itemIdx) => {
        item.sub_items?.forEach((subItem, subIdx) => {
          const key = getKey(category.name, item.name, itemIdx, subIdx);
          formData.append(
            `response[${responseIndex}]`,
            JSON.stringify({
              checklist: category.name,
              item: item.name,
              sub_item: subItem.name,
              score: answers[key] ?? 0,
              remarks: remarks[key] ?? "",
            }),
          );
          keyToIndex[key] = responseIndex;
          responseIndex++;
        });
      });
    });

    Object.entries(images).forEach(([key, fileArr]) => {
      const idx = keyToIndex[key];
      if (idx === undefined) return;
      fileArr.forEach((file, fileIdx) => {
        formData.append(`image[${idx}][${fileIdx}]`, file);
      });
    });

    return formData;
  };

  const handleSubmit = async (isCompleted) => {
    try {
      await createCob(buildFormData(isCompleted)).unwrap();
      setSnackbar({
        open: true,
        message: isCompleted ? "Submitted successfully!" : "Saved as draft!",
        severity: "success",
      });
      handleClose();
    } catch {
      setSnackbar({
        open: true,
        message: "Something went wrong.",
        severity: "error",
      });
    }
  };

  const handleClose = () => {
    setAnswers({});
    setRemarks({});
    setImages({});
    setTemporalAudit("");
    setGoodPoints("");
    setOthersRemarks("");
    setStartTime("");
    setEndTime("");
    clearInterval(intervalRef.current);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "cobs-sc__paper" }}>
        <div className="cobs-sc__header">
          <div className="cobs-sc__header-title">
            <ChecklistIcon className="cobs-sc__header-icon" />
            <span>Start Checking</span>
          </div>
          <span className="cobs-sc__name-value">
            {unitName} — {week} ({month}/{year})
          </span>
          <IconButton
            size="small"
            className="cobs-sc__close"
            onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="cobs-sc__content">
          {isFetching ? (
            <div className="cobs-sc__skeleton-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={48}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(230, 100, 20, 0.15)",
                    "&::after": {
                      background:
                        "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.25), transparent)",
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              {questionnaireData?.items?.map((category) => (
                <div key={category.name} className="cobs-sc__section">
                  <div className="cobs-sc__section-header">{category.name}</div>
                  <div className="cobs-sc__table-scroll">
                    <table className="cobs-sc__table">
                      <thead>
                        <tr className="cobs-sc__thead-row">
                          <th className="cobs-sc__th cobs-sc__th--item">
                            Item
                          </th>
                          <th className="cobs-sc__th cobs-sc__th--compliance">
                            Compliance
                          </th>
                          <th className="cobs-sc__th cobs-sc__th--remarks">
                            Remarks
                          </th>
                          <th className="cobs-sc__th cobs-sc__th--attachment">
                            Attachment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items?.map((item, itemIdx) =>
                          item.sub_items?.map((subItem, subIdx) => {
                            const key = getKey(
                              category.name,
                              item.name,
                              itemIdx,
                              subIdx,
                            );
                            const selectedScore = answers[key];
                            const fileList = images[key] ?? [];

                            return (
                              <tr key={key} className="cobs-sc__tr">
                                <td className="cobs-sc__td cobs-sc__td--item">
                                  {subIdx + 1}. {subItem.name}
                                </td>
                                <td className="cobs-sc__td cobs-sc__td--compliance">
                                  <div className="cobs-sc__radio-box">
                                    {SCORE_OPTIONS.map((score) => (
                                      <label
                                        key={score}
                                        className="cobs-sc__radio-item">
                                        <input
                                          type="radio"
                                          name={key}
                                          value={score}
                                          checked={selectedScore === score}
                                          onChange={() =>
                                            handleScore(key, score)
                                          }
                                          className="cobs-sc__radio-input"
                                        />
                                        <span
                                          className={`cobs-sc__radio-circle cobs-sc__radio-circle--${score}`}
                                        />
                                        <span className="cobs-sc__radio-text">
                                          {score}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </td>
                                <td className="cobs-sc__td cobs-sc__td--remarks">
                                  <textarea
                                    className="cobs-sc__textarea"
                                    placeholder="Enter your response"
                                    value={remarks[key] ?? ""}
                                    onChange={(e) =>
                                      handleRemarks(key, e.target.value)
                                    }
                                    rows={2}
                                  />
                                </td>
                                <td className="cobs-sc__td cobs-sc__td--attachment">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: "none" }}
                                    ref={(el) =>
                                      (fileInputRefs.current[key] = el)
                                    }
                                    onChange={(e) =>
                                      handleImageChange(key, e.target.files)
                                    }
                                  />
                                  {fileList.length > 0 ? (
                                    <div className="cobs-sc__attach-list">
                                      {fileList.map((file, i) => (
                                        <div
                                          key={i}
                                          className="cobs-sc__attach-item">
                                          <Tooltip
                                            title={file.name}
                                            placement="top">
                                            <span className="cobs-sc__attach-name">
                                              {file.name}
                                            </span>
                                          </Tooltip>
                                          <IconButton
                                            size="small"
                                            className="cobs-sc__attach-remove"
                                            onClick={() =>
                                              handleRemoveImage(key, i)
                                            }>
                                            <DeleteOutlineIcon
                                              sx={{ fontSize: 13 }}
                                            />
                                          </IconButton>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        className="cobs-sc__attach-btn cobs-sc__attach-btn--more"
                                        onClick={() =>
                                          fileInputRefs.current[key]?.click()
                                        }>
                                        <AttachFileIcon sx={{ fontSize: 13 }} />
                                        Add more
                                      </button>
                                    </div>
                                  ) : (
                                    <Tooltip
                                      title="Attach file"
                                      placement="top">
                                      <button
                                        type="button"
                                        className="cobs-sc__attach-btn"
                                        onClick={() =>
                                          fileInputRefs.current[key]?.click()
                                        }>
                                        <AttachFileIcon sx={{ fontSize: 14 }} />
                                        <span>No file</span>
                                      </button>
                                    </Tooltip>
                                  )}
                                </td>
                              </tr>
                            );
                          }),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="cobs-sc__others">
                <div className="cobs-sc__others-header">Others</div>
                <div className="cobs-sc__others-body">
                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Start Time</span>
                    <div className="cobs-sc__others-input-box">
                      <span className="cobs-sc__others-time">{startTime}</span>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">End Time</span>
                    <div className="cobs-sc__others-input-box">
                      <span className="cobs-sc__others-time">{endTime}</span>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">
                      Temporal Audit
                    </span>
                    <div className="cobs-sc__others-input-box">
                      <div className="cobs-sc__temporal-options">
                        {TEMPORAL_AUDIT_OPTIONS.map((opt) => (
                          <label key={opt} className="cobs-sc__temporal-item">
                            <input
                              type="radio"
                              name="temporal_audit"
                              value={opt}
                              checked={temporalAudit === opt}
                              onChange={() => setTemporalAudit(opt)}
                              className="cobs-sc__radio-input"
                            />
                            <span className="cobs-sc__temporal-circle" />
                            <span className="cobs-sc__temporal-text">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Good Points</span>
                    <textarea
                      className="cobs-sc__others-textarea"
                      placeholder="Enter good points observed"
                      value={goodPoints}
                      onChange={(e) => setGoodPoints(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Remarks</span>
                    <textarea
                      className="cobs-sc__others-textarea"
                      placeholder="Enter remarks"
                      value={othersRemarks}
                      onChange={(e) => setOthersRemarks(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions className="cobs-sc__footer">
          <Button
            variant="text"
            onClick={handleClose}
            disabled={isLoading}
            className="cobs-sc__btn-close">
            CLOSE
          </Button>
          <div className="cobs-sc__footer-right">
            <Button
              variant="outlined"
              onClick={() => handleSubmit(0)}
              disabled={isLoading}
              className="cobs-sc__btn-draft">
              {isLoading ? "Saving..." : "SAVE AS DRAFT"}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleSubmit(1)}
              disabled={isLoading}
              className="cobs-sc__btn-submit">
              {isLoading ? "Submitting..." : "SUBMIT"}
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily: "Poppins, sans-serif", fontSize: "0.82rem" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default COBSStartCheckingDialog;
