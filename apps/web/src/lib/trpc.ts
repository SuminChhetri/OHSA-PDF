/**
 * Client-side tRPC setup.
 *
 * Usage in React components:
 *   import { trpc } from "@/lib/trpc";
 *   const { data } = trpc.cases.list.useQuery({ reportingYearId: "..." });
 */

import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@/server/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
