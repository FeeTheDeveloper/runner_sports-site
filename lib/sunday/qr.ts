import "server-only";
import QRCode from "qrcode";

/**
 * Renders a QR code for the given URL as an inline SVG markup string.
 * Pure/offline (the `qrcode` package computes the matrix locally — no
 * network calls, no paid API), so it's safe to call at request time for
 * sponsor CTA panels.
 */
export async function renderQrCodeSvg(targetUrl: string): Promise<string> {
  // High-contrast dark-on-white regardless of page theme — a QR code is
  // useless if it isn't reliably scannable, so this never follows the
  // site's dark palette.
  return QRCode.toString(targetUrl, {
    type: "svg",
    margin: 1,
    color: { dark: "#0b1220", light: "#ffffff" },
  });
}
