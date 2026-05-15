import { router } from "../trpc.js";
import { usersRouter } from "./users.js";
import { establishmentsRouter } from "./establishments.js";
import { reportingYearsRouter } from "./reportingYears.js";
import { casesRouter } from "./cases.js";
import { wizardRouter } from "./wizard.js";
import { formsRouter } from "./forms.js";
import { metricsRouter } from "./metrics.js";
import { exportRouter } from "./export.js";
import { itaCheckRouter } from "./itaCheck.js";
import { auditRouter } from "./audit.js";

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
});

export type AppRouter = typeof appRouter;
