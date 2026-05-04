import React from "react";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import GamepadIcon from "@mui/icons-material/Gamepad";
import SecurityIcon from "@mui/icons-material/Security";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ViewListIcon from "@mui/icons-material/ViewList";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SanitizerIcon from "@mui/icons-material/Sanitizer";
import MapIcon from "@mui/icons-material/Map";
import BugReportIcon from "@mui/icons-material/BugReport";
import WarningIcon from "@mui/icons-material/Warning";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import StarIcon from "@mui/icons-material/Star";

export const iconStyles = {
  main: { fontSize: "22px" },
  mainMedium: { fontSize: "24px" },
  mainLarge: { fontSize: "26px" },
  mainExtraLarge: { fontSize: "28px" },
  child: { fontSize: "18px" },
  button: { fontSize: "18px" },
  sync: { fontSize: "20px" },
};

export const imageStyles = {
  noData: { width: "120px", height: "120px" },
};

export const MODULES = {
  LOGIN: {
    name: "Login",
    permissionId: "LOGIN",
    displayName: "Login",
    path: "/login",
    icon: null,
    children: null,
  },

  DASHBOARD: {
    name: "Dashboard",
    permissionId: "DASHBOARD",
    displayName: "Dashboard",
    path: "/",
    icon: <SpaceDashboardIcon sx={iconStyles.main} />,
    children: null,
  },

  USERMANAGEMENT: {
    name: "User Management",
    permissionId: "USERMANAGEMENT",
    displayName: "User Management",
    path: "/usermanagement",
    icon: <ManageAccountsIcon sx={iconStyles.main} />,
    children: {
      USERS: {
        name: "Users",
        permissionId: "USERMANAGEMENT.USERS",
        displayName: "Users",
        path: "users",
        icon: <PersonAddIcon sx={iconStyles.child} />,
      },
      ROLES: {
        name: "Roles",
        permissionId: "USERMANAGEMENT.ROLES",
        displayName: "Roles",
        path: "roles",
        icon: <GamepadIcon sx={iconStyles.child} />,
      },
      PERMISSIONS: {
        name: "Permissions",
        permissionId: "USERMANAGEMENT.PERMISSIONS",
        displayName: "Permissions",
        path: "permissions",
        icon: <SecurityIcon sx={iconStyles.child} />,
      },
    },
  },

  MASTERLIST: {
    name: "Masterlist",
    permissionId: "MASTERLIST",
    displayName: "Masterlist",
    path: "/masterlist",
    icon: <ListAltIcon sx={iconStyles.main} />,
    children: {
      CHECKLIST: {
        name: "Checklist",
        permissionId: "MASTERLIST.CHECKLIST",
        displayName: "Checklist",
        path: "checklist",
        icon: <ChecklistIcon sx={iconStyles.child} />,
      },
      SECTIONS: {
        name: "Sections",
        permissionId: "MASTERLIST.SECTIONS",
        displayName: "Sections",
        path: "sections",
        icon: <ViewListIcon sx={iconStyles.child} />,
      },
      INSPECTION_AREAS: {
        name: "Inspection Areas",
        permissionId: "MASTERLIST.INSPECTION_AREAS",
        displayName: "Inspection Areas",
        path: "inspection-areas",
        icon: <MapIcon sx={iconStyles.child} />,
      },
      PESTS: {
        name: "Pest Types",
        permissionId: "MASTERLIST.PESTS",
        displayName: "Pest Types",
        path: "pests",
        icon: <BugReportIcon sx={iconStyles.child} />,
      },
      INFESTATION_LEVELS: {
        name: "Infestation Levels",
        permissionId: "MASTERLIST.INFESTATION_LEVELS",
        displayName: "Infestation Levels",
        path: "infestation-levels",
        icon: <WarningIcon sx={iconStyles.child} />,
      },
      UNITS: {
        name: "Units",
        permissionId: "MASTERLIST.UNITS",
        displayName: "Units",
        path: "units",
        icon: <SquareFootIcon sx={iconStyles.child} />,
      },
      WASTAGES: {
        name: "Wastages",
        permissionId: "MASTERLIST.WASTAGES",
        displayName: "Wastages",
        path: "wastages",
        icon: <DeleteSweepIcon sx={iconStyles.child} />,
      },
      SCORES: {
        name: "Scores",
        permissionId: "MASTERLIST.SCORES",
        displayName: "Scores",
        path: "scores",
        icon: <StarIcon sx={iconStyles.child} />,
      },
    },
  },

  CHECKLISTFORM: {
    name: "Questionnaires",
    permissionId: "QUESTIONNAIRES",
    displayName: "Questionnaires",
    path: "/checklist-form",
    icon: <AssignmentIcon sx={iconStyles.main} />,
    children: {
      COBS: {
        name: "COBS",
        permissionId: "QUESTIONNAIRES.COBS",
        displayName: "COBS",
        path: "cobs",
        icon: <SanitizerIcon sx={iconStyles.child} />,
      },
      PEST_SHEETS: {
        name: "Pest",
        permissionId: "QUESTIONNAIRES.PEST_SHEETS",
        displayName: "Pest",
        path: "pest-sheets",
        icon: <BugReportIcon sx={iconStyles.child} />,
      },
      BIRDS: {
        name: "Birds",
        permissionId: "QUESTIONNAIRES.BIRDS",
        displayName: "Birds",
        path: "birds",
        icon: <FlutterDashIcon sx={iconStyles.child} />,
      },
    },
  },

  BIRDS: {
    name: "Birds",
    permissionId: "BIRDS",
    displayName: "Birds",
    path: "/birds",
    icon: <FlutterDashIcon sx={iconStyles.main} />,
    children: null,
  },

  COBS: {
    name: "COBS",
    permissionId: "COBS",
    displayName: "COBS",
    path: "/cobs",
    icon: <SanitizerIcon sx={iconStyles.main} />,
    children: null,
  },

  PEST: {
    name: "Pest",
    permissionId: "PEST",
    displayName: "Pest",
    path: "/pest",
    icon: <BugReportIcon sx={iconStyles.main} />,
    children: null,
  },
};
