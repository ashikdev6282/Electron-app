import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import FloatingButton from "./FloatingButton";
import "./main.css";

const hash = window.location.hash;

ReactDOM.createRoot(document.getElementById("root")).render(
  hash === "#/floating" ? <FloatingButton /> : <App />
);