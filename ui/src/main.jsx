import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Login from "./pages/Login";
import Dictate from "./pages/Dictate";
import FloatingRecorder from "./pages/FloatingRecorder";
import "./main.css";
import { Toaster } from "sonner";

function Root() {
  const [hash, setHash] = useState(window.location.hash || "#login");

  /* ✅ FORCE DEFAULT ROUTE (FIX BLACK SCREEN) */
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "#login";
    }
  }, []);

  /* 🔥 HASH CHANGE */
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || "#login");
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  /* 🔥 ✅ ELECTRON NAVIGATION SYNC */
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onNavigate((route) => {
      if (route === "dictate") window.location.hash = "#dictate";
      if (route === "mini") window.location.hash = "#mini";
      if (route === "login") window.location.hash = "#login";
    });
  }, []);

  /* 🔥 DEBUG (REMOVE LATER) */
  useEffect(() => {
    console.log("CURRENT HASH:", hash);
  }, [hash]);

  /* 🔥 FLOATING CLASS */
  useEffect(() => {
    document.body.classList.toggle("floating", hash === "#mini");
  }, [hash]);

  /* 🔥 SAFE ROUTING */
  let Component;

  switch (hash) {
    case "#mini":
      Component = FloatingRecorder;
      break;
    case "#dictate":
      Component = Dictate;
      break;
    case "#login":
    default:
      Component = Login;
  }

  return (
    <>
      <Component />
      <Toaster richColors position="top-center" />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);