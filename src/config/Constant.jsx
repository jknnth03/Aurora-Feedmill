import React from "react";
import PushPinIcon from "@mui/icons-material/PushPin";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const CONSTANT = {
  // ─── Form ───────────────────────────────────────────────────────────────────
  FORM: {
    REQUIRED_ICON: (
      <PushPinIcon sx={{ fontSize: "0.55rem", color: "#d32f2f" }} />
    ),
    REQUIRED_LABEL: "Required field",
  },

  // ─── Status Icons ────────────────────────────────────────────────────────────
  STATUS: {
    SUCCESS: (
      <CheckCircleOutlineIcon sx={{ fontSize: "1rem", color: "#2e7d32" }} />
    ),
    ERROR: <ErrorOutlineIcon sx={{ fontSize: "1rem", color: "#d32f2f" }} />,
    WARNING: <WarningAmberIcon sx={{ fontSize: "1rem", color: "#ed6c02" }} />,
    INFO: <InfoOutlinedIcon sx={{ fontSize: "1rem", color: "#0288d1" }} />,
  },

  // ─── Pagination ──────────────────────────────────────────────────────────────
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_ROWS_PER_PAGE: 10,
    ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50, 100],
  },

  // ─── Date ────────────────────────────────────────────────────────────────────
  DATE: {
    FORMAT: "MM/DD/YYYY",
    FORMAT_LONG: "MMMM DD, YYYY",
    FORMAT_WITH_TIME: "MM/DD/YYYY hh:mm A",
  },
};

export default CONSTANT;
