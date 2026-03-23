import Lottie from "lottie-react";
import NoDataAnimation from "../../assets/NoDataFound.json";
import "./NoDataFound.scss";

const NoDataFound = () => {
  return (
    <div className="no-data">
      <div className="no-data__animation">
        <Lottie animationData={NoDataAnimation} loop autoplay />
      </div>
      <p className="no-data__message">•󠁏 No data found󠁯 •󠁏</p>
    </div>
  );
};

export default NoDataFound;
