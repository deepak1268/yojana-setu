import { Topbar } from "@/components/dashboard/Topbar";

const stages = ["Submitted", "Under review", "Sent to partner", "Disbursed"] as const;

const applications = [
  { scheme: "Term Loan Scheme", partner: "SCA — District HQ", stage: 2 },
  { scheme: "Micro Finance Scheme", partner: "NBFC-MFI — Main Market", stage: 0 },
];

export default function ApplicationsPage() {
  return (
    <>
      <Topbar title="Applications" subtitle="Track where each application stands with your channel partner." />

      <div className="flex-1 space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        {applications.map((app) => (
          <div key={app.scheme} className="rounded-3xl border border-navy/10 bg-card p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-xl text-ink">{app.scheme}</p>
                <p className="mt-1 text-sm text-muted">{app.partner}</p>
              </div>
            </div>

            <ol className="mt-6 flex flex-wrap gap-x-2 gap-y-4">
              {stages.map((stage, i) => (
                <li key={stage} className="flex items-center gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                      i <= app.stage ? "bg-green text-white" : "bg-navy/8 text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-sm ${i <= app.stage ? "text-ink" : "text-muted"}`}>{stage}</span>
                  {i < stages.length - 1 && <span className="mx-1 h-px w-6 bg-navy/15" />}
                </li>
              ))}
            </ol>
          </div>
        ))}

        <div className="rounded-3xl border border-dashed border-navy/15 p-8 text-center">
          <p className="text-sm text-muted">No more applications yet.</p>
          <a href="/dashboard/recommender" className="mt-2 inline-block text-sm font-semibold text-saffron-deep">
            Start a new scheme match →
          </a>
        </div>
      </div>
    </>
  );
}
