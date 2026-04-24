export default function DiscardPopup({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111] rounded-2xl p-6 w-[90%] max-w-sm text-white shadow-xl">
        <h2 className="text-lg font-semibold mb-2">
          Discard Recording?
        </h2>

        <p className="text-gray-400 text-sm mb-6">
          Are you sure you want to discard this recording? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="text-blue-400"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="text-red-500"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}