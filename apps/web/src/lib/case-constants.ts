export const OUTCOME_LABELS: Record<string, string> = {
  DEATH: "G — Death",
  DAYS_AWAY: "H — Days Away From Work",
  RESTRICTED_TRANSFER: "I — Restricted Work or Job Transfer",
  OTHER_RECORDABLE: "J — Other Recordable Case",
};

export const OUTCOME_OPTIONS = [
  { value: "DEATH", label: "G — Death" },
  { value: "DAYS_AWAY", label: "H — Days Away From Work" },
  { value: "RESTRICTED_TRANSFER", label: "I — Restricted Work or Job Transfer" },
  { value: "OTHER_RECORDABLE", label: "J — Other Recordable Case" },
];

export const CASE_TYPE_LABELS: Record<string, string> = {
  INJURY: "M1 — Injury",
  SKIN_DISORDER: "M2 — Skin Disorder",
  RESPIRATORY: "M3 — Respiratory Condition",
  POISONING: "M4 — Poisoning",
  HEARING_LOSS: "M5 — Hearing Loss",
  ALL_OTHER_ILLNESS: "M6 — All Other Illnesses",
};

export const CASE_TYPE_OPTIONS = [
  { value: "INJURY", label: "M1 — Injury" },
  { value: "SKIN_DISORDER", label: "M2 — Skin Disorder" },
  { value: "RESPIRATORY", label: "M3 — Respiratory Condition" },
  { value: "POISONING", label: "M4 — Poisoning" },
  { value: "HEARING_LOSS", label: "M5 — Hearing Loss" },
  { value: "ALL_OTHER_ILLNESS", label: "M6 — All Other Illnesses" },
];

export const PRIVACY_REASON_LABELS: Record<string, string> = {
  INTIMATE_BODY_PART: "Intimate body part or reproductive system — 1904.29(b)(7)(i)",
  SEXUAL_ASSAULT: "Sexual assault — 1904.29(b)(7)(ii)",
  MENTAL_ILLNESS: "Mental illness — 1904.29(b)(7)(iii)",
  HIV_HEPATITIS_TB: "HIV infection, hepatitis, or tuberculosis — 1904.29(b)(7)(iv)",
  NEEDLESTICK: "Needlestick or sharps injury — 1904.29(b)(7)(v)",
  EMPLOYEE_REQUEST: "Employee voluntarily requests privacy — 1904.29(b)(7)(vi)",
};

export const PRIVACY_REASON_OPTIONS = [
  { value: "INTIMATE_BODY_PART", label: "Intimate body part or reproductive system — 1904.29(b)(7)(i)" },
  { value: "SEXUAL_ASSAULT", label: "Sexual assault — 1904.29(b)(7)(ii)" },
  { value: "MENTAL_ILLNESS", label: "Mental illness — 1904.29(b)(7)(iii)" },
  { value: "HIV_HEPATITIS_TB", label: "HIV infection, hepatitis, or tuberculosis — 1904.29(b)(7)(iv)" },
  { value: "NEEDLESTICK", label: "Needlestick or sharps injury — 1904.29(b)(7)(v)" },
  { value: "EMPLOYEE_REQUEST", label: "Employee voluntarily requests privacy — 1904.29(b)(7)(vi)" },
];

export const SEVERITY_OPTIONS = [
  { value: "FATALITY", label: "Fatality (report within 8 hours — 1904.39(a)(1))" },
  { value: "HOSPITALIZATION", label: "In-patient hospitalization (report within 24 hours — 1904.39(a)(2)(i))" },
  { value: "AMPUTATION", label: "Amputation (report within 24 hours — 1904.39(a)(2)(ii))" },
  { value: "EYE_LOSS", label: "Loss of an eye (report within 24 hours — 1904.39(a)(2)(iii))" },
];
