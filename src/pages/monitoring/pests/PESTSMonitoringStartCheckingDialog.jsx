import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { useGetPestQuestionnaireQuery } from "../../../features/api/pests/pestApi";
import "../../pest/PestStartCheckingDialog.scss"; // reuse PestStartCheckingDialog.scss class names (pest-sc__*) — adjust path as needed

const PEST_CHECKLIST_ID = 6;

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

const formatDateOnly = (raw) => {
  if (!raw) return "—";
  const date = new Date(raw);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getGrade = (percent) => {
  if (percent <= 30) return { label: "Low", color: "#7bc67e" };
  if (percent <= 60) return { label: "Moderate", color: "#4db6ac" };
  return { label: "Critical", color: "#1a237e" };
};

const skeletonSx = {
  bgcolor: "rgba(230, 100, 20, 0.10)",
  borderRadius: "6px",
  "&::after": {
    background:
      "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.07), transparent)",
  },
};

// Monitoring/view-only counterpart of PestStartCheckingDialog — always
// read-only (no start/continue/draft/submit, no validation). Renders the
// filled-in pest inspection grid + grading summary for a given batch entry.
const PESTSMonitoringStartCheckingDialog = ({
  open,
  onClose,
  unitName,
  period,
  month,
  year,
  checklistId = PEST_CHECKLIST_ID,
  batchEntry = null,
}) => {
  const { data, isFetching } = useGetPestQuestionnaireQuery(checklistId, {
    skip: !open,
  });

  const questionnaireData = data?.data;
  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];
  const pests =
    questionnaireData?.items?.find((s) => s.name === "Pest")?.items ?? [];
  const otherObsItems =
    questionnaireData?.items?.find((s) => s.name === "Other Observation")
      ?.items ?? [];

  const getMaxPossibleScorePerPest = () => inspectionAreas.length * 10;

  const getBarPercent = (totalScore) => {
    const max = getMaxPossibleScorePerPest();
    if (max === 0) return 0;
    return Math.min(Math.round((totalScore / max) * 100), 100);
  };

  const getViewPestTotalScore = (pestName) => {
    if (!batchEntry?.responses) return 0;
    return batchEntry.responses.reduce((sum, r) => {
      const raw = r?.response ?? r;
      const pestList = raw?.pests ?? [];
      const found = pestList.find((p) =>
        typeof p === "string" ? p === pestName : p.name === pestName,
      );
      if (found && typeof found === "object") {
        return sum + Number(found.score ?? 0);
      }
      return sum;
    }, 0);
  };

  const getViewGridValue = (areaName, pestName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) {
        const pestList = raw?.pests ?? [];
        const found = pestList.find((p) =>
          typeof p === "string" ? p === pestName : p.name === pestName,
        );
        if (found != null) {
          return typeof found === "object" ? String(found.score ?? "") : "";
        }
      }
    }
    return "";
  };

  const getViewObsValue = (areaName, itemName) => {
    if (!batchEntry?.responses) return null;
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) {
        const obs = raw?.other_obervation ?? raw?.other_observations ?? {};
        if (Array.isArray(obs)) {
          const found = obs.find((o) => o.name === itemName);
          if (found) return found.score;
        } else {
          return obs[itemName] ?? null;
        }
      }
    }
    return null;
  };

  const graphPests = pests.map((pest) => ({
    name: pest.name,
    total: getViewPestTotalScore(pest.name),
  }));

  const renderSkeleton = () => (
    <div className="pest-sc__skeleton-wrap">
      <div className="pest-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="40%"
          sx={skeletonSx}
        />
        <div className="pest-sc__skeleton-table">
          <div className="pest-sc__skeleton-header-row">
            <Skeleton
              variant="rectangular"
              height={28}
              sx={{ ...skeletonSx, flex: 2 }}
            />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={28}
                sx={{ ...skeletonSx, flex: 1 }}
              />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} className="pest-sc__skeleton-row">
              <Skeleton
                variant="rectangular"
                height={36}
                sx={{ ...skeletonSx, flex: 2 }}
              />
              {Array.from({ length: 6 }).map((_, colIdx) => (
                <Skeleton
                  key={colIdx}
                  variant="rectangular"
                  height={36}
                  sx={{ ...skeletonSx, flex: 1 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pest-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="35%"
          sx={skeletonSx}
        />
        <div className="pest-sc__skeleton-graph">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pest-sc__skeleton-graph-row">
              <Skeleton
                variant="rectangular"
                height={20}
                width={140}
                sx={skeletonSx}
              />
              <Skeleton
                variant="rectangular"
                height={20}
                sx={{ ...skeletonSx, flex: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={20}
                width={40}
                sx={skeletonSx}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="pest-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="20%"
          sx={skeletonSx}
        />
        <Skeleton variant="rectangular" height={90} sx={skeletonSx} />
        <Skeleton variant="rectangular" height={90} sx={skeletonSx} />
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "pest-sc__paper" }}>
      <div className="pest-sc__header">
        <div className="pest-sc__header-title">
          <ChecklistIcon className="pest-sc__header-icon" />
          <span>View Checklist</span>
        </div>
        <span className="pest-sc__name-value">
          {unitName} — {period} ({month}/{year})
        </span>
        <IconButton size="small" className="pest-sc__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {batchEntry && !isFetching && (
        <div className="pest-sc__info-strip">
          <div className="pest-sc__info-item">
            <span className="pest-sc__info-label">Date</span>
            <span className="pest-sc__info-value">
              {formatDateOnly(batchEntry.date)}
            </span>
          </div>
          <div className="pest-sc__info-item">
            <span className="pest-sc__info-label">Submitted by</span>
            <span className="pest-sc__info-value">
              {batchEntry.user ?? "—"}
            </span>
          </div>
          <div className="pest-sc__info-item">
            <span className="pest-sc__info-label">Approver</span>
            <span className="pest-sc__info-value">
              {batchEntry.approver ?? "—"}
            </span>
          </div>
          <div className="pest-sc__info-item">
            <span className="pest-sc__info-label">Start</span>
            <span className="pest-sc__info-value">
              {formatDateTime(batchEntry.start_at)}
            </span>
          </div>
          <div className="pest-sc__info-item">
            <span className="pest-sc__info-label">End</span>
            <span className="pest-sc__info-value">
              {formatDateTime(batchEntry.end_at)}
            </span>
          </div>
        </div>
      )}

      <DialogContent className="pest-sc__content">
        {isFetching ? (
          renderSkeleton()
        ) : (
          <>
            <div className="pest-sc__section">
              <div className="pest-sc__section-header">Pest Inspection</div>
              <div className="pest-sc__table-scroll">
                <table className="pest-sc__grid-table">
                  <thead>
                    <tr className="pest-sc__thead-row">
                      <th className="pest-sc__th pest-sc__th--area" rowSpan={2}>
                        Inspection Areas
                      </th>
                      <th
                        className="pest-sc__th pest-sc__th--group pest-sc__th--divider"
                        colSpan={pests.length}>
                        Pest
                      </th>
                      <th
                        className="pest-sc__th pest-sc__th--group"
                        colSpan={otherObsItems.reduce(
                          (acc, item) => acc + (item.sub_items?.length ?? 0),
                          0,
                        )}>
                        Other Observation
                      </th>
                    </tr>
                    <tr className="pest-sc__thead-row pest-sc__thead-row--sub">
                      {pests.map((pest, idx) => {
                        const isLastPest = idx === pests.length - 1;
                        return (
                          <th
                            key={pest.name}
                            className={`pest-sc__th pest-sc__th--col${isLastPest ? " pest-sc__th--divider" : ""}`}>
                            {pest.name}
                          </th>
                        );
                      })}
                      {otherObsItems.map((item, itemIdx) =>
                        item.sub_items?.map((sub, subIdx) => {
                          const isLastSub =
                            subIdx === item.sub_items.length - 1;
                          const isLastItem =
                            itemIdx === otherObsItems.length - 1;
                          const addDivider = isLastSub && !isLastItem;
                          return (
                            <th
                              key={`${item.name}__${sub.name}`}
                              className={`pest-sc__th pest-sc__th--col pest-sc__th--obs-sub${addDivider ? " pest-sc__th--divider" : ""}`}>
                              <div className="pest-sc__th-obs-group">
                                {item.name}
                              </div>
                              <div className="pest-sc__th-obs-sub">
                                {sub.name}
                              </div>
                            </th>
                          );
                        }),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionAreas.map((area) => (
                      <tr key={area.name} className="pest-sc__tr">
                        <td className="pest-sc__td pest-sc__td--area-name">
                          {area.name}
                        </td>
                        {pests.map((pest, idx) => {
                          const val = getViewGridValue(area.name, pest.name);
                          const isLastPest = idx === pests.length - 1;
                          return (
                            <td
                              key={pest.name}
                              className={`pest-sc__td pest-sc__td--input${isLastPest ? " pest-sc__td--divider" : ""}`}>
                              <span className="pest-sc__score-display">
                                {val !== "" ? val : "—"}
                              </span>
                            </td>
                          );
                        })}
                        {otherObsItems.map((item, itemIdx) =>
                          item.sub_items?.map((sub, subIdx) => {
                            const currentVal = getViewObsValue(
                              area.name,
                              item.name,
                            );
                            const checked = currentVal === sub.name;
                            const isLastSub =
                              subIdx === item.sub_items.length - 1;
                            const isLastItem =
                              itemIdx === otherObsItems.length - 1;
                            const addDivider = isLastSub && !isLastItem;
                            return (
                              <td
                                key={`${item.name}__${sub.name}`}
                                className={`pest-sc__td pest-sc__td--checkbox${addDivider ? " pest-sc__td--divider" : ""}`}>
                                <label className="pest-sc__checkbox-label pest-sc__checkbox-label--readonly">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    readOnly
                                    disabled
                                    className="pest-sc__checkbox-input"
                                  />
                                  <span className="pest-sc__checkbox-box" />
                                </label>
                              </td>
                            );
                          }),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pest-sc__section">
              <div className="pest-sc__section-header">Grading Summary</div>
              <div className="pest-sc__graph-body">
                {graphPests.map(({ name, total }) => {
                  const percent = getBarPercent(total);
                  const grade = getGrade(percent);
                  return (
                    <div key={name} className="pest-sc__graph-row">
                      <span className="pest-sc__graph-label">{name}</span>
                      <div className="pest-sc__graph-bar-track">
                        <div
                          className="pest-sc__graph-bar-fill"
                          style={{
                            width: `${percent}%`,
                            background: grade.color,
                          }}
                        />
                      </div>
                      <span className="pest-sc__graph-percent">{percent}%</span>
                    </div>
                  );
                })}
                <div className="pest-sc__graph-legend">
                  <span className="pest-sc__legend-item">
                    <span
                      className="pest-sc__legend-dot"
                      style={{ background: "#7bc67e" }}
                    />
                    Low (0–30%)
                  </span>
                  <span className="pest-sc__legend-item">
                    <span
                      className="pest-sc__legend-dot"
                      style={{ background: "#4db6ac" }}
                    />
                    Moderate (31–60%)
                  </span>
                  <span className="pest-sc__legend-item">
                    <span
                      className="pest-sc__legend-dot"
                      style={{ background: "#1a237e" }}
                    />
                    Critical (61%+)
                  </span>
                </div>
              </div>
            </div>

            <div className="pest-sc__section">
              <div className="pest-sc__section-header">Others</div>
              <div className="pest-sc__others-body">
                <div className="pest-sc__others-row">
                  <div className="pest-sc__others-field pest-sc__others-field--date">
                    <span className="pest-sc__others-label">Date</span>
                    <div className="pest-sc__date-display">
                      {formatDateOnly(batchEntry?.date)}
                    </div>
                  </div>
                </div>

                <div className="pest-sc__others-field">
                  <span className="pest-sc__others-label">
                    Remarks for Observation
                  </span>
                  <div className="pest-sc__others-textarea-wrap">
                    <textarea
                      className="pest-sc__others-textarea"
                      placeholder="—"
                      value={batchEntry?.remarks ?? ""}
                      readOnly
                      disabled
                      rows={4}
                    />
                  </div>
                </div>

                <div className="pest-sc__others-field">
                  <span className="pest-sc__others-label">Notes</span>
                  <div className="pest-sc__others-textarea-wrap">
                    <textarea
                      className="pest-sc__others-textarea"
                      placeholder="—"
                      value={batchEntry?.notes ?? ""}
                      readOnly
                      disabled
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      <DialogActions className="pest-sc__footer">
        <Button variant="text" onClick={onClose} className="pest-sc__btn-close">
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PESTSMonitoringStartCheckingDialog;
