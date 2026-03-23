import { useEffect } from "react";
import AuroraIcon from "../../assets/aurora.svg";
import "./LogoutTransition.scss";

const LogoutTransition = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="logout-overlay">
      <img src={AuroraIcon} alt="Aurora" className="logout-overlay__logo" />
    </div>
  );
};

export default LogoutTransition;
