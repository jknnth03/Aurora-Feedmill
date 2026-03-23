import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  components: {
    MuiTooltip: {
      defaultProps: {
        arrow: false,
        placement: "right",
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: "#f37925",
          color: "#ffffff",
          fontFamily: "Poppins, sans-serif",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderRadius: "8px",
          padding: "6px 12px 6px 20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          letterSpacing: "0.1px",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            left: "-5px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#ffc936",
          },
        },
      },
    },
  },
});

const MuiTheme = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default MuiTheme;
