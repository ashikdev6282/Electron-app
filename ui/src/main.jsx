import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import FloatingRecorder from "./components/FloatingRecorder";
import "./main.css";

const isRecorder = window.location.hash === "#/recorder";

document.body.classList.remove("floating");
if (isRecorder) document.body.classList.add("floating");

ReactDOM.createRoot(document.getElementById("root")).render(
  isRecorder ? <FloatingRecorder /> : <App />
);