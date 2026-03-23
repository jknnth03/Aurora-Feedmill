import React from "react";
import { MODULES } from "./modules.jsx";
import PrivateRoutes from "./index.jsx";
import PublicRoute from "./PublicRoute.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Users from "../pages/user-management/user/Users.jsx";
import Roles from "../pages/user-management/roles/Roles.jsx";
import Permissions from "../pages/user-management/permissions/Permissions.jsx";
import Checklist from "../pages/masterlist/checklists/Checklists.jsx";
import Sections from "../pages/masterlist/sections/Sections.jsx";
import InspectionAreas from "../pages/masterlist/inspection-areas/InspectionAreas.jsx";
import Login from "../pages/login/Login.jsx";
import COBS from "../pages/checklist-form/COBS/COBS.jsx";

export const ROUTES = [
  {
    id: "LOGIN",
    path: MODULES.LOGIN.path,
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },

  {
    element: <PrivateRoutes />,
    children: [
      {
        id: "DASHBOARD",
        path: MODULES.DASHBOARD.path,
        element: <Dashboard />,
        handle: { permission: MODULES.DASHBOARD.permissionId },
      },

      // ─── User Management ───────────────────────────────────────────────────
      {
        id: "USERMANAGEMENT.USERS",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.USERS.path}`,
        element: <Users />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.USERS.permissionId,
        },
      },
      {
        id: "USERMANAGEMENT.ROLES",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.ROLES.path}`,
        element: <Roles />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.ROLES.permissionId,
        },
      },
      {
        id: "USERMANAGEMENT.PERMISSIONS",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.PERMISSIONS.path}`,
        element: <Permissions />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.PERMISSIONS.permissionId,
        },
      },

      // ─── Masterlist ────────────────────────────────────────────────────────
      {
        id: "MASTERLIST.CHECKLIST",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.CHECKLIST.path}`,
        element: <Checklist />,
        handle: {
          permission: MODULES.MASTERLIST.children.CHECKLIST.permissionId,
        },
      },
      {
        id: "MASTERLIST.SECTIONS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.SECTIONS.path}`,
        element: <Sections />,
        handle: {
          permission: MODULES.MASTERLIST.children.SECTIONS.permissionId,
        },
      },
      {
        id: "MASTERLIST.INSPECTION_AREAS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.INSPECTION_AREAS.path}`,
        element: <InspectionAreas />,
        handle: {
          permission: MODULES.MASTERLIST.children.INSPECTION_AREAS.permissionId,
        },
      },

      // ─── Checklist Form ────────────────────────────────────────────────────
      {
        id: "CHECKLISTFORM.COBS",
        path: `${MODULES.CHECKLISTFORM.path}/${MODULES.CHECKLISTFORM.children.COBS.path}`,
        element: <COBS />,
        handle: {
          permission: MODULES.CHECKLISTFORM.children.COBS.permissionId,
        },
      },
    ],
  },
];
