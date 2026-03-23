import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App";
import { ThemeProvider } from "../src/styles/Themecontext";
import MuiTheme from "../src/styles/MuiTheme";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ThemeProvider>
      <MuiTheme>
        <App />
      </MuiTheme>
    </ThemeProvider>
  </StrictMode>,
);
