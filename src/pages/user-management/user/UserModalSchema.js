import * as yup from "yup";

export const addSchema = yup.object({
  role_id: yup.number().required("Role is required"),
  employee_id: yup.string().required("Employee ID is required"),
  first_name: yup.string().required("First name is required"),
  middle_name: yup.string().nullable(),
  last_name: yup.string().required("Last name is required"),
  suffix: yup.string().nullable(),
  position: yup.string().required("Position is required"),
  username: yup.string().required("Username is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Minimum 6 characters"),
});

export const editSchema = yup.object({
  role_id: yup.number().required("Role is required"),
  employee_id: yup.string().required("Employee ID is required"),
  first_name: yup.string().required("First name is required"),
  middle_name: yup.string().nullable(),
  last_name: yup.string().required("Last name is required"),
  suffix: yup.string().nullable(),
  position: yup.string().required("Position is required"),
  username: yup.string().required("Username is required"),
  password: yup.string().nullable(),
});
