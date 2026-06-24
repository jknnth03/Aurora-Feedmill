import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "../sidebar/Sidebar";
import Appbar from "../appbar/Appbar";
import Footer from "../footer/Footer";
import "./Layout.scss";
import { useGetApprovalsStatusCountQuery } from "../../features/api/login/loginApiSlice";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: approvalsStatusCount } = useGetApprovalsStatusCountQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
    },
  );

  return (
    <div className="layout">
      <Sidebar
        open={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        onCloseSidebar={() => setSidebarOpen(false)}
        approvalsStatusCount={approvalsStatusCount}
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
