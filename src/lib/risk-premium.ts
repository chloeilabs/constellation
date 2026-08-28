import type { FmpMarketRiskPremium } from "@/lib/types";
import { treasuryYieldToDecimal } from "@/lib/wacc";

const ISO_TO_ERP_COUNTRY: Record<string, string> = {
  AE: "United Arab Emirates",
  AR: "Argentina",
  AT: "Austria",
  AU: "Australia",
  BE: "Belgium",
  BR: "Brazil",
  CA: "Canada",
  CH: "Switzerland",
  CL: "Chile",
  CN: "China",
  CZ: "Czech Republic",
  DE: "Germany",
  DK: "Denmark",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  GR: "Greece",
  HK: "Hong Kong",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IS: "Iceland",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  MX: "Mexico",
  MY: "Malaysia",
  NL: "Netherlands",
  NO: "Norway",
  NZ: "New Zealand",
  PL: "Poland",
  PT: "Portugal",
  QA: "Qatar",
  RU: "Russia",
  SA: "Saudi Arabia",
  SE: "Sweden",
  SG: "Singapore",
  TH: "Thailand",
  TR: "Turkey",
  TW: "Taiwan",
  UK: "United Kingdom",
  US: "United States",
  USA: "United States",
  ZA: "South Africa",
};

function namesForCountry(country: string) {
  const trimmed = country.trim();
  const mapped = ISO_TO_ERP_COUNTRY[trimmed.toUpperCase()];
  return [...new Set([mapped, trimmed].filter((name): name is string => Boolean(name)))];
}

export function matchMarketRiskPremium(rows: FmpMarketRiskPremium[], country: string | null | undefined) {
  if (!country) return null;
  const names = namesForCountry(country).map((name) => name.toLowerCase());
  return (
    rows.find((row) => names.includes(row.country.toLowerCase())) ??
    rows.find((row) => names.some((name) => row.country.toLowerCase().includes(name))) ??
    null
  );
}

export function equityRiskPremiumDecimal(row: FmpMarketRiskPremium | null) {
  return treasuryYieldToDecimal(row?.totalEquityRiskPremium);
}
