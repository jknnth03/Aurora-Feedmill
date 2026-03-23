import { RouterProvider } from "react-router";
import router from "./router.jsx";
import { Provider, useDispatch, useSelector } from "react-redux";
import { SnackbarProvider } from "notistack";
import { store } from "../app/store.js";
import SnackbarRegistrar from "../components/snackbar/SnackbarRegistrar.jsx";
import LogoutTransition from "../components/accountmenu/Logouttransition.jsx";
import { clearCredentials, selectIsLoggingOut } from "../app/authSlice.js";

const LogoutHandler = () => {
  const dispatch = useDispatch();
  const isLoggingOut = useSelector(selectIsLoggingOut);

  const handleTransitionComplete = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.navigate("/login").then(() => {
      dispatch(clearCredentials());
    });
  };

  if (!isLoggingOut) return null;
  return <LogoutTransition onComplete={handleTransitionComplete} />;
};

const Providers = () => {
  return (
    <Provider store={store}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <SnackbarRegistrar />
        <RouterProvider router={router} />
        <LogoutHandler />
      </SnackbarProvider>
    </Provider>
  );
};

export default Providers;
