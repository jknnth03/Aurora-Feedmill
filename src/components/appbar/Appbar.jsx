import { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MoveDownIcon from "@mui/icons-material/MoveDown";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import Breadcrumbs from "../breadcrumbs/Breadcrumbs.jsx";
import "./Appbar.scss";

const Appbar = ({
  open = false,
  setOpen = () => {},
  isMobileSidebarOpen = false,
  setMobileSidebarOpen = () => {},
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && isMobileSidebarOpen) setMobileSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [isMobileSidebarOpen, setMobileSidebarOpen]);

  const handleToggle = () => {
    if (isMobile) {
      setMobileSidebarOpen((p) => !p);
    } else {
      setOpen((p) => !p);
    }
  };

  const toggleIcon = open ? (
    <MoveUpIcon sx={{ transform: "rotate(-90deg)" }} />
  ) : (
    <MoveDownIcon sx={{ transform: "rotate(-90deg)" }} />
  );

  return (
    <header className="appbar">
      <Tooltip
        title={open ? "Click to minimize" : "Click to maximize"}
        placement="bottom">
        <IconButton
          size="small"
          onClick={handleToggle}
          className="appbar__toggle"
          sx={{ "& svg": { fontSize: "18px" } }}>
          {toggleIcon}
        </IconButton>
      </Tooltip>

      <Breadcrumbs />
      <div className="appbar__spacer" />

      <div className="appbar__right">
        <Tooltip title="Click notification icon to check Notifications!">
          <IconButton size="small" className="appbar__notif">
            <NotificationsIcon />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
};

export default Appbar;
