export function StubScreen({ title, note }: { title: string; note: string }) {
  return (
    <section className="stub">
      <h1 className="stub__title">{title}</h1>
      <p className="stub__note">{note}</p>
    </section>
  );
}
