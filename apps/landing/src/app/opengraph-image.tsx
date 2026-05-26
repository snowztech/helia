import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Helia: open-source AI assistant for your website";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated at the edge. Cached by Vercel after first request. Updating
 * Helia branding only requires editing this file.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f7f7f5",
          padding: "80px 96px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg viewBox="0 0 32 32" width="48" height="48">
            <path
              d="M 4 22 A 12 12 0 0 1 28 22"
              fill="none"
              stroke="#2a64d6"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <path
              d="M 9 22 A 7 7 0 0 1 23 22"
              fill="none"
              stroke="#2a64d6"
              strokeWidth="3.4"
              strokeLinecap="round"
              opacity={0.55}
            />
            <path
              d="M 13.5 22 A 2.5 2.5 0 0 1 18.5 22"
              fill="none"
              stroke="#2a64d6"
              strokeWidth="3.4"
              strokeLinecap="round"
              opacity={0.28}
            />
          </svg>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: "#2a64d6",
              letterSpacing: "-0.01em",
            }}
          >
            helia
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            color: "#161616",
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div>open-source AI</div>
            <div>
              <span style={{ color: "#2a64d6" }}>assistant</span> for your site.
            </div>
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#6a6a6a",
              maxWidth: 880,
            }}
          >
            Connect your docs, plug in your tools, drop one snippet.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 56,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#6a6a6a",
            fontSize: 20,
          }}
        >
          <div>gethelia.dev</div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#2a64d6",
                }}
              />
              open source, AGPL-3.0
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
