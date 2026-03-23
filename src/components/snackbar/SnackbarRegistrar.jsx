import { useSnackbar } from "notistack";
import { useEffect } from "react";

const SnackbarRegistrar = () => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    window.__snackbar__ = { enqueueSnackbar };
  }, [enqueueSnackbar]);

  return null;
};

export default SnackbarRegistrar;
