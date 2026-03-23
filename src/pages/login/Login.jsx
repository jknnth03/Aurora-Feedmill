import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AuroraIcon2 from "../../assets/aurora2.png";
import AuroraIcon from "../../assets/aurora.svg";
import LoginIllustration from "../../assets/login-illustration.jpg";
import "./Login.scss";
import { setCredentials } from "../../app/authSlice";
import { loginSchema } from "./loginSchema";
import { useLoginMutation } from "../../features/api/login/loginApiSlice";

const LABEL = "LOGIN";
const LOADING_LABEL = "Logging in...";

const WaveText = ({ text, animating }) => (
  <span className="wave-text">
    {text.split("").map((char, i) => (
      <span
        key={i}
        className="wave-text__char"
        style={animating ? { animationDelay: `${i * 60}ms` } : {}}>
        {char === " " ? "\u00A0" : char}
      </span>
    ))}
  </span>
);

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [login, { isLoading }] = useLoginMutation();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (form) => {
    try {
      const response = await login(form).unwrap();
      dispatch(
        setCredentials({
          user: response.data.user,
          token: response.data.token,
        }),
      );
      enqueueSnackbar(response.message || "Login successful.", {
        variant: "success",
      });
      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__left-brand">
          <img src={AuroraIcon2} alt="Aurora2" />
          <h1>
            Aurora <span className="sub">Feedmill</span>
          </h1>
          <p>Illuminates TSQA quality assurance.</p>
        </div>
        <img
          src={LoginIllustration}
          alt="Checklist Illustration"
          className="login__illustration"
        />
      </div>

      <div className="login__right">
        <div className="login__form-wrap">
          <div className="login__brand">
            <img src={AuroraIcon} alt="Aurora" />
            <span>
              Aurora <span className="sub">Feedmill</span>
            </span>
          </div>

          <h2 className="login__title">User Login</h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="login__field">
              <div className="login__input-wrap">
                <label className="login__label">
                  Username
                  <span className="required">
                    <PushPinIcon />
                  </span>
                </label>
                <PersonIcon className="field-icon" />
                <input
                  type="text"
                  {...register("username")}
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="login__error">
                  <ReportProblemIcon />
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="login__field">
              <div className="login__input-wrap">
                <label className="login__label">
                  Password
                  <span className="required">
                    <PushPinIcon />
                  </span>
                </label>
                <LockOutlinedIcon className="field-icon" />
                <input
                  type={showPass ? "text" : "password"}
                  {...register("password")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass((p) => !p)}>
                  {showPass ? (
                    <VisibilityOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="login__error">
                  <ReportProblemIcon />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`login__btn${isLoading ? " login__btn--loading" : ""}`}
              disabled={isLoading}>
              <WaveText
                text={isLoading ? LOADING_LABEL : LABEL}
                animating={isLoading}
              />
            </button>
          </form>

          <p className="login__footer">© 2026 MIS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
