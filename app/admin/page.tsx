import { redirect } from "next/navigation";
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
      />
      <AdminSubscribers />
    </div>
  );
}
