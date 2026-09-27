import { redirect } from "next/navigation";
import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import AdminSubscribers from "@/components/admin/AdminSubscribers";
import { getRunnerAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await getRunnerAccess();
  if (!access.authenticated) redirect("/sign-in");
  if (!access.isAdmin) redirect("/account");

  return (
    <div className="space-y-8">
      <ProductHeading
        eyebrow="Runner Admin"
        title="Subscriber Management"
        description="Search subscribers, grant manual access without payment, and revoke it when it's no longer needed."
        actions={<Link href="/admin/operations" className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-text hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:bg-surface-2">Operations center</Link>}
      />
      <AdminSubscribers />
    </div>
  );
}
