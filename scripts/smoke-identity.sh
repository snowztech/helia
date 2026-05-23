#!/usr/bin/env bash
#
# Smoke test for the identified-user (HMAC) flow on /v1/chat.
#
# Run from the repo root once `make dev` is up:
#
#   SECRET=helia_isk_... WS=<workspace-uuid> bash scripts/smoke-identity.sh
#
# Get the secret from /settings → User identity → Generate secret.
# Get the workspace id from /settings → Workspace.

set -euo pipefail

: "${SECRET:?Set SECRET to a helia_isk_... value from /settings}"
: "${WS:?Set WS to a workspace UUID from /settings}"
API="${API:-http://localhost:4000}"

PAYLOAD='{"id":"u_smoke","name":"Marc"}'
SIG=$(SECRET="$SECRET" PAYLOAD="$PAYLOAD" node -e \
  'process.stdout.write(require("crypto").createHmac("sha256", process.env.SECRET).update(process.env.PAYLOAD).digest("hex"))')

if [ -z "$SIG" ]; then
  echo "✗ failed to compute HMAC (is node available?)"
  exit 1
fi

echo "→ API:      $API"
echo "→ Workspace $WS"
echo "→ Payload:  $PAYLOAD"
echo "→ Sig:      ${SIG:0:16}..."
echo

# ─── 1. valid signature → expect 200 ───────────────────────────────────
echo "[1/3] valid signature → expect 200"
code=$(curl -s -o /tmp/helia-smoke-body -w "%{http_code}" \
  -X POST "$API/v1/chat?ws=$WS" \
  -H "content-type: application/json" \
  -H "x-helia-user: $PAYLOAD" \
  -H "x-helia-signature: $SIG" \
  -d '{"messages":[{"role":"user","content":"hi"}]}')
if [ "$code" = "200" ]; then
  echo "    ✓ 200"
else
  echo "    ✗ got $code"
  cat /tmp/helia-smoke-body
  exit 1
fi
echo

# ─── 2. tampered signature → expect 401 ────────────────────────────────
echo "[2/3] tampered signature → expect 401"
code=$(curl -s -o /tmp/helia-smoke-body -w "%{http_code}" \
  -X POST "$API/v1/chat?ws=$WS" \
  -H "content-type: application/json" \
  -H "x-helia-user: $PAYLOAD" \
  -H "x-helia-signature: deadbeef" \
  -d '{"messages":[{"role":"user","content":"hi"}]}')
if [ "$code" = "401" ]; then
  echo "    ✓ 401"
else
  echo "    ✗ got $code"
  cat /tmp/helia-smoke-body
  exit 1
fi
echo

# ─── 3. no signature → outcome depends on identity_required ────────────
echo "[3/3] no signature → 200 if identity_required=off, 401 if on"
code=$(curl -s -o /tmp/helia-smoke-body -w "%{http_code}" \
  -X POST "$API/v1/chat?ws=$WS" \
  -H "content-type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}]}')
echo "    → got $code"
case "$code" in
  200) echo "    (anonymous chats are allowed — flip the Reject toggle on in /settings to lock down)";;
  401) echo "    (Reject toggle is on — anonymous chats are blocked)";;
  *)
    echo "    ✗ unexpected"
    cat /tmp/helia-smoke-body
    exit 1
    ;;
esac
echo
echo "✓ identity smoke test passed"
