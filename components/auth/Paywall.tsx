import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";

export default function Paywall({ feature }: { feature: string }) {
  return (
    <div className="space-y-7">
      <ProductHeading
        eyebrow="Runner Access"
        title={`${feature} is a Runner Pro feature`}
        description="This part of the platform is included with Runner Pro or Runner Command. Your account doesn't currently have an active plan."
      />
      <section className="data-panel flex flex-col items-start gap-4 p-6">
        <p className="text-sm text-text-muted">
          Upgrade to unlock {feature.toLowerCase()}, along with the rest of the Runner intelligence platform.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className="rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase tracking-wider text-white">
            View plans
          </Link>
          <Link href="/account" className="rounded-lg border border-border px-4 py-3 text-xs font-black uppercase tracking-wider text-text">
            Manage account
          </Link>
        </div>
      </section>
    </div>
  );
}
