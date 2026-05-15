import { router } from "../trpc";
import { usersRouter } from "./users";
import { establishmentsRouter } from "./establishments";
import { reportingYearsRouter } from "./reportingYears";
import { casesRouter } from "./cases";
import { wizardRouter } from "./wizard";
import { formsRouter } from "./forms";
import { metricsRouter } from "./metrics";
import { exportRouter } from "./export";
import { itaCheckRouter } from "./itaCheck";
import { auditRouter } from "./audit";
import { invitationsRouter } from "./invitations";

export const appRouter = router({
  users: usersRouter,
  establishments: establishmentsRouter,
  reportingYears: reportingYearsRouter,
  cases: casesRouter,
  wizard: wizardRouter,
  forms: formsRouter,
  metrics: metricsRouter,
  export: exportRouter,
  itaCheck: itaCheckRouter,
  audit: auditRouter,
  invitations: invitationsRouter,
});

export type AppRouter = typeof appRouter;
