"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface InvitePageProps {
  params: { token: string };
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const acceptMutation = trpc.invitations.accept.useMutation({
    onSuccess: (data) => {
      setAccepted(true);
      setTimeout(() => router.push(`/establishments/${data.establishmentId}`), 2000);
    },
  });

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 shadow p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-bold text-gray-900">You have been invited</h1>
          <p className="text-sm text-gray-600">
            Sign in first, then return to this link to accept the invitation.
          </p>
          <Link
            href={`/login?callbackUrl=/invite/${token}`}
            className="btn-primary inline-block"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-green-200 shadow p-8 max-w-md w-full text-center">
          <p className="text-green-700 font-semibold text-lg">
            Invitation accepted! Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-200 shadow p-8 max-w-md w-full space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Accept Invitation</h1>
        <p className="text-sm text-gray-600">
          Signed in as <strong>{session.user.email}</strong>. Click below to accept the
          invitation.
        </p>
        {acceptMutation.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {acceptMutation.error.message}
          </div>
        )}
        <button
          onClick={() => acceptMutation.mutate({ token })}
          disabled={acceptMutation.isPending}
          className="btn-primary w-full"
        >
          {acceptMutation.isPending ? "Accepting…" : "Accept Invitation"}
        </button>
      </div>
    </div>
  );
}
