import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import dayjs from "dayjs";
import { exportBirdsToExcel } from "./exportBirdsToExcel";
import "./BirdsExportDialog.scss";

const BirdsExportDialog = ({ open, onClose, fetchExportData }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setStartDate("");
    setEndDate("");
    setError("");
    onClose();
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }
    if (dayjs(startDate).isAfter(dayjs(endDate))) {
      setError("Start date must be before end date.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await fetchExportData(startDate, endDate);
      await exportBirdsToExcel(data, startDate, endDate);
      handleClose();
    } catch (e) {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "birds-export__paper" }}>
      <div className="birds-export__header">
        <div className="birds-export__header-title">
          <FileDownloadIcon className="birds-export__header-icon" />
          Export Birds Monitoring Report
        </div>
        <IconButton
          className="birds-export__close"
          size="small"
          onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="birds-export__content">
        <div className="birds-export__field">
          <label className="birds-export__label">
            Start Date <span className="birds-export__required">*</span>
          </label>
          <div
            className={`birds-export__input-wrap${!startDate && error ? " birds-export__input-wrap--error" : ""}`}>
            <CalendarTodayIcon className="birds-export__input-icon" />
            <input
              type="date"
              className="birds-export__input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="birds-export__field">
          <label className="birds-export__label">
            End Date <span className="birds-export__required">*</span>
          </label>
          <div
            className={`birds-export__input-wrap${!endDate && error ? " birds-export__input-wrap--error" : ""}`}>
            <CalendarTodayIcon className="birds-export__input-icon" />
            <input
              type="date"
              className="birds-export__input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="birds-export__error">
            <ErrorOutlineIcon className="birds-export__error-icon" />
            {error}
          </div>
        )}
      </div>

      <div className="birds-export__footer">
        <div className="birds-export__footer-left" />
        <div className="birds-export__footer-right">
          <button
            className="birds-export__btn-cancel"
            onClick={handleClose}
            disabled={loading}>
            Cancel
          </button>
          <button
            className="birds-export__btn-submit"
            onClick={handleExport}
            disabled={loading}>
            {loading ? (
              <>
                <CircularProgress size={13} color="inherit" />
                Exporting...
              </>
            ) : (
              <>
                <FileDownloadIcon className="birds-export__btn-icon" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default BirdsExportDialog;
