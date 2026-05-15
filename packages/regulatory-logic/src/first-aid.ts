/**
 * First-aid definition per 29 CFR 1904.7(b)(5)(ii).
 *
 * "First aid" means any of the following treatments:
 * (A)–(N) enumerated list. Any treatment NOT in this list is "medical treatment
 * beyond first aid" for purposes of 1904.7(a)(4).
 *
 * Receiving only first-aid treatments does NOT make a case recordable on the basis of
 * medical treatment. However, a case may still be recordable for other reasons
 * (days away, restricted work, loss of consciousness, etc.).
 */

import { FirstAidTreatment, BeyondFirstAidTreatment } from "./types.js";

const FIRST_AID_LABELS: Record<FirstAidTreatment, string> = {
  [FirstAidTreatment.NON_PRESCRIPTION_MED]:
    "(A) Use of nonprescription medications at nonprescription strength — 1904.7(b)(5)(ii)(A)",
  [FirstAidTreatment.TETANUS_IMMUNIZATION]:
    "(B) Administering tetanus immunizations — 1904.7(b)(5)(ii)(B)",
  [FirstAidTreatment.WOUND_CLEANING]:
    "(C) Cleaning, flushing, or soaking wounds on the surface of the body — 1904.7(b)(5)(ii)(C)",
  [FirstAidTreatment.WOUND_COVERING]:
    "(D) Use of nonprescription wound coverings (bandages, Band-Aids, gauze pads, butterfly bandages, Steri-strips) — 1904.7(b)(5)(ii)(D)",
  [FirstAidTreatment.HOT_COLD_THERAPY]:
    "(E) Hot or cold therapy — 1904.7(b)(5)(ii)(E)",
  [FirstAidTreatment.NON_RIGID_SUPPORT]:
    "(F) Any nonrigid means of support (elastic bandages, wraps, nonrigid back belts) — 1904.7(b)(5)(ii)(F)",
  [FirstAidTreatment.TEMPORARY_IMMOBILIZATION]:
    "(G) Temporary immobilization device used to transport accident victim (splints, slings, neck collars, back boards) — 1904.7(b)(5)(ii)(G)",
  [FirstAidTreatment.NAIL_BLISTER_DRAINAGE]:
    "(H) Drilling of a fingernail or toenail to relieve pressure, or draining fluid from a blister — 1904.7(b)(5)(ii)(H)",
  [FirstAidTreatment.EYE_PATCH]:
    "(I) Eye patches — 1904.7(b)(5)(ii)(I)",
  [FirstAidTreatment.EYE_FOREIGN_BODY_REMOVAL]:
    "(J) Removing foreign bodies from the eye using only irrigation or a cotton swab — 1904.7(b)(5)(ii)(J)",
  [FirstAidTreatment.SPLINTER_REMOVAL]:
    "(K) Removing splinters or foreign material from areas other than the eye by irrigation, tweezers, cotton swabs, or other simple means — 1904.7(b)(5)(ii)(K)",
  [FirstAidTreatment.FINGER_GUARD]:
    "(L) Use of finger guards — 1904.7(b)(5)(ii)(L)",
  [FirstAidTreatment.MASSAGE]:
    "(M) Use of massages — 1904.7(b)(5)(ii)(M). NOTE: physical therapy or chiropractic treatment is NOT first aid.",
  [FirstAidTreatment.HEAT_STRESS_FLUIDS]:
    "(N) Drinking fluids for relief of heat stress — 1904.7(b)(5)(ii)(N)",
};

const BEYOND_FIRST_AID_LABELS: Record<BeyondFirstAidTreatment, string> = {
  [BeyondFirstAidTreatment.PRESCRIPTION_MED]: "Prescription medications",
  [BeyondFirstAidTreatment.SUTURES]: "Sutures (stitches)",
  [BeyondFirstAidTreatment.STAPLES]: "Staples",
  [BeyondFirstAidTreatment.SURGERY]: "Surgery",
  [BeyondFirstAidTreatment.RIGID_SPLINT]: "Rigid splint or cast applied by a professional",
  [BeyondFirstAidTreatment.PHYSICAL_THERAPY]: "Physical therapy",
  [BeyondFirstAidTreatment.CHIROPRACTIC]: "Chiropractic treatment",
  [BeyondFirstAidTreatment.IRRIGATION_BEYOND_FIRST_AID]: "Irrigation beyond simple first aid",
  [BeyondFirstAidTreatment.DEBRIDEMENT]: "Debridement",
  [BeyondFirstAidTreatment.CAST]: "Cast application",
};

export interface MedicalTreatmentEvaluation {
  /** True if any treatment received goes beyond the 1904.7(b)(5)(ii) first-aid list. */
  isBeyondFirstAid: boolean;
  /** The beyond-first-aid treatments that triggered the determination. */
  triggeredBy: BeyondFirstAidTreatment[];
  cfr: string;
  notes: string;
}

/**
 * Evaluates whether the treatments received constitute "medical treatment beyond first aid"
 * under 29 CFR 1904.7(b)(5)(ii).
 *
 * Note: A case may have BOTH first-aid and beyond-first-aid treatments. The presence of
 * ANY beyond-first-aid treatment makes this criterion true.
 */
export function evaluateMedicalTreatment(
  beyondFirstAidTreatments: BeyondFirstAidTreatment[]
): MedicalTreatmentEvaluation {
  const triggered = beyondFirstAidTreatments.filter(
    (t) => t in BEYOND_FIRST_AID_LABELS
  );

  if (triggered.length > 0) {
    return {
      isBeyondFirstAid: true,
      triggeredBy: triggered,
      cfr: "29 CFR 1904.7(a)(4), 1904.7(b)(5)",
      notes: `Beyond-first-aid treatment(s) received: ${triggered.map((t) => BEYOND_FIRST_AID_LABELS[t]).join("; ")}.`,
    };
  }

  return {
    isBeyondFirstAid: false,
    triggeredBy: [],
    cfr: "29 CFR 1904.7(b)(5)(ii)",
    notes: "All treatments received are on the first-aid list in 1904.7(b)(5)(ii). Medical treatment criterion is NOT met.",
  };
}

/** Returns the regulatory label for a first-aid treatment. */
export function describeFirstAidTreatment(t: FirstAidTreatment): string {
  return FIRST_AID_LABELS[t];
}

/** Returns the regulatory label for a beyond-first-aid treatment. */
export function describeBeyondFirstAidTreatment(t: BeyondFirstAidTreatment): string {
  return BEYOND_FIRST_AID_LABELS[t];
}

/** The complete set of first-aid treatments per 1904.7(b)(5)(ii). */
export const ALL_FIRST_AID_TREATMENTS = Object.values(FirstAidTreatment);
