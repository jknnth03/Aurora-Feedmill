import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import dayjs from "dayjs";
import { exportCobsToExcel } from "./exportCobsToExcel";
import "./COBSExportDialog.scss";

const COBSExportDialog = ({ open, onClose, fetchExportData }) => {
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
      await exportCobsToExcel(data, startDate, endDate);
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
      PaperProps={{ className: "cobs-export__paper" }}>
      <div className="cobs-export__header">
        <div className="cobs-export__header-title">
          <FileDownloadIcon className="cobs-export__header-icon" />
          Export COBS Monitoring Report
        </div>
        <IconButton
          className="cobs-export__close"
          size="small"
          onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="cobs-export__content">
        <div className="cobs-export__field">
          <label className="cobs-export__label">
            Start Date <span className="cobs-export__required">*</span>
          </label>
          <div
            className={`cobs-export__input-wrap${!startDate && error ? " cobs-export__input-wrap--error" : ""}`}>
            <CalendarTodayIcon className="cobs-export__input-icon" />
            <input
              type="date"
              className="cobs-export__input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="cobs-export__field">
          <label className="cobs-export__label">
            End Date <span className="cobs-export__required">*</span>
          </label>
          <div
            className={`cobs-export__input-wrap${!endDate && error ? " cobs-export__input-wrap--error" : ""}`}>
            <CalendarTodayIcon className="cobs-export__input-icon" />
            <input
              type="date"
              className="cobs-export__input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="cobs-export__error">
            <ErrorOutlineIcon className="cobs-export__error-icon" />
            {error}
          </div>
        )}
      </div>

      <div className="cobs-export__footer">
        <div className="cobs-export__footer-left" />
        <div className="cobs-export__footer-right">
          <button
            className="cobs-export__btn-cancel"
            onClick={handleClose}
            disabled={loading}>
            Cancel
          </button>
          <button
            className="cobs-export__btn-submit"
            onClick={handleExport}
            disabled={loading}>
            {loading ? (
              <>
                <CircularProgress size={13} color="inherit" />
                Exporting...
              </>
            ) : (
              <>
                <FileDownloadIcon className="cobs-export__btn-icon" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default COBSExportDialog;
