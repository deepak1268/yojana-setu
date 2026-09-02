const features = [
  {
    kicker: "01",
    title: "Smart scheme recommender",
    body: "Enter project type, estimated cost, income, and education status. A rules-plus-AI engine ranks micro finance, term loan, or education credit — with eligibility reasons you can actually read.",
  },
  {
    kicker: "02",
    title: "Financial calculator",
    body: "Project EMIs using scheme caps, rates from 6.5% to 15%, and moratoriums of 3–12 months. See what “concessional” means in rupees before you apply.",
  },
  {
    kicker: "03",
    title: "Geo partner locator & router",
    body: "Map the nearest SCA, bank, or NBFC-MFI that is eligible for your scheme and still has utilisation headroom — so applications are not sent to partners with high NPAs or overdues.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-16 mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20"
    >
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          One platform between beneficiaries and channelising agencies.
        </h2>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.kicker}
            className="flex flex-col rounded-3xl bg-navy p-7 text-cream"
          >
            <span className="font-display text-sm text-saffron">{f.kicker}</span>
            <h3 className="mt-4 font-display text-2xl">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/75">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
