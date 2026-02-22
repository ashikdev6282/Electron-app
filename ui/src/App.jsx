import { useState } from "react";
import Dictate from "./pages/Dictate";
import MyDictations from "./pages/MyDictations";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [tab, setTab] = useState("dictate");

  return (
    <div className="app">
      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "dictate" && <Dictate />}
        {tab === "list" && <MyDictations />}
        {tab === "settings" && <Settings />}
      </div>

      {/* BOTTOM NAV */}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}