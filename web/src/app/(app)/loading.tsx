/** A shared boundary lets navigation show feedback while server data resolves. */
export default function AppLoading() {
  return (
    <div data-route-loading role="status" className="py-12 text-sm text-ink-soft">
      Loading…
    </div>
  );
}
