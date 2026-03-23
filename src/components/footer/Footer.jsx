import { useState, useEffect } from "react";
import Tooltip from "@mui/material/Tooltip";
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
import "./Footer.scss";

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

const Footer = () => {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [networkType, setNetworkType] = useState("Unknown");

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

  return (
    <footer className="footer">
      <div className="footer__left" />

      <div className="footer__right">
        {/* Wifi */}
        <Tooltip
          title={
            online
              ? `Network Status: ${networkType} - Online`
              : "Network Status: Offline"
          }>
          <div
            className={`footer__item ${!online ? "footer__item--error" : ""}`}>
            {online ? <WifiIcon /> : <WifiOffIcon />}
          </div>
        </Tooltip>

        {/* Battery */}
        {battery && (
          <Tooltip
            title={`${battery.charging ? "Charging" : "Battery"} ${battery.level}%`}>
            <div
              className="footer__item"
              style={{
                color: getBatteryColor(battery.level, battery.charging),
              }}>
              {getBatteryIcon(battery.level, battery.charging)}
            </div>
          </Tooltip>
        )}

        {/* Datetime */}
        <div className="footer__datetime">
          <span className="footer__date">{formatDate(time)}</span>
          <span className="footer__time">{formatTime(time)}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
