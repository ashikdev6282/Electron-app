export default function MyDictations({ dictations }) {
  return (
    <div className="list">
      {dictations.map(d => (
        <div key={d.id} className="item">
          <span>{d.date}</span>
          <audio controls src={URL.createObjectURL(d.blob)} />
        </div>
      ))}
    </div>
  );
}