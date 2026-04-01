import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Switch from "@mui/material/Switch";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PaletteIcon from "@mui/icons-material/Palette";
import TextFormatIcon from "@mui/icons-material/TextFormat";
import "./AccountMenu.scss";
import { useTheme } from "../../styles/Themecontext";
import { setLoggingOut } from "../../app/authSlice";
import PalettePickerDialog, {
  applyPalette,
  initPalette,
} from "./PalettePickerDialog";
import TextColorPickerDialog from "./TextColorPickerDialog";

const AccountMenu = ({ user, initials, sidebarOpen = true }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDark, toggleTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState("default-orange");
  const open = Boolean(anchorEl);

  useEffect(() => {
    const saved = initPalette();
    setSelectedPalette(saved);
    // initTextColors is now handled by ThemeContext on mount and theme toggle
  }, []);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    dispatch(setLoggingOut(true));
  };

  const handleSettings = () => {
    handleClose();
    navigate("/settings");
  };

  const handlePalettePicker = () => {
    handleClose();
    setPaletteOpen(true);
  };

  const handleTextColorPicker = () => {
    handleClose();
    setTextColorOpen(true);
  };

  const handlePaletteSelect = (id) => {
    applyPalette(id);
    setSelectedPalette(id);
  };

  return (
    <>
      <button className="account-trigger" onClick={handleOpen}>
        <div className="account-trigger__avatar">{initials}</div>
        {sidebarOpen && (
          <div className="account-trigger__info">
            <span className="account-trigger__name">
              {user?.fullName || "User"}
            </span>
            <span className="account-trigger__role">
              {user?.roleName || "—"}
            </span>
          </div>
        )}
      </button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
        slotProps={{
          paper: { className: "account-menu__paper", elevation: 4 },
        }}>
        <MenuItem
          className="account-menu__item account-menu__item--toggle"
          disableRipple>
          <ListItemIcon>
            {isDark ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </ListItemIcon>
          {isDark ? "Light Mode" : "Dark Mode"}
          <Switch
            checked={isDark}
            onChange={toggleTheme}
            size="small"
            className="account-menu__switch"
            sx={{
              marginLeft: "auto",
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#f37925" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#f37925",
              },
            }}
          />
        </MenuItem>

        <MenuItem className="account-menu__item" onClick={handlePalettePicker}>
          <ListItemIcon>
            <PaletteIcon fontSize="small" />
          </ListItemIcon>
          Palette Picker
        </MenuItem>

        <MenuItem
          className="account-menu__item"
          onClick={handleTextColorPicker}>
          <ListItemIcon>
            <TextFormatIcon fontSize="small" />
          </ListItemIcon>
          Text Colors
        </MenuItem>

        <MenuItem className="account-menu__item" onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>

        <MenuItem
          className="account-menu__item account-menu__item--logout"
          onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" className="logout-icon" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <PalettePickerDialog
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        selectedPalette={selectedPalette}
        onSelect={handlePaletteSelect}
      />

      <TextColorPickerDialog
        open={textColorOpen}
        onClose={() => setTextColorOpen(false)}
      />
    </>
  );
};

export default AccountMenu;
