import { useLocation, useNavigate } from "react-router";
import { MODULES } from "../../config/modules.jsx";
import "./Breadcrumbs.scss";

const buildCrumbs = (pathname) => {
  const crumbs = [];

  const dashboard = MODULES.DASHBOARD;
  if (pathname !== "/") {
    crumbs.push({
      label: dashboard.displayName,
      icon: dashboard.icon,
      path: dashboard.path,
    });
  }

  for (const mod of Object.values(MODULES)) {
    if (mod.permissionId === "LOGIN") continue;

    if (mod.children) {
      for (const child of Object.values(mod.children)) {
        const fullPath = `${mod.path}/${child.path}`;
        if (pathname === fullPath || pathname.startsWith(fullPath + "/")) {
          crumbs.push({
            label: child.displayName,
            icon: child.icon,
            path: fullPath,
          });
          return crumbs;
        }
      }
    }

    if (
      mod.path === "/"
        ? pathname === "/"
        : pathname === mod.path || pathname.startsWith(mod.path + "/")
    ) {
      if (mod.permissionId !== "DASHBOARD") {
        crumbs.push({ label: mod.displayName, icon: mod.icon, path: mod.path });
      }
      return crumbs;
    }
  }

  return crumbs;
};

const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = buildCrumbs(location.pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav className="breadcrumbs">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.path} className="breadcrumbs__item-wrap">
            <span
              className={`breadcrumbs__item ${isLast ? "breadcrumbs__item--active" : "breadcrumbs__item--clickable"}`}
              onClick={() => !isLast && navigate(crumb.path)}>
              {crumb.icon && (
                <span className="breadcrumbs__icon">{crumb.icon}</span>
              )}
              <span className="breadcrumbs__label">{crumb.label}</span>
            </span>
            {!isLast && <span className="breadcrumbs__sep">›</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
