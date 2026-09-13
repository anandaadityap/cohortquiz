import { createHash, randomBytes } from "node:crypto";

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function newTryoutToken() {
  return randomBytes(24).toString("base64url");
}
