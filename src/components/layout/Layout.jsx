import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "../sidebar/Sidebar";
import Appbar from "../appbar/Appbar";
import Footer from "../footer/Footer";
import "./Layout.scss";

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === "/") {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="layout">
      <Sidebar
        open={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
      />

      <div className="layout__body">
        <Appbar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          isMobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <main className="layout__content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
