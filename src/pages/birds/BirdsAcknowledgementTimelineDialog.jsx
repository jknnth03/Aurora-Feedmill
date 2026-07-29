import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import TimelineIcon from "@mui/icons-material/Timeline";
import CheckIcon from "@mui/icons-material/Check";
import SendIcon from "@mui/icons-material/Send";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import InboxIcon from "@mui/icons-material/Inbox";
import "./BirdsAcknowledgementTimelineDialog.scss";

const formatDateTime = (raw) => {
  if (!raw) return null;
  const date = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (isNaN(date)) return null;
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const buildSteps = (batchEntry) => {
  if (!batchEntry) return [];

  const {
    user,
    evaluator,
    approver,
    assessor,
    start_at,
    end_at,
    is_evaluated,
    is_approved,
    is_assessed,
    signatory_1,
    signatory_2,
    signatory_3,
  } = batchEntry;

  const submittedStep = {
    key: "submitted",
    label: "Submitted",
    roleLabel: "Requestor",
    name: user ?? "—",
    timestamp: start_at,
    done: true,
  };

  const evaluatedStep = {
    key: "evaluated",
    label: "Evaluate",
    roleLabel: "Evaluator",
    name: signatory_1?.name ?? evaluator ?? null,
    timestamp: signatory_1 ? end_at : null,
    done: !!is_evaluated,
  };

  const approvedStep = {
    key: "approved",
    label: "Approve",
    roleLabel: "Approver",
    name: signatory_2?.name ?? approver ?? null,
    timestamp: signatory_2 ? end_at : null,
    done: !!is_approved,
  };

  const assessedStep = {
    key: "assessed",
    label: "Assess",
    roleLabel: "Assessor",
    name: signatory_3?.name ?? assessor ?? null,
    timestamp: signatory_3 ? end_at : null,
    done: !!is_assessed,
  };

  return [submittedStep, evaluatedStep, approvedStep, assessedStep];
};

const getStepStatus = (step, steps, idx) => {
  if (step.done) return "done";
  const previousStep = steps[idx - 1];
  const isNextInLine = !previousStep || previousStep.done;
  return isNextInLine ? "pending" : "upcoming";
};

const StepIcon = ({ status, isSubmitted }) => {
  if (status === "done") {
    return isSubmitted ? (
      <SendIcon sx={{ fontSize: "14px !important" }} />
    ) : (
      <CheckIcon />
    );
  }
  if (status === "pending") return <HourglassEmptyIcon />;
  return <SendIcon sx={{ fontSize: "14px !important" }} />;
};

const BirdsAcknowledgementTimelineDialog = ({
  open,
  onClose,
  batchEntry,
  period,
  isFetching = false,
}) => {
  const steps = buildSteps(batchEntry);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "birds-tl__paper" }}>
      <div className="birds-tl__header">
        <div className="birds-tl__header-title">
          <span className="birds-tl__header-bar" />
          <TimelineIcon className="birds-tl__header-icon" />
          <span>ACKNOWLEDGE TIMELINE</span>
        </div>
        <IconButton size="small" className="birds-tl__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="birds-tl__info-row">
        <div className="birds-tl__info-item">
          <span className="birds-tl__info-label">Checklist</span>
          <span className="birds-tl__info-value">
            {batchEntry?.checklist_name ?? "—"}
          </span>
        </div>
        <div className="birds-tl__info-item">
          <span className="birds-tl__info-label">Period</span>
          <span className="birds-tl__info-value">{period ?? "—"}</span>
        </div>
      </div>

      <DialogContent className="birds-tl__content">
        {isFetching ? (
          <div className="birds-tl__skeleton-wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={70}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: "rgba(230, 100, 20, 0.1)",
                  "&::after": {
                    background:
                      "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.2), transparent)",
                  },
                }}
              />
            ))}
          </div>
        ) : !batchEntry ? (
          <div className="birds-tl__empty">
            <InboxIcon sx={{ fontSize: 32, opacity: 0.4 }} />
            <span>No activity logs available yet.</span>
          </div>
        ) : (
          <div className="birds-tl__steps">
            {steps.map((step, idx) => {
              const status = getStepStatus(step, steps, idx);
              const isLast = idx === steps.length - 1;
              const dateLabel = formatDateTime(step.timestamp);

              return (
                <div key={step.key} className="birds-tl__step">
                  <div className="birds-tl__step-rail">
                    <div
                      className={`birds-tl__step-icon birds-tl__step-icon--${status}`}>
                      <StepIcon
                        status={status}
                        isSubmitted={step.key === "submitted"}
                      />
                    </div>
                    {!isLast && (
                      <div
                        className={`birds-tl__step-line birds-tl__step-line--${status}`}
                      />
                    )}
                  </div>

                  <div className="birds-tl__card">
                    <div className="birds-tl__card-left">
                      <span
                        className={`birds-tl__card-status birds-tl__card-status--${status}`}>
                        {status === "pending"
                          ? step.label.toUpperCase() + " (PENDING)"
                          : step.label.toUpperCase()}
                      </span>
                      {dateLabel && (
                        <span className="birds-tl__card-date">{dateLabel}</span>
                      )}
                    </div>

                    <div className="birds-tl__card-right">
                      <span className="birds-tl__card-name">
                        {step.name ?? "—"}
                      </span>
                      <span className="birds-tl__card-role">
                        {step.roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BirdsAcknowledgementTimelineDialog;
