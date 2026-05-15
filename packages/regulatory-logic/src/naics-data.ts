/**
 * NAICS code lookup tables seeded from the two appendices in 29 CFR Part 1904.
 *
 * Appendix A to Subpart B — Partially Exempt Industries (1904.2)
 *   Employers in these industries are exempt from routine 300/300A/301 recordkeeping
 *   (unless notified by OSHA or BLS). They still must report severe injuries per 1904.39.
 *
 * Appendix A to Subpart E — ITA Electronic Submission Tier 1 Industries (1904.41(a)(1))
 *   Establishments with 20–249 employees in these industries must submit Form 300A.
 *   NOTE: This is a different appendix from Subpart B Appendix A above.
 *   It comprises high-hazard industries designated by OSHA for routine electronic submission.
 *
 * Appendix B to Subpart E — ITA Electronic Submission Tier 2 Industries (1904.41(a)(2))
 *   Establishments with 100+ employees in these industries must submit Forms 300A, 300, and 301.
 */

export interface NaicsEntry {
  code: string;
  title: string;
}

// ─── Appendix A to Subpart B — Partially Exempt Low-Hazard Industries ────────
// Source: 29 CFR Part 1904, Appendix A to Subpart B
// These are 4-digit NAICS codes; parent-code prefix matching covers sub-codes.

export const APPENDIX_A_SUBPART_B_EXEMPT: NaicsEntry[] = [
  // Retail Trade
  { code: "4412", title: "Other Motor Vehicle Dealers" },
  { code: "4431", title: "Electronics and Appliance Stores" },
  { code: "4461", title: "Health and Personal Care Stores" },
  { code: "4471", title: "Gasoline Stations" },
  { code: "4481", title: "Clothing Stores" },
  { code: "4482", title: "Shoe Stores" },
  { code: "4483", title: "Jewelry, Luggage, and Leather Goods Stores" },
  { code: "4511", title: "Sporting Goods, Hobby, and Musical Instrument Stores" },
  { code: "4512", title: "Book Stores and News Dealers" },
  { code: "4531", title: "Florists" },
  { code: "4532", title: "Office Supplies, Stationery, and Gift Stores" },
  // Transportation and Warehousing
  { code: "4812", title: "Nonscheduled Air Transportation" },
  { code: "4861", title: "Pipeline Transportation of Crude Oil" },
  { code: "4862", title: "Pipeline Transportation of Natural Gas" },
  { code: "4869", title: "Other Pipeline Transportation" },
  { code: "4879", title: "Scenic and Sightseeing Transportation, Other" },
  { code: "4885", title: "Freight Transportation Arrangement" },
  // Information
  { code: "5111", title: "Newspaper, Periodical, Book, and Directory Publishers" },
  { code: "5112", title: "Software Publishers" },
  { code: "5121", title: "Motion Picture and Video Industries" },
  { code: "5122", title: "Sound Recording Industries" },
  { code: "5151", title: "Radio and Television Broadcasting" },
  { code: "5172", title: "Wireless Telecommunications Carriers (except Satellite)" },
  { code: "5173", title: "Telecommunications Resellers" },
  { code: "5179", title: "Other Telecommunications" },
  { code: "5181", title: "Internet Service Providers" },
  { code: "5182", title: "Data Processing, Hosting, and Related Services" },
  { code: "5191", title: "Other Information Services" },
  // Finance and Insurance
  { code: "5211", title: "Monetary Authorities — Central Bank" },
  { code: "5221", title: "Depository Credit Intermediation" },
  { code: "5222", title: "Nondepository Credit Intermediation" },
  { code: "5223", title: "Activities Related to Credit Intermediation" },
  { code: "5231", title: "Securities and Commodity Contracts Intermediation and Brokerage" },
  { code: "5232", title: "Securities and Commodity Exchanges" },
  { code: "5239", title: "Other Financial Investment Activities" },
  { code: "5241", title: "Insurance Carriers" },
  { code: "5242", title: "Agencies, Brokerages, and Other Insurance Related Activities" },
  { code: "5251", title: "Insurance and Employee Benefit Funds" },
  { code: "5259", title: "Other Investment Pools and Funds" },
  // Real Estate and Rental/Leasing
  { code: "5312", title: "Offices of Real Estate Agents and Brokers" },
  { code: "5331", title: "Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)" },
  // Professional, Scientific, and Technical Services
  { code: "5411", title: "Legal Services" },
  { code: "5412", title: "Accounting, Tax Preparation, Bookkeeping, and Payroll Services" },
  { code: "5413", title: "Architectural, Engineering, and Related Services" },
  { code: "5414", title: "Specialized Design Services" },
  { code: "5415", title: "Computer Systems Design and Related Services" },
  { code: "5416", title: "Management, Scientific, and Technical Consulting Services" },
  { code: "5417", title: "Scientific Research and Development Services" },
  { code: "5418", title: "Advertising, Public Relations, and Related Services" },
  // Management of Companies and Enterprises
  { code: "5511", title: "Management of Companies and Enterprises" },
  // Administrative and Support Services
  { code: "5611", title: "Office Administrative Services" },
  { code: "5614", title: "Business Support Services" },
  { code: "5615", title: "Travel Arrangement and Reservation Services" },
  { code: "5616", title: "Investigation and Security Services" },
  // Educational Services
  { code: "6111", title: "Elementary and Secondary Schools" },
  { code: "6112", title: "Junior Colleges" },
  { code: "6113", title: "Colleges, Universities, and Professional Schools" },
  { code: "6114", title: "Business Schools and Computer and Management Training" },
  { code: "6115", title: "Technical and Trade Schools" },
  { code: "6116", title: "Other Schools and Instruction" },
  { code: "6117", title: "Educational Support Services" },
  // Health Care and Social Assistance
  { code: "6211", title: "Offices of Physicians" },
  { code: "6212", title: "Offices of Dentists" },
  { code: "6213", title: "Offices of Other Health Practitioners" },
  { code: "6214", title: "Outpatient Care Centers" },
  { code: "6215", title: "Medical and Diagnostic Laboratories" },
  { code: "6244", title: "Child Day Care Services" },
  // Arts, Entertainment, and Recreation
  { code: "7114", title: "Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures" },
  { code: "7115", title: "Independent Artists, Writers, and Performers" },
  { code: "7213", title: "Rooming and Boarding Houses" },
  { code: "7221", title: "Full-Service Restaurants" },
  { code: "7222", title: "Limited-Service Eating Places" },
  { code: "7224", title: "Drinking Places (Alcoholic Beverages)" },
  // Repair and Maintenance
  { code: "8112", title: "Electronic and Precision Equipment Repair and Maintenance" },
  { code: "8114", title: "Personal and Household Goods Repair and Maintenance" },
  // Personal and Laundry Services
  { code: "8121", title: "Personal Care Services" },
  { code: "8122", title: "Death Care Services" },
  // Religious, Grantmaking, Civic, Professional, and Similar Organizations
  { code: "8131", title: "Religious Organizations" },
  { code: "8132", title: "Grantmaking and Giving Services" },
  { code: "8133", title: "Social Advocacy Organizations" },
  { code: "8134", title: "Civic and Social Organizations" },
  { code: "8139", title: "Business, Professional, Labor, Political, and Similar Organizations" },
];

// ─── Appendix B to Subpart E — 100+ Employee Industries for 300/301 Submission ─
// Source: 29 CFR Part 1904, Appendix B to Subpart E
// Establishments with 100+ employees in these industries must submit 300A, 300, AND 301.

export const APPENDIX_B_SUBPART_E_300_301: NaicsEntry[] = [
  // Agriculture, Forestry, Fishing and Hunting
  { code: "1111", title: "Oilseed and Grain Farming" },
  { code: "1112", title: "Vegetable and Melon Farming" },
  { code: "1113", title: "Fruit and Tree Nut Farming" },
  { code: "1114", title: "Greenhouse, Nursery, and Floriculture Production" },
  { code: "1119", title: "Other Crop Farming" },
  { code: "1121", title: "Cattle Ranching and Farming" },
  { code: "1122", title: "Hog and Pig Farming" },
  { code: "1123", title: "Poultry and Egg Production" },
  { code: "1129", title: "Other Animal Production" },
  { code: "1133", title: "Logging" },
  { code: "1141", title: "Fishing" },
  { code: "1142", title: "Hunting and Trapping" },
  { code: "1151", title: "Support Activities for Crop Production" },
  { code: "1152", title: "Support Activities for Animal Production" },
  { code: "1153", title: "Support Activities for Forestry" },
  // Manufacturing — Food
  { code: "3111", title: "Animal Food Manufacturing" },
  { code: "3112", title: "Grain and Oilseed Milling" },
  { code: "3113", title: "Sugar and Confectionery Product Manufacturing" },
  { code: "3114", title: "Fruit and Vegetable Preserving and Specialty Food Manufacturing" },
  { code: "3115", title: "Dairy Product Manufacturing" },
  { code: "3116", title: "Animal Slaughtering and Processing" },
  { code: "3117", title: "Seafood Product Preparation and Packaging" },
  { code: "3118", title: "Bakeries and Tortilla Manufacturing" },
  { code: "3119", title: "Other Food Manufacturing" },
  // Manufacturing — Beverages and Tobacco
  { code: "3121", title: "Beverage Manufacturing" },
  // Manufacturing — Textile and Leather
  { code: "3161", title: "Leather and Hide Tanning and Finishing" },
  { code: "3162", title: "Footwear Manufacturing" },
  { code: "3169", title: "Other Leather and Allied Product Manufacturing" },
  // Manufacturing — Wood Products
  { code: "3211", title: "Sawmills and Wood Preservation" },
  { code: "3212", title: "Veneer, Plywood, and Engineered Wood Product Manufacturing" },
  { code: "3219", title: "Other Wood Product Manufacturing" },
  // Manufacturing — Paper
  { code: "3221", title: "Pulp, Paper, and Paperboard Mills" },
  { code: "3222", title: "Converted Paper Product Manufacturing" },
  // Manufacturing — Plastics and Rubber
  { code: "3261", title: "Plastics Product Manufacturing" },
  { code: "3262", title: "Rubber Product Manufacturing" },
  // Manufacturing — Nonmetallic Mineral Products
  { code: "3271", title: "Clay Product and Refractory Manufacturing" },
  { code: "3272", title: "Glass and Glass Product Manufacturing" },
  { code: "3273", title: "Cement and Concrete Product Manufacturing" },
  { code: "3274", title: "Lime and Gypsum Product Manufacturing" },
  { code: "3279", title: "Other Nonmetallic Mineral Product Manufacturing" },
  // Manufacturing — Primary Metals
  { code: "3311", title: "Iron and Steel Mills and Ferroalloy Manufacturing" },
  { code: "3312", title: "Steel Product Manufacturing from Purchased Steel" },
  { code: "3313", title: "Alumina and Aluminum Production and Processing" },
  { code: "3314", title: "Nonferrous Metal (except Aluminum) Production and Processing" },
  { code: "3315", title: "Foundries" },
  // Manufacturing — Fabricated Metal Products
  { code: "3321", title: "Forging and Stamping" },
  { code: "3322", title: "Cutlery and Handtool Manufacturing" },
  { code: "3323", title: "Architectural and Structural Metals Manufacturing" },
  { code: "3324", title: "Boiler, Tank, and Shipping Container Manufacturing" },
  { code: "3325", title: "Hardware Manufacturing" },
  { code: "3326", title: "Spring and Wire Product Manufacturing" },
  { code: "3327", title: "Machine Shops; Turned Product; and Screw, Nut, and Bolt Manufacturing" },
  { code: "3328", title: "Coating, Engraving, Heat Treating, and Allied Activities" },
  { code: "3329", title: "Other Fabricated Metal Product Manufacturing" },
  // Manufacturing — Transportation Equipment
  { code: "3361", title: "Motor Vehicle Manufacturing" },
  { code: "3362", title: "Motor Vehicle Body and Trailer Manufacturing" },
  { code: "3363", title: "Motor Vehicle Parts Manufacturing" },
  { code: "3366", title: "Ship and Boat Building" },
  { code: "3369", title: "Other Transportation Equipment Manufacturing" },
  // Manufacturing — Furniture
  { code: "3371", title: "Household and Institutional Furniture and Kitchen Cabinet Manufacturing" },
  { code: "3372", title: "Office Furniture (including Fixtures) Manufacturing" },
  { code: "3379", title: "Other Furniture Related Product Manufacturing" },
  // Wholesale Trade
  { code: "4231", title: "Motor Vehicle and Motor Vehicle Parts and Supplies Merchant Wholesalers" },
  { code: "4233", title: "Lumber and Other Construction Materials Merchant Wholesalers" },
  { code: "4235", title: "Metal and Mineral (except Petroleum) Merchant Wholesalers" },
  { code: "4239", title: "Miscellaneous Durable Goods Merchant Wholesalers" },
  { code: "4241", title: "Paper and Paper Product Merchant Wholesalers" },
  { code: "4244", title: "Grocery and Related Product Merchant Wholesalers" },
  { code: "4248", title: "Beer, Wine, and Distilled Alcoholic Beverage Merchant Wholesalers" },
  // Retail Trade
  { code: "4411", title: "Automobile Dealers" },
  { code: "4413", title: "Automotive Parts, Accessories, and Tire Stores" },
  { code: "4421", title: "Furniture Stores" },
  { code: "4441", title: "Building Material and Supplies Dealers" },
  { code: "4442", title: "Lawn and Garden Equipment and Supplies Stores" },
  { code: "4451", title: "Grocery Stores" },
  { code: "4521", title: "Department Stores" },
  { code: "4529", title: "Other General Merchandise Stores" },
  { code: "4533", title: "Used Merchandise Stores" },
  { code: "4543", title: "Direct Selling Establishments" },
  // Transportation and Warehousing
  { code: "4811", title: "Scheduled Air Transportation" },
  { code: "4841", title: "General Freight Trucking" },
  { code: "4842", title: "Specialized Freight Trucking" },
  { code: "4851", title: "Urban Transit Systems" },
  { code: "4852", title: "Interurban and Rural Bus Transportation" },
  { code: "4853", title: "Taxi and Ridesharing Services" },
  { code: "4854", title: "School and Employee Bus Transportation" },
  { code: "4911", title: "Postal Service" },
  { code: "4921", title: "Couriers and Express Delivery Services" },
  { code: "4931", title: "Warehousing and Storage" },
  // Health Care and Social Assistance
  { code: "6216", title: "Home Health Care Services" },
  { code: "6221", title: "General Medical and Surgical Hospitals" },
  { code: "6222", title: "Psychiatric and Substance Abuse Hospitals" },
  { code: "6223", title: "Specialty (except Psychiatric and Substance Abuse) Hospitals" },
  { code: "6231", title: "Nursing Care Facilities (Skilled Nursing Facilities)" },
  { code: "6232", title: "Residential Intellectual and Developmental Disability, Mental Health, and Substance Abuse Facilities" },
  { code: "6233", title: "Continuing Care Retirement Communities and Assisted Living Facilities for the Elderly" },
  { code: "6239", title: "Other Residential Care Facilities" },
  { code: "6242", title: "Community Food and Housing, and Emergency and Other Relief Services" },
  { code: "6243", title: "Vocational Rehabilitation Services" },
  // Waste Management
  { code: "5621", title: "Waste Collection" },
  { code: "5622", title: "Waste Treatment and Disposal" },
  // Arts, Entertainment, and Recreation
  { code: "7111", title: "Performing Arts Companies" },
  { code: "7112", title: "Spectator Sports" },
  { code: "7131", title: "Amusement Parks and Arcades" },
  // Accommodation and Food Services
  { code: "7211", title: "Traveler Accommodation" },
  { code: "7212", title: "RV (Recreational Vehicle) Parks and Recreational Camps" },
  { code: "7223", title: "Special Food Services" },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

const _appendixABSet = new Set(APPENDIX_A_SUBPART_B_EXEMPT.map((e) => e.code));
const _appendixBSet = new Set(APPENDIX_B_SUBPART_E_300_301.map((e) => e.code));

/**
 * Returns true if the NAICS code (or any parent prefix) is in Appendix A to Subpart B
 * (the low-hazard exempt industry list). Uses prefix matching to handle 5- and 6-digit
 * sub-codes that descend from a listed 4-digit code.
 */
export function isAppendixASubpartBExempt(naicsCode: string): boolean {
  const code = naicsCode.trim();
  for (let len = 4; len <= code.length; len++) {
    if (_appendixABSet.has(code.slice(0, len))) return true;
  }
  return false;
}

/**
 * Returns true if the NAICS code (or any parent prefix) is in Appendix B to Subpart E
 * (the 100+ employee industries requiring 300/301 electronic submission).
 */
export function isAppendixBSubpartE300_301(naicsCode: string): boolean {
  const code = naicsCode.trim();
  for (let len = 4; len <= code.length; len++) {
    if (_appendixBSet.has(code.slice(0, len))) return true;
  }
  return false;
}

/**
 * Returns the title for a NAICS code from either appendix, or undefined if not found.
 */
export function getNaicsTitle(naicsCode: string): string | undefined {
  const code = naicsCode.trim();
  const all = [...APPENDIX_A_SUBPART_B_EXEMPT, ...APPENDIX_B_SUBPART_E_300_301];
  return all.find((e) => code.startsWith(e.code))?.title;
}
