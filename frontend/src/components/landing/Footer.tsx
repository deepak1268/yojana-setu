import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-navy/10 bg-navy text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:px-6 md:flex-row md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Yojana Setu Logo"
              width={36}
              height={36}
              className="h-8 w-auto rounded-lg object-contain bg-cream/90 p-0.5"
            />
            <p className="font-display text-xl">Yojana Setu</p>
          </div>
          <p className="mt-2 max-w-sm text-sm text-cream/65">
            AI-driven scheme matching for marginalized entrepreneurs. A Smart
            India Hackathon prototype — not an official government portal.
          </p>
        </div>
        <div className="text-sm text-cream/70">
          <p>Channel partners: SCAs · PSBs · RRBs · NBFC-MFIs</p>
          <p className="mt-2">
            Inspired by concessional channel-finance products for eligible SC
            beneficiaries (family income up to ₹5 lakh).
          </p>
        </div>
      </div>
    </footer>
  );
}
