const pains = [
  {
    title: "Wrong scheme, wasted time",
    body: "Micro finance, term loans, and education loans look similar until you hit a ceiling of ₹1.40 lakh vs ₹50 lakh.",
  },
  {
    title: "No direct applications",
    body: "Funds move through a channel finance system — SCAs, PSBs, RRBs, and NBFC-MFIs. Applying to the wrong desk means delay.",
  },
  {
    title: "Partners you cannot use",
    body: "Even a nearby bank may be ineligible if utilisation is exhausted or asset quality is poor. Routing should respect that.",
  },
];

export function Problem() {
  return (
    <section className="border-y border-navy/8 bg-card/60">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl text-ink sm:text-4xl">
          Credit exists. Clarity does not.
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Beneficiaries with annual family income up to ₹5 lakh can access
          concessional products covering up to 90% of project or education cost.
          Finding the fit — and a partner who can process it — is still offline
          guesswork.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pains.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-navy/10 bg-cream p-6"
            >
              <h3 className="font-display text-xl text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
