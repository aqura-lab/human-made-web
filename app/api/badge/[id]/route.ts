import { renderBadgeSvg, type BadgeTheme } from "@/lib/badge/svg";
import { isValidCertificateId } from "@/lib/certificate/id";

// Pure string rendering — no crypto, no DB. The badge is identical regardless
// of whether the id resolves to a stored certificate (it reveals nothing about
// the certificate), so it always returns a valid image and never 404s on a
// well-formed id. This keeps embeds from showing a broken-image icon.
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidCertificateId(id)) {
    return new Response("Invalid certificate id", { status: 400 });
  }

  const theme: BadgeTheme =
    new URL(request.url).searchParams.get("theme") === "dark" ? "dark" : "light";

  // The id is validated above and never interpolated into the SVG, so there is
  // no untrusted-content injection surface here.
  const svg = renderBadgeSvg(theme);

  return new Response(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // Cacheable on the edge; cheap to regenerate, safe to share.
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
