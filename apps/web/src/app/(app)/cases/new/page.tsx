"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  CaseOutcome,
  CaseType,
  PrivacyReason,
  SeverityLevel,
} from "@osha/regulatory-logic";

type WizardAnswer = boolean | number;

interface WizardAnswers {
  [stepId: string]: WizardAnswer;
}

const WIZARD_STEP_IDS = [
  "WORK_ENVIRONMENT",
  "WORK_RELATEDNESS_EXCEPTIONS",
  "NEW_CASE",
  "DEATH",
  "DAYS_AWAY",
  "RESTRICTED_WORK_OR_TRANSFER",
  "MEDICAL_TREATMENT_CHECK",
  "LOSS_OF_CONSCIOUSNESS",
  "SIGNIFICANT_INJURY_DIAGNOSIS",
  "SPECIAL_CASES",
] as const;

type StepId = (typeof WIZARD_STEP_IDS)[number];

const NUMERIC_STEPS = new Set<string>(["DAYS_AWAY"]);

const OUTCOME_OPTIONS = [
  { value: "DEATH", label: "G — Death" },
  { value: "DAYS_AWAY", label: "H — Days Away From Work" },
  { value: "RESTRICTED_TRANSFER", label: "I — Restricted Work or Job Transfer" },
  { value: "OTHER_RECORDABLE", label: "J — Other Recordable Case" },
];

const CASE_TYPE_OPTIONS = [
  { value: "INJURY", label: "M1 — Injury" },
  { value: "SKIN_DISORDER", label: "M2 — Skin Disorder" },
  { value: "RESPIRATORY", label: "M3 — Respiratory Condition" },
  { value: "POISONING", label: "M4 — Poisoning" },
  { value: "HEARING_LOSS", label: "M5 — Hearing Loss" },
  { value: "ALL_OTHER_ILLNESS", label: "M6 — All Other Illnesses" },
];

const PRIVACY_REASON_OPTIONS = [
  { value: "INTIMATE_BODY_PART", label: "Intimate body part or reproductive system — 1904.29(b)(7)(i)" },
  { value: "SEXUAL_ASSAULT", label: "Sexual assault — 1904.29(b)(7)(ii)" },
  { value: "MENTAL_ILLNESS", label: "Mental illness — 1904.29(b)(7)(iii)" },
  { value: "HIV_HEPATITIS_TB", label: "HIV infection, hepatitis, or tuberculosis — 1904.29(b)(7)(iv)" },
  { value: "NEEDLESTICK", label: "Needlestick or sharps injury — 1904.29(b)(7)(v)" },
  { value: "EMPLOYEE_REQUEST", label: "Employee voluntarily requests privacy — 1904.29(b)(7)(vi)" },
];

const SEVERITY_OPTIONS = [
  { value: "FATALITY", label: "Fatality (report within 8 hours — 1904.39(a)(1))" },
  { value: "HOSPITALIZATION", label: "In-patient hospitalization (report within 24 hours — 1904.39(a)(2)(i))" },
  { value: "AMPUTATION", label: "Amputation (report within 24 hours — 1904.39(a)(2)(ii))" },
  { value: "EYE_LOSS", label: "Loss of an eye (report within 24 hours — 1904.39(a)(2)(iii))" },
];

const EMPTY_FORM = {
  employeeName: "",
  employeeJobTitle: "",
  employeeDOB: "",
  employeeHireDate: "",
  employeeStreet: "",
  employeeCity: "",
  employeeState: "",
  employeeZip: "",
  dateOfInjury: "",
  timeOfInjury: "",
  whereEventOccurred: "",
  whatEmployeeWasDoing: "",
  whatHappened: "",
  bodyPartAffected: "",
  objectOrSubstance: "",
  treatedInEmergencyRoom: false,
  hospitalizedOvernight: false,
  physicianName: "",
  facilityName: "",
  facilityStreet: "",
  facilityCity: "",
  facilityState: "",
  facilityZip: "",
  outcome: "OTHER_RECORDABLE",
  daysAway: 0,
  daysRestricted: 0,
  caseType: "INJURY",
  isPrivacyCase: false,
  privacyReason: "",
  severityLevel: "",
  isRecordable: true,
};

export default function NewCasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportingYearId = searchParams.get("ryid") ?? "";

  const [step, setStep] = useState<"wizard" | "form">("wizard");
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswers>({});
  const [numericAnswer, setNumericAnswer] = useState("0");
  const [wizardResult, setWizardResult] = useState<{
    isRecordable: boolean;
    reason: string;
    notRecordableChoice?: "record_anyway" | "discard";
  } | null>(null);
  const [recordAnyway, setRecordAnyway] = useState(false);
  const [notRecordableNotes, setNotRecordableNotes] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: stepsData } = trpc.wizard.steps.useQuery();
  const createMutation = trpc.cases.create.useMutation({
    onSuccess: (created) => {
      const ry = reportingYearId;
      router.push(`/cases/${created.id}`);
    },
  });

  const currentStepId = WIZARD_STEP_IDS[wizardStepIndex];
  const currentStepDef = stepsData?.find((s) => s.id === currentStepId);

  function computeRecordability(answers: WizardAnswers): { isRecordable: boolean; reason: string } {
    if (answers["WORK_ENVIRONMENT"] === false) {
      return { isRecordable: false, reason: "Injury/illness did not occur in the work environment. Not work-related under 29 CFR 1904.5(a)." };
    }
    if (answers["WORK_RELATEDNESS_EXCEPTIONS"] === true) {
      return { isRecordable: false, reason: "A work-relatedness exception under 29 CFR 1904.5(b)(2) applies." };
    }
    if (answers["NEW_CASE"] === false) {
      return { isRecordable: false, reason: "Not a new case — update the existing 300 Log entry. 29 CFR 1904.6(a)." };
    }
    if (answers["DEATH"] === true) {
      return { isRecordable: true, reason: "Resulted in employee death. Recordable under 29 CFR 1904.7(a)(1)." };
    }
    const daysAway = typeof answers["DAYS_AWAY"] === "number" ? answers["DAYS_AWAY"] : 0;
    if (daysAway > 0) {
      return { isRecordable: true, reason: `Resulted in ${daysAway} day(s) away from work. Recordable under 29 CFR 1904.7(a)(2).` };
    }
    if (answers["RESTRICTED_WORK_OR_TRANSFER"] === true) {
      return { isRecordable: true, reason: "Resulted in restricted work or job transfer. Recordable under 29 CFR 1904.7(a)(3)." };
    }
    if (answers["MEDICAL_TREATMENT_CHECK"] === true) {
      return { isRecordable: true, reason: "Required medical treatment beyond first aid. Recordable under 29 CFR 1904.7(a)(4)." };
    }
    if (answers["LOSS_OF_CONSCIOUSNESS"] === true) {
      return { isRecordable: true, reason: "Resulted in loss of consciousness. Recordable under 29 CFR 1904.7(a)(5)." };
    }
    if (answers["SIGNIFICANT_INJURY_DIAGNOSIS"] === true) {
      return { isRecordable: true, reason: "Significant injury or illness diagnosed by LHCP. Recordable under 29 CFR 1904.7(a)(6)." };
    }
    if (answers["SPECIAL_CASES"] === true) {
      return { isRecordable: true, reason: "Special category case (needlestick, STS, or TB). Recordable under 29 CFR 1904.8, 1904.10, or 1904.11." };
    }
    return { isRecordable: false, reason: "Case does not meet any recording criterion under 29 CFR 1904.7." };
  }

  function handleWizardAnswer(answer: boolean | number) {
    const newAnswers = { ...wizardAnswers, [currentStepId]: answer };
    setWizardAnswers(newAnswers);

    const isLastStep = wizardStepIndex === WIZARD_STEP_IDS.length - 1;
    const shouldShortCircuit =
      (currentStepId === "WORK_ENVIRONMENT" && answer === false) ||
      (currentStepId === "WORK_RELATEDNESS_EXCEPTIONS" && answer === true) ||
      (currentStepId === "NEW_CASE" && answer === false) ||
      (currentStepId === "DEATH" && answer === true) ||
      (currentStepId === "DAYS_AWAY" && typeof answer === "number" && answer > 0) ||
      (currentStepId === "RESTRICTED_WORK_OR_TRANSFER" && answer === true) ||
      (currentStepId === "MEDICAL_TREATMENT_CHECK" && answer === true) ||
      (currentStepId === "LOSS_OF_CONSCIOUSNESS" && answer === true) ||
      (currentStepId === "SIGNIFICANT_INJURY_DIAGNOSIS" && answer === true) ||
      (currentStepId === "SPECIAL_CASES");

    if (isLastStep || shouldShortCircuit) {
      const result = computeRecordability(newAnswers);
      setWizardResult(result);
    } else {
      setWizardStepIndex((i) => i + 1);
      setNumericAnswer("0");
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.employeeName.trim()) errors.employeeName = "Required";
    if (!form.employeeJobTitle.trim()) errors.employeeJobTitle = "Required";
    if (!form.dateOfInjury) errors.dateOfInjury = "Required";
    if (!form.whereEventOccurred.trim()) errors.whereEventOccurred = "Required";
    if (!form.whatEmployeeWasDoing.trim()) errors.whatEmployeeWasDoing = "Required";
    if (!form.whatHappened.trim()) errors.whatHappened = "Required";
    if (!form.bodyPartAffected.trim()) errors.bodyPartAffected = "Required";
    if (!form.objectOrSubstance.trim()) errors.objectOrSubstance = "Required";
    if (!form.outcome) errors.outcome = "Required";
    if (!form.caseType) errors.caseType = "Required";
    if (form.isPrivacyCase && !form.privacyReason) errors.privacyReason = "Required for privacy cases";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    if (!reportingYearId) {
      alert("No reporting year selected. Please go back and select a year.");
      return;
    }

    const daysAway = wizardAnswers["DAYS_AWAY"];

    createMutation.mutate({
      reportingYearId,
      caseData: {
        employeeName: form.employeeName,
        employeeJobTitle: form.employeeJobTitle,
        employeeDOB: form.employeeDOB ? new Date(form.employeeDOB) : undefined,
        employeeHireDate: form.employeeHireDate ? new Date(form.employeeHireDate) : undefined,
        employeeStreet: form.employeeStreet || undefined,
        employeeCity: form.employeeCity || undefined,
        employeeState: form.employeeState || undefined,
        employeeZip: form.employeeZip || undefined,
        dateOfInjury: new Date(form.dateOfInjury),
        timeOfInjury: form.timeOfInjury || undefined,
        whereEventOccurred: form.whereEventOccurred,
        whatEmployeeWasDoing: form.whatEmployeeWasDoing,
        whatHappened: form.whatHappened,
        bodyPartAffected: form.bodyPartAffected,
        objectOrSubstance: form.objectOrSubstance,
        treatedInEmergencyRoom: form.treatedInEmergencyRoom,
        hospitalizedOvernight: form.hospitalizedOvernight,
        physicianName: form.physicianName || undefined,
        facilityName: form.facilityName || undefined,
        facilityStreet: form.facilityStreet || undefined,
        facilityCity: form.facilityCity || undefined,
        facilityState: form.facilityState || undefined,
        facilityZip: form.facilityZip || undefined,
        isPrivacyCase: form.isPrivacyCase,
        privacyReason: form.privacyReason ? (form.privacyReason as PrivacyReason) : undefined,
        outcome: form.outcome as CaseOutcome,
        daysAway: typeof daysAway === "number" ? daysAway : Number(form.daysAway),
        daysRestricted: Number(form.daysRestricted),
        caseType: form.caseType as CaseType,
        isRecordable: wizardResult?.isRecordable ?? true,
        wizardAnswers: JSON.stringify(wizardAnswers),
        severityLevel: form.severityLevel ? (form.severityLevel as SeverityLevel) : undefined,
      },
    });
  }

  if (step === "wizard") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Case</h1>
          <p className="mt-1 text-sm text-gray-500">Step 1 of 2 — Recordability Wizard</p>
        </div>

        {wizardResult ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div
              className={`rounded-lg p-4 ${
                wizardResult.isRecordable
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <p
                className={`text-lg font-bold ${
                  wizardResult.isRecordable ? "text-red-800" : "text-green-800"
                }`}
              >
                {wizardResult.isRecordable ? "RECORDABLE" : "NOT RECORDABLE"}
              </p>
              <p className={`mt-1 text-sm ${wizardResult.isRecordable ? "text-red-700" : "text-green-700"}`}>
                {wizardResult.reason}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Decision Path</h3>
              <ol className="space-y-2">
                {WIZARD_STEP_IDS.slice(0, wizardStepIndex + 1).map((sid) => {
                  const ans = wizardAnswers[sid];
                  if (ans === undefined) return null;
                  const stepDef = stepsData?.find((s) => s.id === sid);
                  return (
                    <li key={sid} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <div>
                        <span className="text-gray-600">{stepDef?.question.slice(0, 80)}…</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {typeof ans === "number" ? `${ans} day(s)` : ans ? "Yes" : "No"}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">{stepDef?.cfr}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {wizardResult.isRecordable ? (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("form")}
                  className="btn-primary"
                >
                  Proceed to Form 301 Entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {!recordAnyway ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setRecordAnyway(true);
                      }}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Record Anyway with Notes
                    </button>
                    <button
                      onClick={() => router.back()}
                      className="btn-danger"
                    >
                      Discard
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for recording a non-recordable case
                      </label>
                      <textarea
                        rows={3}
                        value={notRecordableNotes}
                        onChange={(e) => setNotRecordableNotes(e.target.value)}
                        className="form-input"
                        placeholder="e.g., Employer chooses to voluntarily record for internal tracking"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setForm((prev) => ({ ...prev, isRecordable: false }));
                          setStep("form");
                        }}
                        className="btn-primary"
                      >
                        Continue to Form 301
                      </button>
                      <button
                        onClick={() => setRecordAnyway(false)}
                        className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Step {wizardStepIndex + 1} of {WIZARD_STEP_IDS.length}
              </span>
              <div className="flex gap-1">
                {WIZARD_STEP_IDS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full ${
                      i < wizardStepIndex
                        ? "bg-blue-500"
                        : i === wizardStepIndex
                        ? "bg-blue-300"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                {currentStepDef?.cfr}
              </p>
              <p className="text-base font-medium text-gray-900">
                {currentStepDef?.question}
              </p>
              {currentStepDef?.hint && (
                <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-md p-3">
                  {currentStepDef.hint}
                </p>
              )}
            </div>

            {NUMERIC_STEPS.has(currentStepId) ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of days away (0 = none)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={numericAnswer}
                    onChange={(e) => setNumericAnswer(e.target.value)}
                    className="form-input max-w-[160px]"
                  />
                </div>
                <button
                  onClick={() => handleWizardAnswer(parseInt(numericAnswer, 10) || 0)}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleWizardAnswer(true)}
                  className="btn-primary px-8"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleWizardAnswer(false)}
                  className="px-8 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  No
                </button>
              </div>
            )}

            {wizardStepIndex > 0 && (
              <button
                onClick={() => {
                  setWizardStepIndex((i) => i - 1);
                  setWizardResult(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => setStep("wizard")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
          ← Back to Wizard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Case</h1>
        <p className="mt-1 text-sm text-gray-500">Step 2 of 2 — OSHA Form 301 Entry</p>
        {wizardResult && (
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            wizardResult.isRecordable ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
          }`}>
            {wizardResult.isRecordable ? "Recordable" : "Not Recordable (recording voluntarily)"}
          </div>
        )}
      </div>

      {createMutation.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {createMutation.error.message}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <fieldset className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <legend className="text-base font-semibold text-gray-900 mb-4">Employee Information</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input name="employeeName" value={form.employeeName} onChange={handleFormChange} required className="form-input" />
              {formErrors.employeeName && <p className="mt-1 text-xs text-red-600">{formErrors.employeeName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input name="employeeJobTitle" value={form.employeeJobTitle} onChange={handleFormChange} required className="form-input" />
              {formErrors.employeeJobTitle && <p className="mt-1 text-xs text-red-600">{formErrors.employeeJobTitle}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="employeeDOB" value={form.employeeDOB} onChange={handleFormChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired</label>
              <input type="date" name="employeeHireDate" value={form.employeeHireDate} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Street</label>
              <input name="employeeStreet" value={form.employeeStreet} onChange={handleFormChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="employeeCity" value={form.employeeCity} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input name="employeeState" value={form.employeeState} onChange={handleFormChange} maxLength={2} className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input name="employeeZip" value={form.employeeZip} onChange={handleFormChange} className="form-input" />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <legend className="text-base font-semibold text-gray-900 mb-4">Incident Information</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Injury/Illness <span className="text-red-500">*</span>
              </label>
              <input type="date" name="dateOfInjury" value={form.dateOfInjury} onChange={handleFormChange} required className="form-input" />
              {formErrors.dateOfInjury && <p className="mt-1 text-xs text-red-600">{formErrors.dateOfInjury}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time of Incident</label>
              <input type="time" name="timeOfInjury" value={form.timeOfInjury} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Where did the event occur? <span className="text-red-500">*</span>
              </label>
              <input name="whereEventOccurred" value={form.whereEventOccurred} onChange={handleFormChange} required className="form-input" placeholder="e.g., Shipping dock, Machine shop" />
              {formErrors.whereEventOccurred && <p className="mt-1 text-xs text-red-600">{formErrors.whereEventOccurred}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What was the employee doing just before the incident? <span className="text-red-500">*</span>
              </label>
              <textarea rows={2} name="whatEmployeeWasDoing" value={form.whatEmployeeWasDoing} onChange={handleFormChange} required className="form-input" />
              {formErrors.whatEmployeeWasDoing && <p className="mt-1 text-xs text-red-600">{formErrors.whatEmployeeWasDoing}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe the injury or illness <span className="text-red-500">*</span>
              </label>
              <textarea rows={3} name="whatHappened" value={form.whatHappened} onChange={handleFormChange} required className="form-input" />
              {formErrors.whatHappened && <p className="mt-1 text-xs text-red-600">{formErrors.whatHappened}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body part affected <span className="text-red-500">*</span>
              </label>
              <input name="bodyPartAffected" value={form.bodyPartAffected} onChange={handleFormChange} required className="form-input" />
              {formErrors.bodyPartAffected && <p className="mt-1 text-xs text-red-600">{formErrors.bodyPartAffected}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Object or substance that directly harmed <span className="text-red-500">*</span>
              </label>
              <input name="objectOrSubstance" value={form.objectOrSubstance} onChange={handleFormChange} required className="form-input" />
              {formErrors.objectOrSubstance && <p className="mt-1 text-xs text-red-600">{formErrors.objectOrSubstance}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <legend className="text-base font-semibold text-gray-900 mb-4">Medical Treatment</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="er" name="treatedInEmergencyRoom" checked={form.treatedInEmergencyRoom} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="er" className="text-sm text-gray-700">Treated in Emergency Room?</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="hosp" name="hospitalizedOvernight" checked={form.hospitalizedOvernight} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="hosp" className="text-sm text-gray-700">Hospitalized Overnight?</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Physician/LHCP Name</label>
              <input name="physicianName" value={form.physicianName} onChange={handleFormChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
              <input name="facilityName" value={form.facilityName} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility Street</label>
              <input name="facilityStreet" value={form.facilityStreet} onChange={handleFormChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility City</label>
              <input name="facilityCity" value={form.facilityCity} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input name="facilityState" value={form.facilityState} onChange={handleFormChange} maxLength={2} className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input name="facilityZip" value={form.facilityZip} onChange={handleFormChange} className="form-input" />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <legend className="text-base font-semibold text-gray-900 mb-4">Case Classification (300 Log)</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcome (Columns G–J) <span className="text-red-500">*</span>
              </label>
              <select name="outcome" value={form.outcome} onChange={handleFormChange} className="form-input">
                {OUTCOME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Away from Work (Col K)</label>
              <input type="number" name="daysAway" value={form.daysAway} onChange={handleFormChange} min={0} max={180} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Restricted/Transfer (Col L)</label>
              <input type="number" name="daysRestricted" value={form.daysRestricted} onChange={handleFormChange} min={0} max={180} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Type (Columns M1–M6) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CASE_TYPE_OPTIONS.map((ct) => (
                  <label key={ct.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="caseType"
                      value={ct.value}
                      checked={form.caseType === ct.value}
                      onChange={handleFormChange}
                      className="h-4 w-4 border-gray-300 text-blue-600"
                    />
                    {ct.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <legend className="text-base font-semibold text-gray-900 mb-4">Privacy — 29 CFR 1904.29(b)(7)</legend>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="privacy"
                name="isPrivacyCase"
                checked={form.isPrivacyCase}
                onChange={handleFormChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="privacy" className="text-sm font-medium text-gray-700">
                Is this a privacy concern case?
              </label>
            </div>
            {form.isPrivacyCase && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Privacy Reason <span className="text-red-500">*</span>
                </label>
                <select name="privacyReason" value={form.privacyReason} onChange={handleFormChange} className="form-input">
                  <option value="">Select reason…</option>
                  {PRIVACY_REASON_OPTIONS.map((pr) => (
                    <option key={pr.value} value={pr.value}>{pr.label}</option>
                  ))}
                </select>
                {formErrors.privacyReason && <p className="mt-1 text-xs text-red-600">{formErrors.privacyReason}</p>}
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <legend className="text-base font-semibold text-gray-900 mb-4">Severity — 29 CFR 1904.39</legend>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Did this result in a fatality, hospitalization, amputation, or loss of an eye?</p>
            <select name="severityLevel" value={form.severityLevel} onChange={handleFormChange} className="form-input">
              <option value="">No — not a severe injury</option>
              {SEVERITY_OPTIONS.map((sv) => (
                <option key={sv.value} value={sv.value}>{sv.label}</option>
              ))}
            </select>
            {form.severityLevel && (
              <div className="rounded-lg bg-red-50 border border-red-300 p-4">
                <p className="text-sm font-bold text-red-800">⚠ Mandatory OSHA Reporting Required — 29 CFR 1904.39</p>
                <p className="mt-1 text-sm text-red-700">
                  {form.severityLevel === "FATALITY"
                    ? "A fatality must be reported to OSHA within 8 hours of learning of the death."
                    : "An in-patient hospitalization, amputation, or loss of an eye must be reported to OSHA within 24 hours."}
                  {" "}
                  Call 1-800-321-OSHA (6742) or report online at osha.gov/pls/ser/serform.html.
                </p>
              </div>
            )}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? "Saving…" : "Save Case"}
          </button>
        </div>
      </form>
    </div>
  );
}
