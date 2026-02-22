export default function FloatingButton() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4f46e5, #6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        WebkitAppRegion: "drag",
        userSelect: "none"
      }}
    >
      {/* Clickable center */}
      <div
        onClick={() => window.electronAPI.openMainWindow()}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "white",
          cursor: "pointer",

          WebkitAppRegion: "no-drag"
        }}
      />
    </div>
  );
}