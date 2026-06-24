import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Collapse, Tooltip } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CloseIcon from "@mui/icons-material/Close";
import { MODULES } from "../../config/modules.jsx";
import AuroraIcon from "../../assets/aurora.svg";
import AccountMenu from "../accountmenu/AccountMenu.jsx";
import "./Sidebar.scss";

const getFilteredNavItems = (user) => {
  const permissions = user?.role?.permissions ?? [];
  const permissionNames = permissions.map((p) => p.name);

  return Object.values(MODULES)
    .filter((m) => m.permissionId !== "LOGIN")
    .filter((m) => {
      if (m.permissionId === "DASHBOARD") return true;
      return permissionNames.includes(m.name);
    })
    .map((m) => {
      if (!m.children) return m;
      return m;
    });
};

const NavItem = ({
  item,
  sidebarOpen,
  onExpandSidebar,
  onCloseSidebar,
  approvalsStatusCount,
  level = 0,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasChildren = item.children && Object.keys(item.children).length > 0;

  const isChildActive = (children, basePath = "") => {
    if (!children) return false;
    return Object.values(children).some((child) => {
      const fullPath = `${basePath}/${child.path}`;
      return (
        location.pathname === fullPath ||
        location.pathname.startsWith(`${fullPath}/`) ||
        (child.children && isChildActive(child.children, fullPath))
      );
    });
  };

  const anyChildActive = hasChildren
    ? isChildActive(item.children, item.path)
    : false;

  const [open, setOpen] = useState(anyChildActive);

  useEffect(() => {
    if (anyChildActive) setOpen(true);
  }, [location.pathname]);

  const isActive =
    !hasChildren &&
    (location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`));

  const paddingLeft = level === 0 ? 14 : 14 + level * 16;

  const handleClick = () => {
    if (!sidebarOpen && level === 0) {
      onExpandSidebar();
      if (hasChildren) {
        setOpen(true);
      } else {
        navigate(item.path);
        onCloseSidebar();
      }
      return;
    }

    if (hasChildren) {
      setOpen((p) => !p);
    } else {
      navigate(item.path);
      onCloseSidebar();
    }
  };

  const isApproval = item.permissionId === "APPROVAL";
  const isApprovalCobs = item.permissionId === "APPROVAL.COBS";
  const isApprovalBirds = item.permissionId === "APPROVAL.BIRDS";
  const isApprovalPests = item.permissionId === "APPROVAL.PESTS";

  const totalBadge = approvalsStatusCount?.pending?.TOTAL ?? 0;
  const cobsBadge = approvalsStatusCount?.pending?.COBS ?? 0;
  const birdsBadge = approvalsStatusCount?.pending?.BIRDS ?? 0;
  const pestsBadge = approvalsStatusCount?.pending?.PESTS ?? 0;

  const getBadgeCount = () => {
    if (isApproval) return totalBadge;
    if (isApprovalCobs) return cobsBadge;
    if (isApprovalBirds) return birdsBadge;
    if (isApprovalPests) return pestsBadge;
    return 0;
  };

  const badgeCount = getBadgeCount();

  const itemEl = (
    <div
      className={`nav-item
        ${isActive || anyChildActive ? "nav-item--active" : ""}
        ${hasChildren ? "nav-item--parent" : ""}
        ${level > 0 ? "nav-item--child" : ""}
      `}
      style={{ paddingLeft }}
      onClick={handleClick}>
      <span className="nav-item__icon">
        {item.icon}
        {badgeCount > 0 && !sidebarOpen && (
          <span className="nav-item__badge nav-item__badge--dot" />
        )}
      </span>
      {sidebarOpen && (
        <>
          <span className="nav-item__label">{item.displayName}</span>
          {level > 0 && isActive && (
            <span className="nav-item__check">
              <DoneAllIcon className="nav-item__check-icon" />
            </span>
          )}
          {badgeCount > 0 && (
            <span className="nav-item__badge">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
          {hasChildren && (
            <span
              className="nav-item__arrow"
              style={{
                transform: open ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.2s ease",
              }}>
              <ArrowDropDownIcon fontSize="small" />
            </span>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="nav-item-wrap">
      {!sidebarOpen && level === 0 ? (
        <Tooltip title={item.displayName} placement="right">
          {itemEl}
        </Tooltip>
      ) : (
        itemEl
      )}

      {hasChildren && (
        <Collapse in={open && sidebarOpen}>
          <div>
            {Object.values(item.children).map((child) => (
              <NavItem
                key={child.permissionId}
                item={{
                  ...child,
                  path: `${item.path}/${child.path}`,
                }}
                sidebarOpen={sidebarOpen}
                onExpandSidebar={onExpandSidebar}
                onCloseSidebar={onCloseSidebar}
                approvalsStatusCount={approvalsStatusCount}
                level={level + 1}
              />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
};

const SidebarInner = ({
  open,
  isMobile = false,
  onCloseMobile,
  onExpandSidebar,
  onCloseSidebar,
  navItems,
  user,
  initials,
  approvalsStatusCount,
}) => (
  <div
    className={`sidebar ${open || isMobile ? "sidebar--open" : "sidebar--closed"}`}>
    <div className="sidebar__brand">
      <Tooltip title="Aurora Feedmill" placement="right">
        <img src={AuroraIcon} alt="Aurora" className="sidebar__logo-icon" />
      </Tooltip>
      {(open || isMobile) && (
        <span className="sidebar__brand-name">
          Aurora <span className="sidebar__brand-sub">Feedmill</span>
        </span>
      )}
      {isMobile && (
        <button className="sidebar__close-btn" onClick={onCloseMobile}>
          <CloseIcon fontSize="small" />
        </button>
      )}
    </div>

    <nav className="sidebar__nav">
      {navItems.map((item) => (
        <NavItem
          key={item.permissionId}
          item={item}
          sidebarOpen={open || isMobile}
          onExpandSidebar={onExpandSidebar}
          onCloseSidebar={isMobile ? onCloseMobile : onCloseSidebar}
          approvalsStatusCount={approvalsStatusCount}
        />
      ))}
    </nav>

    <div className="sidebar__footer">
      <AccountMenu
        user={user}
        initials={initials}
        sidebarOpen={open || isMobile}
      />
    </div>
  </div>
);

const Sidebar = ({
  open,
  mobileSidebarOpen = false,
  onCloseMobile = () => {},
  onToggleSidebar = () => {},
  onCloseSidebar = () => {},
  approvalsStatusCount,
}) => {
  const rawUser = JSON.parse(localStorage.getItem("user")) || {};
  const sidebarRef = useRef(null);

  const fullName =
    rawUser.first_name && rawUser.last_name
      ? `${rawUser.first_name} ${rawUser.last_name}`
      : "Unknown User";

  const roleName = rawUser.role?.name || "No Role";
  const user = { ...rawUser, fullName, roleName };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = getFilteredNavItems(rawUser);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onCloseSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onCloseSidebar]);

  return (
    <>
      <div
        ref={sidebarRef}
        className={`sidebar-wrapper sidebar-wrapper--desktop ${
          open ? "sidebar-wrapper--open" : "sidebar-wrapper--closed"
        }`}>
        <SidebarInner
          open={open}
          onCloseMobile={onCloseMobile}
          onExpandSidebar={onToggleSidebar}
          onCloseSidebar={onCloseSidebar}
          navItems={navItems}
          user={user}
          initials={initials}
          approvalsStatusCount={approvalsStatusCount}
        />
      </div>

      {mobileSidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={onCloseMobile} />
          <div className="sidebar-wrapper sidebar-wrapper--mobile sidebar-wrapper--mobile-open">
            <SidebarInner
              open={open}
              isMobile
              onCloseMobile={onCloseMobile}
              onExpandSidebar={onToggleSidebar}
              onCloseSidebar={onCloseSidebar}
              navItems={navItems}
              user={user}
              initials={initials}
              approvalsStatusCount={approvalsStatusCount}
            />
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
