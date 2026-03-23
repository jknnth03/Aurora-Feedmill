import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "../../styles/Themecontext";

const UniversalButton = ({
  label,
  icon,
  onClick,
  variant = "contained",
  size = "small",
  color,
  tooltip,
  disabled,
}) => {
  const { isDark } = useTheme();

  const btn = (
    <Button
      variant={variant}
      size={size}
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      sx={{
        height: "32px",
        minHeight: "unset",
        backgroundColor: isDark ? "#e0e0e0" : "#fff",
        color: color || (isDark ? "#c85c00" : "#f37925"),
        fontFamily: "Poppins, sans-serif",
        fontWeight: 600,
        fontSize: "0.8rem",
        textTransform: "none",
        boxShadow: "none",
        "&:hover": {
          backgroundColor: isDark ? "#bdbdbd" : "rgba(255,255,255,0.85)",
          boxShadow: "none",
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
