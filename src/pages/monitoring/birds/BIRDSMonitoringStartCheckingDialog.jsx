import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { useGetBirdsQuestionnaireTemplateQuery } from "../../../features/api/birds/birdsApi";
import "../../birds/BirdsStartCheckingDialog.scss"; // reuse BirdsStartCheckingDialog.scss class names (birds-sc__*) — adjust path as needed

const getLevelColorClass = (levelName) => {
  if (!levelName) return "";
  const lower = levelName.toLowerCase();
  if (lower === "low") return "birds-sc__radio-box--low";
  if (lower === "average") return "birds-sc__radio-box--average";
  if (lower === "moderate") return "birds-sc__radio-box--moderate";
  return "";
};

const skeletonSx = {
  bgcolor: "rgba(230, 100, 20, 0.10)",
  borderRadius: "6px",
  "&::after": {
    background:
      "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.07), transparent)",
  },
};

// Monitoring/view-only counterpart of BirdsStartCheckingDialog — always
// read-only (no start/continue/draft/submit, no wastage dropdown, no
// validation). Renders the filled-in bird inspection grid for a batch entry.
const BIRDSMonitoringStartCheckingDialog = ({
  open,
  onClose,
  unitName,
  period,
  month,
  year,
  checklistId,
  batchEntry = null,
}) => {
  const { data, isFetching } = useGetBirdsQuestionnaireTemplateQuery(
    checklistId,
    { skip: !open || !checklistId },
  );

  const questionnaireData = data?.data;
  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];
  const infestationLevelItems =
    questionnaireData?.items?.find((s) => s.name === "Infestation Level")
      ?.items ?? [];

  const getViewInfestation = (areaName) => {
    if (!batchEntry?.responses) return null;
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName)
        return raw?.infestation_level ?? null;
    }
    return null;
  };

  const getViewTreatment = (areaName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) return raw?.treatment_dose ?? "";
    }
    return "";
  };

  const getViewEntryPoints = (areaName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) return raw?.entry_points ?? "";
    }
    return "";
  };

  const getViewWastage = (areaName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) {
        const wastage = raw?.wastage ?? [];
        if (wastage.length === 0) return "";
        const first = wastage[0];
        return typeof first === "string" ? first : (first?.name ?? "");
      }
    }
    return "";
  };

  const renderSkeleton = () => (
    <div className="birds-sc__skeleton-wrap">
      <div className="birds-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="40%"
          sx={skeletonSx}
        />
        <div className="birds-sc__skeleton-table">
          <div className="birds-sc__skeleton-header-row">
            <Skeleton
              variant="rectangular"
              height={28}
              sx={{ ...skeletonSx, flex: 2 }}
            />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={28}
                sx={{ ...skeletonSx, flex: 1 }}
              />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} className="birds-sc__skeleton-row">
              <Skeleton
                variant="rectangular"
                height={36}
                sx={{ ...skeletonSx, flex: 2 }}
              />
              {Array.from({ length: 5 }).map((_, colIdx) => (
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
      <div className="birds-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="20%"
          sx={skeletonSx}
        />
        <div className="birds-sc__skeleton-others-row">
          <Skeleton
            variant="rectangular"
            height={54}
            sx={{ ...skeletonSx, flex: 1 }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "birds-sc__paper" }}>
      <div className="birds-sc__header">
        <div className="birds-sc__header-title">
          <ChecklistIcon className="birds-sc__header-icon" />
          <span>View Checklist</span>
        </div>
        <span className="birds-sc__name-value">
          {unitName} — {period} ({month}/{year})
        </span>
        <IconButton size="small" className="birds-sc__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="birds-sc__content">
        {isFetching ? (
          renderSkeleton()
        ) : (
          <>
            <div className="birds-sc__section">
              <div className="birds-sc__section-header">Bird Inspection</div>
              <div className="birds-sc__table-scroll">
                <table className="birds-sc__grid-table">
                  <thead>
                    <tr className="birds-sc__thead-row">
                      <th className="birds-sc__th birds-sc__th--area">
                        Inspection Areas
                      </th>
                      <th
                        className="birds-sc__th birds-sc__th--group"
                        colSpan={infestationLevelItems.length}>
                        Infestation Level
                      </th>
                      <th className="birds-sc__th birds-sc__th--group">
                        Treatment / Action Dose
                      </th>
                      <th className="birds-sc__th birds-sc__th--group">
                        Presence of Feed/RM Wastage
                      </th>
                      <th className="birds-sc__th birds-sc__th--group">
                        Identify Entry Points
                      </th>
                    </tr>
                    <tr className="birds-sc__thead-row birds-sc__thead-row--sub">
                      <th className="birds-sc__th birds-sc__th--area-placeholder" />
                      {infestationLevelItems.map((lvl) => (
                        <th
                          key={lvl.name}
                          className="birds-sc__th birds-sc__th--col">
                          <div className="birds-sc__col-head">
                            <span>{lvl.name}</span>
                          </div>
                        </th>
                      ))}
                      <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                      <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                      <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionAreas.map((area) => {
                      const currentInfestation = getViewInfestation(area.name);
                      const currentTreatment = getViewTreatment(area.name);
                      const currentEntry = getViewEntryPoints(area.name);
                      const currentWastage = getViewWastage(area.name);

                      return (
                        <tr key={area.name} className="birds-sc__tr">
                          <td className="birds-sc__td birds-sc__td--area-name">
                            {area.name}
                          </td>
                          {infestationLevelItems.map((lvl) => {
                            const checked = currentInfestation === lvl.name;
                            const colorClass = getLevelColorClass(lvl.name);
                            return (
                              <td
                                key={lvl.name}
                                className="birds-sc__td birds-sc__td--radio">
                                <label className="birds-sc__radio-label birds-sc__radio-label--readonly">
                                  <input
                                    type="radio"
                                    name={`view-infestation__${area.name}`}
                                    checked={checked}
                                    readOnly
                                    disabled
                                    className="birds-sc__radio-input"
                                  />
                                  <span
                                    className={`birds-sc__radio-box ${checked ? colorClass : ""}`}
                                  />
                                </label>
                              </td>
                            );
                          })}
                          <td className="birds-sc__td birds-sc__td--text">
                            <span className="birds-sc__text-display">
                              {currentTreatment || "—"}
                            </span>
                          </td>
                          <td className="birds-sc__td birds-sc__td--text">
                            <span className="birds-sc__text-display">
                              {currentWastage || "—"}
                            </span>
                          </td>
                          <td className="birds-sc__td birds-sc__td--text">
                            <span className="birds-sc__text-display">
                              {currentEntry || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="birds-sc__section birds-sc__section--others">
              <div className="birds-sc__section-header">Others</div>
              <div className="birds-sc__others-body">
                <div className="birds-sc__others-field">
                  <label className="birds-sc__others-label">Date</label>
                  <span className="birds-sc__text-display">
                    {batchEntry?.start_at
                      ? new Date(batchEntry.start_at).toLocaleDateString(
                          "en-PH",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </span>
                </div>

                <div className="birds-sc__others-field birds-sc__others-field--remarks">
                  <label className="birds-sc__others-label">Remarks</label>
                  <span className="birds-sc__text-display">
                    {batchEntry?.remarks || "—"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      <DialogActions className="birds-sc__footer">
        <Button
          variant="text"
          onClick={onClose}
          className="birds-sc__btn-close">
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BIRDSMonitoringStartCheckingDialog;
