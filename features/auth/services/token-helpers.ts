import { createHash, randomBytes } from "node:crypto"

export function createOpaqueToken() {
  return randomBytes(32).toString("hex")
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createExpiryDate(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}
