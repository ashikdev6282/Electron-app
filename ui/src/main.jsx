import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import FloatingButton from "./FloatingButton";
import "./main.css";

const isFloating = window.location.hash === "#/floating";

// 🔥 ALWAYS RESET FIRST
document.body.classList.remove("floating");

if (isFloating) {
  document.body.classList.add("floating");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  isFloating ? <FloatingButton /> : <App />
);