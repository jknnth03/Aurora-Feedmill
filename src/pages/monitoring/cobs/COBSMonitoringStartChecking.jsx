import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TimelineIcon from "@mui/icons-material/Timeline";
import { useGetQuestionnaireQuery } from "../../../features/api/cobs/cobsApi";
import COBSImagePreviewDialog from "../../cobs/COBSImagePreviewDialog";
import COBSAcknowledgementTimelineDialog from "../../cobs/COBSAcknowledgementTimelineDialog";
import "../../cobs/COBSSignatureDialog.scss";

const SCORE_OPTIONS = [
  { value: 0, label: "N/A" },
  { value: 50, label: "50" },
  { value: 75, label: "75" },
  { value: 100, label: "100" },
];

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
    if (!response) return;
    const subKey = response.sub_item ?? response.sub_name ?? "";
    const key = `${response.checklist}__${response.item}__${subKey}`;
    map[key] = { ...response, images: images ?? [] };
  });
  return map;
};

// Monitoring/view-only counterpart of COBSStartCheckingDialog — always
// read-only (no start/continue/draft/submit, no camera capture, no
// validation). Renders the filled-in questionnaire for a given batch entry.
const COBSMonitoringStartChecking = ({
  open,
  onClose,
  unitName,
  week,
  month,
  year,
  checklistId = 1,
  batchEntry = null,
}) => {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });

  const { data, isFetching } = useGetQuestionnaireQuery(checklistId, {
    skip: !open,
  });

  const questionnaireData = data?.data;
  const responseMap = buildResponseMap(batchEntry?.responses);

  const openPreview = (imgs, idx) =>
    setPreviewState({ open: true, images: imgs, index: idx });
  const closePreview = () => setPreviewState((p) => ({ ...p, open: false }));

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "cobs-sc__paper" }}>
        <div className="cobs-sc__header">
          <div className="cobs-sc__header-title">
            <ChecklistIcon className="cobs-sc__header-icon" />
            <span>View Checklist</span>
          </div>
          <span className="cobs-sc__name-value">
            {unitName} — {week} ({month}/{year})
          </span>
          <div className="cobs-sc__header-actions">
            {batchEntry && (
              <Tooltip title="View acknowledge timeline" placement="top">
                <IconButton
                  size="small"
                  className="cobs-sc__history"
                  onClick={() => setTimelineOpen(true)}>
                  <TimelineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              className="cobs-sc__close"
              onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </div>

        {batchEntry && !isFetching && (
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
                            Photo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items?.map((item) =>
                          item.sub_items?.map((subItem, subIdx) => {
                            const viewKey = `${category.name}__${item.name}__${subItem.name}`;
                            const resp = responseMap[viewKey];

                            return (
                              <tr key={viewKey} className="cobs-sc__tr">
                                <td className="cobs-sc__td cobs-sc__td--item">
                                  {subIdx + 1}. {subItem.name}
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--compliance">
                                  <div className="cobs-sc__radio-box">
                                    {SCORE_OPTIONS.map(({ value, label }) => (
                                      <label
                                        key={value}
                                        className="cobs-sc__radio-item cobs-sc__radio-item--readonly">
                                        <input
                                          type="radio"
                                          name={`view-${viewKey}`}
                                          value={value}
                                          checked={resp?.score === value}
                                          readOnly
                                          disabled
                                          className="cobs-sc__radio-input"
                                        />
                                        <span
                                          className={`cobs-sc__radio-circle cobs-sc__radio-circle--${value}`}
                                        />
                                        <span className="cobs-sc__radio-text">
                                          {label}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--remarks">
                                  <textarea
                                    placeholder="—"
                                    value={resp?.remarks ?? ""}
                                    readOnly
                                    rows={2}
                                    className="cobs-sc__textarea cobs-sc__textarea--readonly"
                                  />
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--attachment">
                                  {resp?.images?.length > 0 ? (
                                    <div className="cobs-sc__attach-file-list">
                                      {resp.images.map((url, i) => {
                                        const filename =
                                          decodeURIComponent(
                                            url.split("/").pop().split("?")[0],
                                          ) || `photo-${i + 1}`;
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
                                              title="View photo"
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
                    <span className="cobs-sc__others-label">Date</span>
                    <div className="cobs-sc__others-input-box">
                      <span className="cobs-sc__others-time">
                        {batchEntry?.start_at
                          ? formatDateDisplay(batchEntry.start_at.split(" ")[0])
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Time</span>
                    <div className="cobs-sc__time-row">
                      <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                        <span className="cobs-sc__time-block-label">Start</span>
                        <span className="cobs-sc__time-block-value">
                          {formatDateTime(batchEntry?.start_at)}
                        </span>
                      </div>
                      <div className="cobs-sc__time-divider">—</div>
                      <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                        <span className="cobs-sc__time-block-label">End</span>
                        <span className="cobs-sc__time-block-value">
                          {formatDateTime(batchEntry?.end_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">
                      Temporal Audit
                    </span>
                    <div className="cobs-sc__others-input-box">
                      <span className="cobs-sc__others-time">
                        {batchEntry?.temporal_audit ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Good Points</span>
                    <textarea
                      className="cobs-sc__others-textarea cobs-sc__others-textarea--readonly"
                      placeholder="—"
                      value={batchEntry?.good_points ?? ""}
                      readOnly
                      rows={4}
                    />
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Remarks</span>
                    <textarea
                      className="cobs-sc__others-textarea cobs-sc__others-textarea--readonly"
                      placeholder="—"
                      value={batchEntry?.remarks ?? ""}
                      readOnly
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
            onClick={onClose}
            className="cobs-sc__btn-close">
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

      <COBSImagePreviewDialog
        open={previewState.open}
        onClose={closePreview}
        images={previewState.images}
        initialIndex={previewState.index}
      />

      <COBSAcknowledgementTimelineDialog
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        batchEntry={batchEntry}
        week={week}
        isFetching={false}
      />
    </>
  );
};

export default COBSMonitoringStartChecking;
