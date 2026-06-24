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
import "./PestAcknowledgementTimelineDialog.scss";

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

  const { user, approver, start_at, end_at, is_approved, signatory_2 } =
    batchEntry;

  const submittedStep = {
    key: "submitted",
    label: "Submitted",
    roleLabel: "Requestor",
    name: user ?? "—",
    timestamp: start_at,
    done: true,
  };

  const ackStep = {
    key: "acknowledge",
    label: "Acknowledge",
    roleLabel: "Acknowledger",
    name: signatory_2?.name ?? approver ?? null,
    timestamp: signatory_2 ? end_at : null,
    done: !!is_approved,
  };

  return [submittedStep, ackStep];
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

const PestAcknowledgementTimelineDialog = ({
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
      PaperProps={{ className: "pest-tl__paper" }}>
      <div className="pest-tl__header">
        <div className="pest-tl__header-title">
          <span className="pest-tl__header-bar" />
          <TimelineIcon className="pest-tl__header-icon" />
          <span>ACKNOWLEDGE TIMELINE</span>
        </div>
        <IconButton size="small" className="pest-tl__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="pest-tl__info-row">
        <div className="pest-tl__info-item">
          <span className="pest-tl__info-label">Checklist</span>
          <span className="pest-tl__info-value">
            {batchEntry?.checklist_name ?? "—"}
          </span>
        </div>
        <div className="pest-tl__info-item">
          <span className="pest-tl__info-label">Period</span>
          <span className="pest-tl__info-value">{period ?? "—"}</span>
        </div>
      </div>

      <DialogContent className="pest-tl__content">
        {isFetching ? (
          <div className="pest-tl__skeleton-wrap">
            {Array.from({ length: 2 }).map((_, i) => (
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
          <div className="pest-tl__empty">
            <InboxIcon sx={{ fontSize: 32, opacity: 0.4 }} />
            <span>No activity logs available yet.</span>
          </div>
        ) : (
          <div className="pest-tl__steps">
            {steps.map((step, idx) => {
              const status = getStepStatus(step, steps, idx);
              const isLast = idx === steps.length - 1;
              const dateLabel = formatDateTime(step.timestamp);

              return (
                <div key={step.key} className="pest-tl__step">
                  <div className="pest-tl__step-rail">
                    <div
                      className={`pest-tl__step-icon pest-tl__step-icon--${status}`}>
                      <StepIcon
                        status={status}
                        isSubmitted={step.key === "submitted"}
                      />
                    </div>
                    {!isLast && (
                      <div
                        className={`pest-tl__step-line pest-tl__step-line--${status}`}
                      />
                    )}
                  </div>

                  <div className="pest-tl__card">
                    <div className="pest-tl__card-left">
                      <span
                        className={`pest-tl__card-status pest-tl__card-status--${status}`}>
                        {status === "pending"
                          ? step.label.toUpperCase() + " (PENDING)"
                          : step.label.toUpperCase()}
                      </span>
                      {dateLabel && (
                        <span className="pest-tl__card-date">{dateLabel}</span>
                      )}
                    </div>

                    <div className="pest-tl__card-right">
                      <span className="pest-tl__card-name">
                        {step.name ?? "—"}
                      </span>
                      <span className="pest-tl__card-role">
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

export default PestAcknowledgementTimelineDialog;
