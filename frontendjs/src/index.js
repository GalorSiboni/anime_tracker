import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import suppressConsoleErrors from "./utils/errorSuppression";

// Suppress non-critical console errors in production
suppressConsoleErrors();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
