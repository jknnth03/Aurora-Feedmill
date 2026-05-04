import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useTheme } from "../../styles/Themecontext";
import "./UniversalButtons.scss";

const UniversalButton = ({
  label,
  shortLabel,
  icon,
  onClick,
  variant = "contained",
  size = "small",
  color,
  tooltip,
  disabled,
  modalVariant = false,
}) => {
  const { isDark } = useTheme();

  const defaultSx = {
    height: "28px",
    minHeight: "unset",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(4px)",
    color: color || "#ffffff",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
    fontSize: "0.8rem",
    textTransform: "none",
    boxShadow: "none",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.38)",
      boxShadow: "none",
      border: "1px solid rgba(255, 255, 255, 0.5)",
    },
  };

  const modalSx = {
    height: "28px",
    minHeight: "unset",
    backgroundColor: "#E07B39",
    color: "#ffffff",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
    fontSize: "0.8rem",
    textTransform: "none",
    boxShadow: "none",
    border: "1px solid #E07B39",
    "&:hover": {
      backgroundColor: "#c96a2b",
      boxShadow: "none",
      border: "1px solid #c96a2b",
    },
    "&.Mui-disabled": {
      backgroundColor: "rgba(224, 123, 57, 0.4)",
      color: "rgba(255, 255, 255, 0.6)",
      border: "1px solid rgba(224, 123, 57, 0.3)",
    },
  };

  const btn = (
    <Button
      variant={variant}
      size={size}
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      sx={modalVariant ? modalSx : defaultSx}>
      {shortLabel ? (
        <>
          <span className="ubtn__label--full">{label}</span>
          <span className="ubtn__label--short">{shortLabel}</span>
        </>
      ) : (
        label
      )}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="bottom">
        <span>{btn}</span>
      </Tooltip>
    );
  }

  return btn;
};

export const SaveButton = ({
  label = "Save",
  icon = <SaveIcon />,
  onClick,
  disabled,
  tooltip,
  size = "small",
}) => {
  const btn = (
    <Button
      variant="contained"
      size={size}
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      sx={{
        height: "36px",
        minHeight: "unset",
        backgroundColor: "#2e7d32",
        color: "#ffffff",
        fontFamily: "Poppins, sans-serif",
        fontWeight: 600,
        fontSize: "0.85rem",
        textTransform: "none",
        boxShadow: "none",
        borderRadius: "8px",
        paddingLeft: "18px",
        paddingRight: "18px",
        border: "1px solid #2e7d32",
        "&:hover": {
          backgroundColor: "#1b5e20",
          boxShadow: "none",
          border: "1px solid #1b5e20",
        },
        "&.Mui-disabled": {
          backgroundColor: "rgba(46, 125, 50, 0.4)",
          color: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(46, 125, 50, 0.3)",
        },
      }}>
      {label}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="bottom">
        <span>{btn}</span>
      </Tooltip>
    );
  }

  return btn;
};

export const ConfirmButton = ({
  label = "Confirm",
  icon = <SaveIcon />,
  onClick,
  disabled,
  tooltip,
  size = "small",
}) => {
  const btn = (
    <Button
      variant="contained"
      size={size}
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      sx={{
        height: "28px",
        minHeight: "unset",
        backgroundColor: "#2e7d32",
        color: "#ffffff",
        fontFamily: "Poppins, sans-serif",
        fontWeight: 600,
        fontSize: "0.8rem",
        textTransform: "none",
        boxShadow: "none",
        border: "1px solid #2e7d32",
        "&:hover": {
          backgroundColor: "#1b5e20",
          boxShadow: "none",
          border: "1px solid #1b5e20",
        },
        "&.Mui-disabled": {
          backgroundColor: "rgba(46, 125, 50, 0.4)",
          color: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(46, 125, 50, 0.3)",
        },
      }}>
      {label}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="bottom">
        <span>{btn}</span>
      </Tooltip>
    );
  }

  return btn;
};

export const BackButton = ({
  label = "Back",
  onClick,
  disabled,
  tooltip,
  size = "small",
}) => {
  const btn = (
    <Button
      variant="outlined"
      size={size}
      startIcon={<ArrowBackIcon />}
      onClick={onClick}
      disabled={disabled}
      sx={{
        height: "28px",
        minHeight: "unset",
        backgroundColor: "transparent",
        color: "#888580",
        fontFamily: "Poppins, sans-serif",
        fontWeight: 600,
        fontSize: "0.8rem",
        textTransform: "none",
        boxShadow: "none",
        border: "1px solid #c8c4be",
        "&:hover": {
          backgroundColor: "rgba(0,0,0,0.04)",
          boxShadow: "none",
          border: "1px solid #a09c96",
          color: "#5a5753",
        },
        "&.Mui-disabled": {
          color: "rgba(0,0,0,0.26)",
          border: "1px solid rgba(0,0,0,0.12)",
        },
      }}>
      {label}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="bottom">
        <span>{btn}</span>
      </Tooltip>
    );
  }

  return btn;
};

export default UniversalButton;
