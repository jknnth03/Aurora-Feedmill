import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import blackcat from "../../assets/white.json";
import whitecat from "../../assets/black.json";
import "./Dashboard.scss";
import { useTheme } from "../../styles/Themecontext";

const Dashboard = () => {
  const { isDark, toggleTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [catVisible, setCatVisible] = useState(true);
  const [currentCat, setCurrentCat] = useState(isDark ? blackcat : whitecat);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setCatVisible(false);
    const t = setTimeout(() => {
      setCurrentCat(isDark ? blackcat : whitecat);
      setCatVisible(true);
    }, 350);
    return () => clearTimeout(t);
  }, [isDark]);

  return (
    <div className={`dashboard ${visible ? "dashboard--visible" : ""}`}>
      <h1 className="dashboard__title">Dashboard</h1>

      <div className="dashboard__banner">
        <div className="dashboard__banner-text">
          <p className="dashboard__greeting">Welcome to</p>
          <h1 className="dashboard__name">
            <span className="dashboard__name-highlight">AURORA</span> FEEDMILL
          </h1>
        </div>

        <div className="dashboard__theme">
          <p className="dashboard__theme-question">
            Would you prefer
            <br />
            {isDark ? (
              <>
                <span className="dashboard__theme-word">light</span> mode?
              </>
            ) : (
              <>
                <span className="dashboard__theme-word">dark</span> mode?
              </>
            )}
          </p>
          <button className="dashboard__theme-btn" onClick={toggleTheme}>
            {isDark ? (
              <LightModeIcon className="dashboard__theme-icon dashboard__theme-icon--light" />
            ) : (
              <DarkModeIcon className="dashboard__theme-icon dashboard__theme-icon--dark" />
            )}
          </button>
          <p className="dashboard__theme-hint">If yes, click the icon above</p>
        </div>

        <div
          className={`dashboard__banner-lottie ${catVisible ? "dashboard__banner-lottie--visible" : ""}`}>
          <Lottie
            animationData={currentCat}
            loop
            autoplay
            style={{ width: "100%", height: "80%" }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
