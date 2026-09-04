const steps = [
  {
    n: "1",
    title: "Tell us the need",
    body: "Project type, cost, family income, and education status — in the language you prefer.",
  },
  {
    n: "2",
    title: "Get a ranked match",
    body: "The engine explains why a micro, term, or education product fits — and what does not.",
  },
  {
    n: "3",
    title: "Run the numbers",
    body: "EMI, interest band, moratorium, and maximum cover before you travel to a branch.",
  },
  {
    n: "4",
    title: "Route to a live partner",
    body: "Nearest eligible SCA, bank, or NBFC-MFI with utilisation capacity, not just a pin on a map.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-[25vh] border-y border-navy/8 bg-card/70"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          From confusion to a counter that can say yes.
        </h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="relative">
              <span className="font-display text-4xl text-saffron/80">{s.n}</span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
