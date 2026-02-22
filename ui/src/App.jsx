import { useState } from "react";
import Dictate from "./pages/Dictate";
import MyDictations from "./pages/MyDictations";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [tab, setTab] = useState("dictate");
  const [dictations, setDictations] = useState([]);

  return (
    <div className="h-full bg-black">
      <div className="pb-16">
        {tab === "dictate" && (
          <Dictate onSaveDictation={setDictations} />
        )}

        {tab === "list" && (
          <MyDictations dictations={dictations} />
        )}

        {tab === "settings" && <Settings />}
      </div>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}