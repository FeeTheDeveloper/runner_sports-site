// Runner Sunday Headquarters — editable campaign content.
//
// This file is the single place ops edits by hand tonight: sponsors, the
// veteran vendor spotlight, live-desk notes, and the halftime narrative. No
// row here is fetched from a database yet — every entry that stands in for
// a real business relationship or in-game event is explicitly marked
// `placeholder: true` and rendered with a visible tag so it can never be
// mistaken for a paid sponsor or a live update. Replace placeholders with
// real names/copy/links before publish, or wire this module to a Supabase
// table (`sunday_sponsors`, `sunday_live_desk`, etc.) once the campaign
// needs sponsors to self-serve their own slots.
//
// No sponsor logo artwork exists in /public yet (see components/sports/TeamLogo
// for the established "no logo file → text monogram" fallback pattern this
// module reuses) and no NFL team/league marks are used anywhere in this file.

import type {
  CtaSponsorPanel,
  HalftimeReportContent,
  LiveDeskNote,
  Sponsor,
  VeteranVendorSpotlightEntry,
} from "@/lib/sunday/types";

export const PRESENTED_BY_SPONSOR: Sponsor = {
  id: "presented-by-slot",
  name: "Sponsor Slot — Presented By",
  tagline: "Runner Sunday Headquarters is presented by [Sponsor Name]",
  href: undefined,
  placeholder: true,
};

export const SPONSOR_LOGO_RAIL: Sponsor[] = [
  { id: "sponsor-slot-1", name: "Sponsor Slot 1", placeholder: true },
  { id: "sponsor-slot-2", name: "Sponsor Slot 2", placeholder: true },
  { id: "sponsor-slot-3", name: "Sponsor Slot 3", placeholder: true },
  { id: "sponsor-slot-4", name: "Sponsor Slot 4", placeholder: true },
];

export const VETERAN_VENDOR_SPOTLIGHT: VeteranVendorSpotlightEntry[] = [
  {
    id: "veteran-vendor-slot-1",
    vendorName: "Veteran-Owned Vendor Slot",
    ownerName: undefined,
    branchOfService: undefined,
    description:
      "Reserved for a veteran-owned small business booked into the Sunday activation. Replace with the vendor's real name, branch of service, and a short description before publish.",
    href: undefined,
    placeholder: true,
  },
];

// Live desk notes are meant to be appended to in real time during the
// broadcast window. Empty on a normal night until kickoff — the component
// renders an explicit "awaiting kickoff" state rather than fabricating
// in-game commentary that hasn't happened.
export const LIVE_DESK_NOTES: LiveDeskNote[] = [];

export const HALFTIME_REPORT: HalftimeReportContent = {
  gameLabel: "Featured Game",
  scoreLine: "Awaiting kickoff",
  summary:
    "The halftime recap populates once the featured game reaches the half. This is placeholder framing, not a live report.",
  keyStats: [],
  updatedAt: new Date(0).toISOString(),
  placeholder: true,
};

export const CTA_SPONSOR_PANELS: CtaSponsorPanel[] = [
  {
    id: "cta-panel-1",
    sponsor: { id: "sponsor-slot-cta-1", name: "Sponsor Slot — CTA", placeholder: true },
    headline: "Scan for today's sponsor offer",
    body: "Reserved sponsor CTA slot. Point this at a real landing page and swap the headline/body copy before publish.",
    ctaLabel: "Sponsor link pending",
    ctaHref: "https://werunsportsandanalytics.com/pricing",
    showQrCode: true,
  },
];
