import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { getServerClient } from "@/lib/trpc-server";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <p className="text-sm text-gray-600">
          Administration panel — user management and system configuration.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Signed in as {session.user.email} ({session.user.role})
        </p>
      </div>
    </div>
  );
}
