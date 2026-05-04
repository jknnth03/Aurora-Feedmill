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
import Pests from "../pages/masterlist/pesttypes/PestTypes.jsx";
import InfestationLevels from "../pages/masterlist/infestation-levels/InfestationLevel.jsx";
import Units from "../pages/masterlist/units/Units.jsx";
import Wastages from "../pages/masterlist/wastages/Wastages.jsx";
import Scores from "../pages/masterlist/scores/Scores.jsx";
import Login from "../pages/login/Login.jsx";
import COBS from "../pages/checklist-form/COBS/COBSQuestionnaires.jsx";
import PestSheet from "../pages/checklist-form/PESTS/PestSheet.jsx";
import Birds from "../pages/checklist-form/BIRDS/BirdsQuestionnaires.jsx";
import StandaloneBirds from "../pages/birds/Birds.jsx";
import StandaloneCOBS from "../pages/cobs/COBS.jsx";
import StandalonePest from "../pages/pest/Pest.jsx";

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
      {
        id: "MASTERLIST.PESTS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.PESTS.path}`,
        element: <Pests />,
        handle: {
          permission: MODULES.MASTERLIST.children.PESTS.permissionId,
        },
      },
      {
        id: "MASTERLIST.INFESTATION_LEVELS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.INFESTATION_LEVELS.path}`,
        element: <InfestationLevels />,
        handle: {
          permission:
            MODULES.MASTERLIST.children.INFESTATION_LEVELS.permissionId,
        },
      },
      {
        id: "MASTERLIST.UNITS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.UNITS.path}`,
        element: <Units />,
        handle: {
          permission: MODULES.MASTERLIST.children.UNITS.permissionId,
        },
      },
      {
        id: "MASTERLIST.WASTAGES",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.WASTAGES.path}`,
        element: <Wastages />,
        handle: {
          permission: MODULES.MASTERLIST.children.WASTAGES.permissionId,
        },
      },
      {
        id: "MASTERLIST.SCORES",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.SCORES.path}`,
        element: <Scores />,
        handle: {
          permission: MODULES.MASTERLIST.children.SCORES.permissionId,
        },
      },

      {
        id: "QUESTIONNAIRES.COBS",
        path: `${MODULES.CHECKLISTFORM.path}/${MODULES.CHECKLISTFORM.children.COBS.path}`,
        element: <COBS />,
        handle: {
          permission: MODULES.CHECKLISTFORM.children.COBS.permissionId,
        },
      },
      {
        id: "QUESTIONNAIRES.PEST_SHEETS",
        path: `${MODULES.CHECKLISTFORM.path}/${MODULES.CHECKLISTFORM.children.PEST_SHEETS.path}`,
        element: <PestSheet />,
        handle: {
          permission: MODULES.CHECKLISTFORM.children.PEST_SHEETS.permissionId,
        },
      },
      {
        id: "QUESTIONNAIRES.BIRDS",
        path: `${MODULES.CHECKLISTFORM.path}/${MODULES.CHECKLISTFORM.children.BIRDS.path}`,
        element: <Birds />,
        handle: {
          permission: MODULES.CHECKLISTFORM.children.BIRDS.permissionId,
        },
      },

      {
        id: "BIRDS",
        path: MODULES.BIRDS.path,
        element: <StandaloneBirds />,
        handle: { permission: MODULES.BIRDS.permissionId },
      },
      {
        id: "COBS",
        path: MODULES.COBS.path,
        element: <StandaloneCOBS />,
        handle: { permission: MODULES.COBS.permissionId },
      },
      {
        id: "PEST",
        path: MODULES.PEST.path,
        element: <StandalonePest />,
        handle: { permission: MODULES.PEST.permissionId },
      },
    ],
  },
];
