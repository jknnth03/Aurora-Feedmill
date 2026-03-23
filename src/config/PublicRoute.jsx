import { Navigate } from "react-router";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../app/authSlice.js";

const PublicRoute = ({ children }) => {
  const token = useSelector(selectCurrentToken);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;
