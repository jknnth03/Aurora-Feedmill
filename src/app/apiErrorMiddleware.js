import { isRejectedWithValue } from "@reduxjs/toolkit";

export const apiErrorMiddleware = (api) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const { enqueueSnackbar } = window.__snackbar__ || {};
    if (!enqueueSnackbar) return next(action);

    const status = action.payload?.status;
    const errors = action.payload?.data?.errors;

    const message =
      errors?.[0]?.title ||
      errors?.[0]?.detail ||
      action.payload?.data?.message ||
      "Something went wrong.";

    const variant =
      status >= 500 ? "error" : status >= 400 ? "warning" : "error";

    enqueueSnackbar(message, { variant });
  }

  return next(action);
};
