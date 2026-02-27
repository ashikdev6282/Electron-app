import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import FloatingRecorder from "./components/FloatingRecorder.jsx";
import "./main.css";

// 🔥 FIX: match Electron hash
const isRecorder = window.location.hash === "#recorder";

document.body.classList.remove("floating");
if (isRecorder) document.body.classList.add("floating");

ReactDOM.createRoot(document.getElementById("root")).render(
  isRecorder ? <FloatingRecorder /> : <App />
);