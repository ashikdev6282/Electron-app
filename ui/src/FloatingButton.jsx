export default function FloatingButton() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "#4f46e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        WebkitAppRegion: "drag",   // 🔥 DRAG AREA
        userSelect: "none"
      }}
    >
      <button
        onClick={() => window.electronAPI.openMainWindow()}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",

          WebkitAppRegion: "no-drag" // 🔥 CLICK AREA
        }}
      >
        🎙
      </button>
    </div>
  );
}