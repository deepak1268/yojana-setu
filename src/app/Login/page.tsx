export default function Login() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-saffron/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-green/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-foreground/10 bg-card shadow-[0_24px_80px_rgba(18,32,51,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-navy p-10 text-cream lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-saffron/30" />
          <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[28px] border-green/25" />

          <div className="relative">
            <a href="/" className="inline-flex items-center gap-3 font-[var(--font-fraunces)] text-2xl font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron text-lg text-white shadow-lg shadow-saffron/20">YS</span>
              Yojana Setu
            </a>
            <div className="mt-20 max-w-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-saffron">Your next opportunity</p>
              <h2 className="font-[var(--font-fraunces)] text-5xl leading-[1.05]">A clearer path to support.</h2>
              <p className="mt-6 text-sm leading-7 text-cream/65">Find government schemes that match your goals, understand your options, and move forward with confidence.</p>
            </div>
          </div>

          <div className="relative flex items-center gap-3 text-xs text-cream/55">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-cream/20 text-green">✓</span>
            Built for your journey
          </div>
        </aside>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-9 flex items-center justify-between lg:hidden">
            <a href="/" className="inline-flex items-center gap-2 font-[var(--font-fraunces)] text-2xl font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-saffron text-sm text-white">YS</span>
              Yojana Setu
            </a>
            <span className="rounded-full bg-green/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green">Secure access</span>
          </div>

          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-green">Welcome back</p>
              <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold tracking-tight sm:text-5xl">Pick up where you left off.</h1>
              <p className="mt-3 text-sm leading-6 text-muted">Login to continue to your Yojana Setu account.</p>
            </div>

            <form className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email address</label>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-saffron">@</span>
                  <input id="email" name="email" type="email" placeholder="you@example.com" required className="w-full rounded-xl border border-foreground/15 bg-background py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-saffron focus:ring-4 focus:ring-saffron/10" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold">Password</label>
                  <a href="#" className="text-xs font-semibold text-saffron transition hover:text-saffron-deep">Forgot password?</a>
                </div>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-green">▣</span>
                  <input id="password" name="password" type="password" placeholder="Enter your password" required className="w-full rounded-xl border border-foreground/15 bg-background py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-green focus:ring-4 focus:ring-green/10" />
                </div>
              </div>

              <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-saffron px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-saffron/20 transition hover:-translate-y-0.5 hover:bg-saffron-deep active:translate-y-0">
                Login <span aria-hidden="true" className="text-lg leading-none">→</span>
              </button>
            </form>

            <div className="mt-8 flex items-center gap-3 rounded-xl border border-green/15 bg-green/5 px-4 py-3 text-xs text-muted">
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green text-sm font-bold text-white">✓</span>
              Your information stays private and secure.
            </div>

            <div className="mt-8 border-t border-foreground/10 pt-6 text-center">
              <p className="text-sm text-muted">Don&apos;t have an account? <a href="/signup" className="font-bold text-foreground underline decoration-saffron decoration-2 underline-offset-4">Create an account</a></p>
            </div>
            <div className="mt-6 text-center">
              <a href="/" className="text-sm font-medium text-muted transition hover:text-foreground">← Back to home</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}