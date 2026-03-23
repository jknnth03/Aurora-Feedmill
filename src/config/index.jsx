import React from "react";
import Layout from "../components/layout/Layout.jsx";
import { Outlet, Navigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../app/authSlice.js";

const PrivateRoutes = () => {
  const token = useSelector(selectCurrentToken);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default PrivateRoutes;
