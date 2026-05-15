/**
 * Recordability wizard router.
 *
 * Exposes the regulatory-logic wizard as a stateless API endpoint.
 * The full decision path is returned so the UI can display each step
 * and the client can store wizardAnswers on the Case for the audit trail.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import {
  evaluateRecordability,
  WorkRelatednessException,
  BeyondFirstAidTreatment,
  FirstAidTreatment,
} from "@osha/regulatory-logic";

export const wizardRouter = router({
  /**
   * Evaluate recordability for a complete set of wizard answers.
   * Returns the full decision path and final determination.
   */
  evaluate: protectedProcedure
    .input(
      z.object({
        inWorkEnvironment: z.boolean(),
        workRelatednessExceptions: z.array(
          z.nativeEnum(WorkRelatednessException)
        ),
        isNewCase: z.boolean(),
        resultedInDeath: z.boolean(),
        daysAwayFromWork: z.number().int().min(0).max(180),
        daysOfRestrictedWork: z.number().int().min(0).max(180),
        daysOfJobTransfer: z.number().int().min(0).max(180),
        receivedMedicalTreatment: z.boolean(),
        firstAidTreatmentsOnly: z.array(z.nativeEnum(FirstAidTreatment)),
        beyondFirstAidTreatments: z.array(z.nativeEnum(BeyondFirstAidTreatment)),
        resultedInLossOfConsciousness: z.boolean(),
        diagnosedSignificantInjury: z.boolean(),
        isNeedlestickWithBloodOrOPIM: z.boolean(),
        isAudiogramConfirmedSTS: z.boolean(),
        isWorkRelatedTBDiagnosis: z.boolean(),
      })
    )
    .query(({ input }) => {
      return evaluateRecordability(input);
    }),

  /** Return the list of wizard step definitions (questions + CFR citations). */
  steps: protectedProcedure.query(() => {
    // Import wizard step metadata
    const { WIZARD_STEPS } = require("@osha/regulatory-logic");
    return WIZARD_STEPS as typeof import("@osha/regulatory-logic").WIZARD_STEPS;
  }),

  /** Return all first-aid treatments (for the UI checklist). */
  firstAidList: protectedProcedure.query(() => {
    return Object.values(FirstAidTreatment).map((t) => ({
      value: t,
      label: t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }),

  /** Return all work-relatedness exceptions. */
  exceptions: protectedProcedure.query(() => {
    return Object.values(WorkRelatednessException).map((e) => ({
      value: e,
      label: e.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }),
});
