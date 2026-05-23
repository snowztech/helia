import Link from "next/link";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

/**
 * Server component so the verify POST fires exactly once per request.
 * Doing it client-side runs into React StrictMode's double-effect in dev,
 * which burns the one-shot token on the first call and 400s on the second.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Result
        kind="missing"
        message="Missing verification token. Use the link from your email."
      />
    );
  }

  const res = await fetch(`${API_URL}/v1/auth/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });

  if (res.ok) return <Result kind="success" />;

  let error = "Link expired or already used.";
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) error = body.error;
  } catch {
    // keep default
  }
  return <Result kind="error" message={error} />;
}

function Result({
  kind,
  message,
}: {
  kind: "success" | "error" | "missing";
  message?: string;
}) {
  return (
    <div className="space-y-6 text-center">
      <h1 className="text-xl font-semibold">Verify your email</h1>

      {kind === "success" && (
        <>
          <p className="text-sm text-muted-foreground">
            Your email is verified.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Go to dashboard</Link>
          </Button>
        </>
      )}

      {kind === "error" && (
        <>
          <p className="text-sm text-destructive">{message}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </>
      )}

      {kind === "missing" && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
