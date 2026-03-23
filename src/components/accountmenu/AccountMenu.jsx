import { useState } from "react";
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
import "./AccountMenu.scss";
import { useTheme } from "../../styles/Themecontext";
import { setLoggingOut } from "../../app/authSlice";

const AccountMenu = ({ user, initials, sidebarOpen = true }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDark, toggleTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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
        <div className="account-menu__header">
          <div className="account-menu__avatar">{initials}</div>
          <div className="account-menu__user">
            <span className="account-menu__name">
              {user?.fullName || "User"}
            </span>
            <span className="account-menu__role">{user?.roleName || "—"}</span>
          </div>
        </div>

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
    </>
  );
};

export default AccountMenu;
