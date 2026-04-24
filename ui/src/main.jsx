import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Login from "./pages/Login";
import Dictate from "./pages/Dictate";
import FloatingRecorder from "./pages/FloatingRecorder";
import "./main.css";
import { Toaster } from "sonner";

function Root() {
  const [hash, setHash] = useState(window.location.hash || "#login");

  /* 🔥 HANDLE HASH CHANGE */
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || "#login");
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  /* 🔥 APPLY FLOATING CLASS SAFELY */
  useEffect(() => {
    document.body.classList.toggle("floating", hash === "#mini");
  }, [hash]);

  /* 🔥 ROUTING */
  let Component;

  if (hash === "#mini") {
    Component = FloatingRecorder;
  } else if (hash === "#dictate") {
    Component = Dictate;
  } else {
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