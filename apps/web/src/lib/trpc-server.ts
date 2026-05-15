/**
 * Server-side tRPC caller — for use in Server Components and Route Handlers.
 *
 * Usage:
 *   import { serverClient } from "@/lib/trpc-server";
 *   const data = await serverClient.cases.list({ reportingYearId: "..." });
 */

import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

export async function getServerClient() {
  const session = await getServerSession(authOptions);
  const ctx = await createInnerTRPCContext(session);
  return appRouter.createCaller(ctx);
}
