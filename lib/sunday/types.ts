// Runner Sunday Headquarters — shared types for the NFL Sunday activation.
//
// SPONSOR/ANALYTICS SEPARATION
// Every module on the activation page is either a Runner analytical surface
// (sourced from lib/data/* and stamped with the same SourceMetadata the rest
// of the app uses) or a sponsor/marketing surface (sourced from content.ts,
// tagged `kind: "sponsor"`, and rendered with the SponsorTag component so it
// never reads as a Runner model conclusion). Components must not blend the
// two: a card is one or the other, never both.

export type SundayModuleKind = "runner" | "sponsor";

export interface SponsorLink {
  label: string;
  href: string;
}

export interface Sponsor {
  id: string;
  name: string;
  tagline?: string;
  /** Absolute or /public path. Omit to render the text-monogram fallback —
   * never substitute a found/generated logo for a sponsor that hasn't
   * supplied real artwork. */
  logoUrl?: string;
  href?: string;
  /** True until Fee/Hutchrok replace this with a signed sponsor. Rendered
   * on-page as a visible "PLACEHOLDER — SPONSOR TBD" tag so no unpaid
   * placeholder is ever mistaken for a live placement. */
  placeholder: boolean;
}

export interface VeteranVendorSpotlightEntry {
  id: string;
  vendorName: string;
  ownerName?: string;
  branchOfService?: string;
  description: string;
  href?: string;
  logoUrl?: string;
  placeholder: boolean;
}

export interface LiveDeskNote {
  id: string;
  /** ISO timestamp. Sort descending (newest first) when rendering. */
  postedAt: string;
  author: string;
  note: string;
  tag?: "injury" | "line-move" | "weather" | "observation" | "admin";
}

export interface HalftimeReportContent {
  gameLabel: string;
  scoreLine: string;
  summary: string;
  keyStats: { label: string; value: string }[];
  updatedAt: string;
  /** true until real in-game copy replaces the pre-kickoff placeholder. */
  placeholder: boolean;
}

export interface CtaSponsorPanel {
  id: string;
  sponsor: Sponsor;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  /** Rendered as a real QR code (via lib/sunday/qr.ts) pointing at ctaHref. */
  showQrCode: boolean;
}
