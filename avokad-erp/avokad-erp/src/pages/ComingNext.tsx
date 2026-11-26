export default function ComingNext({ title }: { title: string }) {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-ink-soft">This view is built in the next step.</p>
    </div>
  );
}
