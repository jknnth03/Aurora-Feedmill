import { useRef } from "react";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArchiveIcon from "@mui/icons-material/Archive";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "../../styles/Themecontext";
import "./TableSearch.scss";

export const TableSearchField = ({
  value,
  onChange,
  placeholder = "Search...",
}) => {
  const { isDark } = useTheme();
  const inputRef = useRef(null);

  return (
    <div
      className="ts__field"
      style={{ backgroundColor: isDark ? "#e0e0e0" : "#fff" }}>
      <SearchIcon
        className="ts__field-icon"
        style={{ color: isDark ? "#c85c00" : "#f37925" }}
      />
      <input
        ref={inputRef}
        className="ts__input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ color: isDark ? "#1a1a1a" : undefined }}
      />
      {value && (
        <button
          className="ts__clear"
          onClick={() => onChange("")}
          style={{ color: isDark ? "#c85c00" : "#f37925" }}>
          <CloseIcon fontSize="small" />
        </button>
      )}
    </div>
  );
};

export const TableFilterButton = ({ onClick, active = false }) => {
  return (
    <Tooltip title="Click this button to filter data" placement="bottom">
      <button
        className={`ts__filter${active ? " ts__filter--active" : ""}`}
        onClick={onClick}>
        <FilterListIcon sx={{ fontSize: "1.1rem" }} />
      </button>
    </Tooltip>
  );
};

export const ArchivedButton = ({ onClick, active = false }) => {
  return (
    <Tooltip
      title={
        active
          ? "Click to view active records"
          : "Click to view archived records"
      }
      placement="bottom">
      <button
        className={`ts__archived${active ? " ts__archived--active" : ""}`}
        onClick={onClick}>
        <ArchiveIcon sx={{ fontSize: "1.1rem" }} />
        <span className="ts__archived-label">Archived</span>
      </button>
    </Tooltip>
  );
};
