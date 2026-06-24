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
import "./COBSAcknowledgementTimelineDialog.scss";

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
    approver,
    assessor,
    start_at,
    end_at,
    is_approved,
    is_assessed,
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
    sigImage: null,
  };

  const firstAckStep = {
    key: "first_ack",
    label: "Acknowledge",
    roleLabel: "Acknowledger",
    name: signatory_2?.name ?? approver ?? null,
    timestamp: signatory_2 ? end_at : null,
    done: !!is_approved,
    sigImage: signatory_2?.approve_image ?? null,
  };

  const lastAckStep = {
    key: "last_ack",
    label: "Acknowledge",
    roleLabel: "Acknowledger",
    name: signatory_3?.name ?? assessor ?? null,
    timestamp: signatory_3 ? end_at : null,
    done: !!is_assessed,
    sigImage: signatory_3?.assess_image ?? null,
  };

  // Chronological order — Submitted first/top, then the acknowledgement
  // stages in the order they actually happen.
  return [submittedStep, firstAckStep, lastAckStep];
};

const getStepStatus = (step, steps, idx) => {
  if (step.done) return "done";
  // The first not-done step right after a done step (or the very first
  // step overall when nothing is done yet) is treated as "pending" —
  // i.e. it's the next action waiting to happen. Array is chronological
  // (oldest/Submitted first), so the "previous" step is at idx - 1.
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
  if (status === "pending") {
    return <HourglassEmptyIcon />;
  }
  return <SendIcon sx={{ fontSize: "14px !important" }} />;
};

const COBSAcknowledgementTimelineDialog = ({
  open,
  onClose,
  batchEntry,
  week,
  isFetching = false,
}) => {
  const steps = buildSteps(batchEntry);

  const handlePreviewSig = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "cobs-tl__paper" }}>
      <div className="cobs-tl__header">
        <div className="cobs-tl__header-title">
          <span className="cobs-tl__header-bar" />
          <TimelineIcon className="cobs-tl__header-icon" />
          <span>ACKNOWLEDGE TIMELINE</span>
        </div>
        <IconButton size="small" className="cobs-tl__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="cobs-tl__info-row">
        <div className="cobs-tl__info-item">
          <span className="cobs-tl__info-label">Unit</span>
          <span className="cobs-tl__info-value">{batchEntry?.unit ?? "—"}</span>
        </div>
        <div className="cobs-tl__info-item">
          <span className="cobs-tl__info-label">Checklist</span>
          <span className="cobs-tl__info-value">
            {batchEntry?.checklist_name ?? "—"}
          </span>
        </div>
        <div className="cobs-tl__info-item">
          <span className="cobs-tl__info-label">Week</span>
          <span className="cobs-tl__info-value">
            {week ?? (batchEntry?.week ? `Week ${batchEntry.week}` : "—")}
          </span>
        </div>
      </div>

      <DialogContent className="cobs-tl__content">
        {isFetching ? (
          <div className="cobs-tl__skeleton-wrap">
            {Array.from({ length: 3 }).map((_, i) => (
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
          <div className="cobs-tl__empty">
            <InboxIcon sx={{ fontSize: 32, opacity: 0.4 }} />
            <span>No activity logs available yet.</span>
          </div>
        ) : (
          <div className="cobs-tl__steps">
            {steps.map((step, idx) => {
              const status = getStepStatus(step, steps, idx);
              const isLast = idx === steps.length - 1;
              const dateLabel = formatDateTime(step.timestamp);

              return (
                <div key={step.key} className="cobs-tl__step">
                  <div className="cobs-tl__step-rail">
                    <div
                      className={`cobs-tl__step-icon cobs-tl__step-icon--${status}`}>
                      <StepIcon
                        status={status}
                        isSubmitted={step.key === "submitted"}
                      />
                    </div>
                    {!isLast && (
                      <div
                        className={`cobs-tl__step-line cobs-tl__step-line--${status}`}
                      />
                    )}
                  </div>

                  <div className="cobs-tl__card">
                    <div className="cobs-tl__card-left">
                      <span
                        className={`cobs-tl__card-status cobs-tl__card-status--${status}`}>
                        {status === "pending"
                          ? step.label.toUpperCase() + " (PENDING)"
                          : step.label.toUpperCase()}
                      </span>
                      {dateLabel && (
                        <span className="cobs-tl__card-date">{dateLabel}</span>
                      )}
                    </div>

                    <div className="cobs-tl__card-right">
                      <span className="cobs-tl__card-name">
                        {step.name ?? "—"}
                      </span>
                      <span className="cobs-tl__card-role">
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

export default COBSAcknowledgementTimelineDialog;
