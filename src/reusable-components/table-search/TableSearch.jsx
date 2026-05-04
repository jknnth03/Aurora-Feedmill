import { useEffect, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArchiveIcon from "@mui/icons-material/Archive";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
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
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCollapse = () => {
    if (!value) {
      setExpanded(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setExpanded(false);
  };

  return (
    <div
      className={`ts__field${expanded ? " ts__field--expanded" : " ts__field--collapsed"}`}
      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.25)" : undefined }}
      onClick={!expanded ? handleExpand : undefined}>
      <SearchIcon className="ts__field-icon" style={{ color: "#ffffff" }} />
      {expanded && (
        <>
          <input
            ref={inputRef}
            className="ts__input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            onBlur={handleCollapse}
            style={{ color: isDark ? "#ffffff" : undefined }}
          />
          {value && (
            <button
              className="ts__clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              style={{
                color: isDark ? "#ffffff" : "var(--palette-primary, #f37925)",
              }}>
              <CloseIcon fontSize="small" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export const TableDropdownField = ({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? null;

  const handleToggle = () => {
    if (disabled) return;
    setOpen((o) => !o);
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`ts__dropdown${disabled ? " ts__dropdown--disabled" : ""}`}
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.25)" : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={handleToggle}>
      <span
        className="ts__dropdown-label"
        style={{
          color: selectedLabel ? "#ffffff" : "rgba(255,255,255,0.6)",
        }}>
        {selectedLabel ?? placeholder}
      </span>

      {value ? (
        <button
          className="ts__clear"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          style={{
            color: isDark ? "#ffffff" : "var(--palette-primary, #f37925)",
          }}>
          <CloseIcon fontSize="small" />
        </button>
      ) : (
        <KeyboardArrowDownIcon
          className={`ts__dropdown-arrow${open ? " ts__dropdown-arrow--open" : ""}`}
          style={{ color: "#ffffff" }}
        />
      )}

      {open && (
        <div className="ts__dropdown-menu">
          {options.length === 0 ? (
            <div
              className="ts__dropdown-option"
              style={{ opacity: 0.5, cursor: "default" }}>
              No options available
            </div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                className={`ts__dropdown-option${opt.value === value ? " ts__dropdown-option--selected" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}>
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const TableFilterButton = ({ onClick, active = false }) => {
  return (
    <Tooltip title="Click this button to filter data" placement="bottom">
      <button
        className={`ts__filter${active ? " ts__filter--active" : ""}`}
        style={{
          backgroundColor: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.35)",
          color: "#ffffff",
        }}
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
        style={{
          backgroundColor: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.35)",
          color: "#ffffff",
        }}
        onClick={onClick}>
        <ArchiveIcon sx={{ fontSize: "1.1rem" }} />
        <span className="ts__archived-label">Archived</span>
      </button>
    </Tooltip>
  );
};
