export default function MyDictations({ dictations }) {
  return (
    <div className="h-full bg-black flex justify-center pt-8 text-white">
      <div className="w-full max-w-105 px-4">

        <h1 className="text-2xl font-semibold mb-6">
          My Dictations
        </h1>

        {dictations.length === 0 && (
          <p className="text-zinc-500 text-center mt-20">
            No dictations yet
          </p>
        )}

        <div className="flex flex-col gap-4">
          {dictations.map(d => (
            <div
              key={d.id}
              className="bg-[#111] rounded-xl p-4"
            >
              <div className="text-sm text-zinc-400 mb-2">
                {d.createdAt}
              </div>

              <audio
                controls
                src={d.url}
                className="w-full"
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}