import { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MoveDownIcon from "@mui/icons-material/MoveDown";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import Battery80Icon from "@mui/icons-material/Battery80";
import Battery60Icon from "@mui/icons-material/Battery60";
import Battery50Icon from "@mui/icons-material/Battery50";
import Battery30Icon from "@mui/icons-material/Battery30";
import Battery20Icon from "@mui/icons-material/Battery20";
import BatteryAlertIcon from "@mui/icons-material/BatteryAlert";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import Breadcrumbs from "../breadcrumbs/Breadcrumbs.jsx";
import "./Appbar.scss";

const getBatteryIcon = (level, charging) => {
  if (charging) return <BatteryChargingFullIcon />;
  if (level >= 95) return <BatteryFullIcon />;
  if (level >= 70) return <Battery80Icon />;
  if (level >= 50) return <Battery60Icon />;
  if (level >= 40) return <Battery50Icon />;
  if (level >= 20) return <Battery30Icon />;
  if (level >= 10) return <Battery20Icon />;
  return <BatteryAlertIcon />;
};

const getBatteryColor = (level, charging) => {
  if (charging) return "#4caf50";
  if (level >= 40) return "#4caf50";
  if (level >= 20) return "#ed6c02";
  return "#d32f2f";
};

const Appbar = ({
  open = false,
  setOpen = () => {},
  isMobileSidebarOpen = false,
  setMobileSidebarOpen = () => {},
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [networkType, setNetworkType] = useState("Unknown");

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

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (conn) {
      const update = () =>
        setNetworkType(conn.effectiveType?.toUpperCase() || "Unknown");
      update();
      conn.addEventListener("change", update);
      return () => {
        conn.removeEventListener("change", update);
        window.removeEventListener("online", updateOnline);
        window.removeEventListener("offline", updateOnline);
      };
    }

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!navigator.getBattery) return;
    navigator.getBattery().then((bat) => {
      const update = () =>
        setBattery({
          level: Math.round(bat.level * 100),
          charging: bat.charging,
        });
      update();
      bat.addEventListener("levelchange", update);
      bat.addEventListener("chargingchange", update);
      return () => {
        bat.removeEventListener("levelchange", update);
        bat.removeEventListener("chargingchange", update);
      };
    });
  }, []);

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (d) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
        <Tooltip
          title={
            online
              ? `Network Status: ${networkType} - Online`
              : "Network Status: Offline"
          }>
          <div
            className={`appbar__status-item ${!online ? "appbar__status-item--error" : ""}`}>
            {online ? <WifiIcon /> : <WifiOffIcon />}
          </div>
        </Tooltip>

        {battery && (
          <Tooltip
            title={`${battery.charging ? "Charging" : "Battery"} ${battery.level}%`}>
            <div
              className="appbar__status-item"
              style={{
                color: getBatteryColor(battery.level, battery.charging),
              }}>
              {getBatteryIcon(battery.level, battery.charging)}
            </div>
          </Tooltip>
        )}

        <div className="appbar__datetime">
          <span className="appbar__date">{formatDate(time)}</span>
          <span className="appbar__time">{formatTime(time)}</span>
        </div>
      </div>
    </header>
  );
};

export default Appbar;
