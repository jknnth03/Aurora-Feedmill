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
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import {
  useGetQuestionnaireQuery,
  useCreateCobMutation,
} from "../../features/api/cobs/cobsApi";
import COBSImagePreviewDialog from "./COBSImagePreviewDialog";
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

const formatDateTime = (raw) => {
  if (!raw) return "—";
  const date = new Date(raw);
  if (isNaN(date)) return "—";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateDisplay = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const buildResponseMap = (responses = []) => {
  const map = {};
  responses.forEach(({ response, images }) => {
    const subKey = response.sub_item ?? response.sub_name ?? "";
    const key = `${response.checklist}__${response.item}__${subKey}`;
    map[key] = { ...response, images: images ?? [] };
  });
  return map;
};

const buildDraftAnswers = (questionnaireData, responses = []) => {
  const answers = {};
  const remarks = {};
  const existingImages = {};

  const responseByKey = {};
  responses.forEach(({ response, images }) => {
    const subKey = response.sub_item ?? response.sub_name ?? "";
    const key = `${response.checklist}__${response.item}__${subKey}`;
    responseByKey[key] = {
      score: response.score,
      remarks: response.remarks ?? "",
      images: images ?? [],
    };
  });

  if (!questionnaireData?.items) return { answers, remarks, existingImages };

  questionnaireData.items.forEach((category) => {
    category.items?.forEach((item, itemIdx) => {
      item.sub_items?.forEach((subItem, subIdx) => {
        const editKey = `${category.name}__${item.name}__${itemIdx}__${subIdx}`;
        const lookupKey = `${category.name}__${item.name}__${subItem.name}`;
        const found = responseByKey[lookupKey];
        if (found) {
          answers[editKey] = found.score;
          remarks[editKey] = found.remarks;
          if (found.images && found.images.length > 0) {
            existingImages[editKey] = found.images;
          }
        }
      });
    });
  });

  return { answers, remarks, existingImages };
};

const COBSStartCheckingDialog = ({
  open,
  onClose,
  onSuccess,
  unitName,
  week,
  month,
  year,
  checklistId = 1,
  unitId,
  approverId,
  viewMode = false,
  continueMode = false,
  batchEntry = null,
}) => {
  const [answers, setAnswers] = useState({});
  const [remarks, setRemarks] = useState({});
  const [images, setImages] = useState({});
  const [existingImages, setExistingImages] = useState({});
  const [temporalAudit, setTemporalAudit] = useState("");
  const [goodPoints, setGoodPoints] = useState("");
  const [othersRemarks, setOthersRemarks] = useState("");
  const [startAt, setStartAt] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dateError, setDateError] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });

  const fileInputRefs = useRef({});
  const intervalRef = useRef(null);

  const { data, isFetching } = useGetQuestionnaireQuery(checklistId, {
    skip: !open,
  });
  const [createCob, { isLoading }] = useCreateCobMutation();

  const questionnaireData = data?.data;
  const responseMap = viewMode ? buildResponseMap(batchEntry?.responses) : {};

  useEffect(() => {
    if (viewMode) return;
    if (!open) {
      clearInterval(intervalRef.current);
      return;
    }

    setStartTime(getNow());
    setEndTime(getNow());
    intervalRef.current = setInterval(() => {
      setEndTime(getNow());
    }, 1000);

    if (continueMode && batchEntry) {
      const rawDate = batchEntry.start_at
        ? batchEntry.start_at.split(" ")[0]
        : "";
      setStartAt(rawDate);
      setTemporalAudit(batchEntry.temporal_audit ?? "");
      setGoodPoints(batchEntry.good_points ?? "");
      setOthersRemarks(batchEntry.remarks ?? "");
      setDateError(false);
    } else {
      setStartAt("");
      setDateError(false);
      setTemporalAudit("");
      setGoodPoints("");
      setOthersRemarks("");
    }

    return () => clearInterval(intervalRef.current);
  }, [open, viewMode, continueMode, batchEntry]);

  useEffect(() => {
    if (!open || viewMode) return;
    if (continueMode && batchEntry && questionnaireData) {
      const {
        answers: draftAnswers,
        remarks: draftRemarks,
        existingImages: draftImages,
      } = buildDraftAnswers(questionnaireData, batchEntry.responses ?? []);
      setAnswers(draftAnswers);
      setRemarks(draftRemarks);
      setExistingImages(draftImages);
      setImages({});
    } else if (!continueMode) {
      setAnswers({});
      setRemarks({});
      setImages({});
      setExistingImages({});
    }
  }, [open, continueMode, batchEntry, questionnaireData, viewMode]);

  const getKey = (categoryName, itemName, itemIndex, subItemIndex) =>
    `${categoryName}__${itemName}__${itemIndex}__${subItemIndex}`;

  const getViewKey = (categoryName, itemName, subItemName) =>
    `${categoryName}__${itemName}__${subItemName}`;

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

  const handleRemoveExistingImage = (key, idx) =>
    setExistingImages((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));

  const openPreview = (imgs, idx) =>
    setPreviewState({ open: true, images: imgs, index: idx });

  const closePreview = () => setPreviewState((p) => ({ ...p, open: false }));

  const buildFormData = (isCompleted) => {
    const formData = new FormData();
    formData.append("checklist_id", checklistId);
    formData.append("unit_id", unitId ?? "");
    formData.append("approver_id", approverId ?? "");
    formData.append("is_completed", isCompleted);
    formData.append("good_points", goodPoints);
    formData.append("temporal_audit", temporalAudit);
    formData.append("remarks", othersRemarks);
    formData.append("start_at", startAt);

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
    if (!startAt) {
      setDateError(true);
      return;
    }
    setDateError(false);
    try {
      await createCob(buildFormData(isCompleted)).unwrap();
      setSnackbar({
        open: true,
        message: isCompleted ? "Submitted successfully!" : "Saved as draft!",
        severity: "success",
      });
      onSuccess?.();
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
    if (!viewMode) {
      setAnswers({});
      setRemarks({});
      setImages({});
      setExistingImages({});
      setTemporalAudit("");
      setGoodPoints("");
      setOthersRemarks("");
      setStartAt("");
      setDateError(false);
      setStartTime("");
      setEndTime("");
      clearInterval(intervalRef.current);
    }
    onClose();
  };

  const getDialogTitle = () => {
    if (viewMode) return "View Checklist";
    if (continueMode) return "Continue Checking";
    return "Start Checking";
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (!viewMode && reason === "backdropClick") return;
          handleClose();
        }}
        disableEscapeKeyDown={!viewMode}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "cobs-sc__paper" }}>
        <div className="cobs-sc__header">
          <div className="cobs-sc__header-title">
            <ChecklistIcon className="cobs-sc__header-icon" />
            <span>{getDialogTitle()}</span>
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

        {viewMode && batchEntry && !isFetching && (
          <div className="cobs-sc__info-strip">
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Submitted by</span>
              <span className="cobs-sc__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Approver</span>
              <span className="cobs-sc__info-value">
                {batchEntry.approver ?? "—"}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Start</span>
              <span className="cobs-sc__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">End</span>
              <span className="cobs-sc__info-value">
                {formatDateTime(batchEntry.end_at)}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Progress</span>
              <span className="cobs-sc__info-value cobs-sc__info-value--accent">
                {batchEntry.progress ?? "—"}
              </span>
            </div>
          </div>
        )}

        {continueMode && batchEntry && !isFetching && (
          <div className="cobs-sc__info-strip cobs-sc__info-strip--draft">
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Draft by</span>
              <span className="cobs-sc__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Started</span>
              <span className="cobs-sc__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Progress</span>
              <span className="cobs-sc__info-value cobs-sc__info-value--accent">
                {batchEntry.progress ?? "—"}
              </span>
            </div>
          </div>
        )}

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
                            const editKey = getKey(
                              category.name,
                              item.name,
                              itemIdx,
                              subIdx,
                            );
                            const viewKey = getViewKey(
                              category.name,
                              item.name,
                              subItem.name,
                            );
                            const resp = viewMode ? responseMap[viewKey] : null;
                            const fileList = !viewMode
                              ? (images[editKey] ?? [])
                              : [];
                            const existingFileList = continueMode
                              ? (existingImages[editKey] ?? [])
                              : [];

                            return (
                              <tr key={editKey} className="cobs-sc__tr">
                                <td className="cobs-sc__td cobs-sc__td--item">
                                  {subIdx + 1}. {subItem.name}
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--compliance">
                                  <div className="cobs-sc__radio-box">
                                    {SCORE_OPTIONS.map((score) => (
                                      <label
                                        key={score}
                                        className={`cobs-sc__radio-item${viewMode ? " cobs-sc__radio-item--readonly" : ""}`}>
                                        <input
                                          type="radio"
                                          name={
                                            viewMode
                                              ? `view-${editKey}`
                                              : editKey
                                          }
                                          value={score}
                                          checked={
                                            viewMode
                                              ? resp?.score === score
                                              : answers[editKey] === score
                                          }
                                          onChange={
                                            viewMode
                                              ? undefined
                                              : () =>
                                                  handleScore(editKey, score)
                                          }
                                          readOnly={viewMode}
                                          disabled={viewMode}
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
                                    placeholder={
                                      viewMode ? "—" : "Enter your response"
                                    }
                                    value={
                                      viewMode
                                        ? (resp?.remarks ?? "")
                                        : (remarks[editKey] ?? "")
                                    }
                                    onChange={
                                      viewMode
                                        ? undefined
                                        : (e) =>
                                            handleRemarks(
                                              editKey,
                                              e.target.value,
                                            )
                                    }
                                    readOnly={viewMode}
                                    rows={2}
                                    className={`cobs-sc__textarea${viewMode ? " cobs-sc__textarea--readonly" : ""}`}
                                  />
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--attachment">
                                  {viewMode ? (
                                    resp?.images?.length > 0 ? (
                                      <div className="cobs-sc__attach-file-list">
                                        {resp.images.map((url, i) => {
                                          const filename =
                                            decodeURIComponent(
                                              url
                                                .split("/")
                                                .pop()
                                                .split("?")[0],
                                            ) || `file-${i + 1}`;
                                          return (
                                            <div
                                              key={i}
                                              className="cobs-sc__attach-file-row">
                                              <Tooltip
                                                title={filename}
                                                placement="top">
                                                <span className="cobs-sc__attach-file-name">
                                                  {filename}
                                                </span>
                                              </Tooltip>
                                              <Tooltip
                                                title="View image"
                                                placement="top">
                                                <IconButton
                                                  size="small"
                                                  className="cobs-sc__attach-eye"
                                                  onClick={() =>
                                                    openPreview(resp.images, i)
                                                  }>
                                                  <VisibilityIcon
                                                    sx={{ fontSize: 13 }}
                                                  />
                                                </IconButton>
                                              </Tooltip>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="cobs-sc__no-attach">
                                        —
                                      </span>
                                    )
                                  ) : (
                                    <>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: "none" }}
                                        ref={(el) =>
                                          (fileInputRefs.current[editKey] = el)
                                        }
                                        onChange={(e) =>
                                          handleImageChange(
                                            editKey,
                                            e.target.files,
                                          )
                                        }
                                      />

                                      {existingFileList.length > 0 ||
                                      fileList.length > 0 ? (
                                        <div className="cobs-sc__attach-list">
                                          {existingFileList.map((url, i) => {
                                            const filename =
                                              decodeURIComponent(
                                                url
                                                  .split("/")
                                                  .pop()
                                                  .split("?")[0],
                                              ) || `file-${i + 1}`;
                                            return (
                                              <div
                                                key={`existing-${i}`}
                                                className="cobs-sc__attach-item">
                                                <Tooltip
                                                  title={filename}
                                                  placement="top">
                                                  <span className="cobs-sc__attach-name">
                                                    {filename}
                                                  </span>
                                                </Tooltip>
                                                <Tooltip
                                                  title="Preview"
                                                  placement="top">
                                                  <IconButton
                                                    size="small"
                                                    className="cobs-sc__attach-eye"
                                                    onClick={() =>
                                                      openPreview(
                                                        existingFileList,
                                                        i,
                                                      )
                                                    }>
                                                    <VisibilityIcon
                                                      sx={{ fontSize: 13 }}
                                                    />
                                                  </IconButton>
                                                </Tooltip>
                                                <IconButton
                                                  size="small"
                                                  className="cobs-sc__attach-remove"
                                                  onClick={() =>
                                                    handleRemoveExistingImage(
                                                      editKey,
                                                      i,
                                                    )
                                                  }>
                                                  <DeleteOutlineIcon
                                                    sx={{ fontSize: 13 }}
                                                  />
                                                </IconButton>
                                              </div>
                                            );
                                          })}
                                          {fileList.map((file, i) => (
                                            <div
                                              key={`new-${i}`}
                                              className="cobs-sc__attach-item">
                                              <Tooltip
                                                title={file.name}
                                                placement="top">
                                                <span className="cobs-sc__attach-name">
                                                  {file.name}
                                                </span>
                                              </Tooltip>
                                              <Tooltip
                                                title="Preview"
                                                placement="top">
                                                <IconButton
                                                  size="small"
                                                  className="cobs-sc__attach-eye"
                                                  onClick={() => {
                                                    const urls = (
                                                      images[editKey] ?? []
                                                    ).map((f) =>
                                                      URL.createObjectURL(f),
                                                    );
                                                    openPreview(urls, i);
                                                  }}>
                                                  <VisibilityIcon
                                                    sx={{ fontSize: 13 }}
                                                  />
                                                </IconButton>
                                              </Tooltip>
                                              <IconButton
                                                size="small"
                                                className="cobs-sc__attach-remove"
                                                onClick={() =>
                                                  handleRemoveImage(editKey, i)
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
                                              fileInputRefs.current[
                                                editKey
                                              ]?.click()
                                            }>
                                            <AttachFileIcon
                                              sx={{ fontSize: 13 }}
                                            />
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
                                              fileInputRefs.current[
                                                editKey
                                              ]?.click()
                                            }>
                                            <AttachFileIcon
                                              sx={{ fontSize: 14 }}
                                            />
                                            <span>No file</span>
                                          </button>
                                        </Tooltip>
                                      )}
                                    </>
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
                    <span className="cobs-sc__others-label">
                      Date <span className="cobs-sc__required">*</span>
                    </span>
                    {viewMode ? (
                      <div className="cobs-sc__others-input-box">
                        <span className="cobs-sc__others-time">
                          {batchEntry?.start_at
                            ? formatDateDisplay(
                                batchEntry.start_at.split(" ")[0],
                              )
                            : "—"}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`cobs-sc__date-picker-wrap${dateError ? " cobs-sc__date-picker-wrap--error" : ""}`}>
                          <CalendarTodayIcon className="cobs-sc__date-icon" />
                          <input
                            type="date"
                            className="cobs-sc__date-input"
                            value={startAt}
                            onChange={(e) => {
                              setStartAt(e.target.value);
                              if (e.target.value) setDateError(false);
                            }}
                          />
                          <span className="cobs-sc__date-display">
                            {startAt ? formatDateDisplay(startAt) : ""}
                          </span>
                        </div>
                        {dateError && (
                          <span className="cobs-sc__date-error">
                            Date is required.
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Time</span>
                    <div className="cobs-sc__time-row">
                      <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                        <span className="cobs-sc__time-block-label">Start</span>
                        <span className="cobs-sc__time-block-value">
                          {viewMode
                            ? formatDateTime(batchEntry?.start_at)
                            : startTime || "—"}
                        </span>
                      </div>
                      <div className="cobs-sc__time-divider">—</div>
                      <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                        <span className="cobs-sc__time-block-label">End</span>
                        <span className="cobs-sc__time-block-value">
                          {viewMode
                            ? formatDateTime(batchEntry?.end_at)
                            : endTime || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">
                      Temporal Audit
                    </span>
                    <div className="cobs-sc__others-input-box">
                      <div className="cobs-sc__temporal-options">
                        {TEMPORAL_AUDIT_OPTIONS.map((opt) => (
                          <label
                            key={opt}
                            className={`cobs-sc__temporal-item${viewMode ? " cobs-sc__temporal-item--readonly" : ""}`}>
                            <input
                              type="radio"
                              name={
                                viewMode
                                  ? "view_temporal_audit"
                                  : "temporal_audit"
                              }
                              value={opt}
                              checked={
                                viewMode
                                  ? (batchEntry?.temporal_audit ?? "") === opt
                                  : temporalAudit === opt
                              }
                              onChange={
                                viewMode
                                  ? undefined
                                  : () => setTemporalAudit(opt)
                              }
                              readOnly={viewMode}
                              disabled={viewMode}
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
                      className={`cobs-sc__others-textarea${viewMode ? " cobs-sc__others-textarea--readonly" : ""}`}
                      placeholder={
                        viewMode ? "—" : "Enter good points observed"
                      }
                      value={
                        viewMode ? (batchEntry?.good_points ?? "") : goodPoints
                      }
                      onChange={
                        viewMode
                          ? undefined
                          : (e) => setGoodPoints(e.target.value)
                      }
                      readOnly={viewMode}
                      rows={4}
                    />
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Remarks</span>
                    <textarea
                      className={`cobs-sc__others-textarea${viewMode ? " cobs-sc__others-textarea--readonly" : ""}`}
                      placeholder={viewMode ? "—" : "Enter remarks"}
                      value={
                        viewMode
                          ? (batchEntry?.other_remarks ?? "")
                          : othersRemarks
                      }
                      onChange={
                        viewMode
                          ? undefined
                          : (e) => setOthersRemarks(e.target.value)
                      }
                      readOnly={viewMode}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions className="cobs-sc__footer">
          {viewMode ? (
            <Button
              variant="text"
              onClick={handleClose}
              className="cobs-sc__btn-close">
              CLOSE
            </Button>
          ) : (
            <>
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
            </>
          )}
        </DialogActions>
      </Dialog>

      <COBSImagePreviewDialog
        open={previewState.open}
        onClose={closePreview}
        images={previewState.images}
        initialIndex={previewState.index}
      />

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
