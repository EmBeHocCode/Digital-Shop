import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto"

const HUMAN_VERIFICATION_WINDOW_MS = 10 * 60 * 1000

export interface HumanVerificationChallenge {
  firstOperand: number
  secondOperand: number
  prompt: string
  token: string
}

interface HumanVerificationPayload {
  answer: string
  expiresAt: number
  firstOperand: number
  secondOperand: number
  nonce: string
}

interface VerifyHumanVerificationInput {
  answer: string
  confirmed: boolean
  honeypot?: string
  token: string
}

function getHumanVerificationSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "digital-shop-dev-secret"
}

function signHumanVerificationPayload(payload: string) {
  return createHmac("sha256", getHumanVerificationSecret()).update(payload).digest("base64url")
}

function normalizeAnswer(answer: string) {
  return answer.trim()
}

export function createHumanVerificationChallenge(): HumanVerificationChallenge {
  const firstOperand = randomInt(2, 10)
  const secondOperand = randomInt(2, 10)
  const payload: HumanVerificationPayload = {
    answer: String(firstOperand + secondOperand),
    expiresAt: Date.now() + HUMAN_VERIFICATION_WINDOW_MS,
    firstOperand,
    secondOperand,
    nonce: randomUUID(),
  }
  const serializedPayload = JSON.stringify(payload)
  const encodedPayload = Buffer.from(serializedPayload).toString("base64url")
  const signature = signHumanVerificationPayload(serializedPayload)

  return {
    firstOperand,
    secondOperand,
    prompt: `Nhập kết quả của ${firstOperand} + ${secondOperand}`,
    token: `${encodedPayload}.${signature}`,
  }
}

export function verifyHumanVerification(input: VerifyHumanVerificationInput) {
  if (!input.confirmed) {
    return false
  }

  if (input.honeypot?.trim()) {
    return false
  }

  const [encodedPayload, providedSignature] = input.token.split(".")

  if (!encodedPayload || !providedSignature) {
    return false
  }

  let parsedPayload: HumanVerificationPayload

  try {
    const serializedPayload = Buffer.from(encodedPayload, "base64url").toString("utf8")
    const expectedSignature = signHumanVerificationPayload(serializedPayload)
    const providedBuffer = Buffer.from(providedSignature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return false
    }

    parsedPayload = JSON.parse(serializedPayload) as HumanVerificationPayload
  } catch {
    return false
  }

  if (!parsedPayload.expiresAt || parsedPayload.expiresAt < Date.now()) {
    return false
  }

  return normalizeAnswer(input.answer) === parsedPayload.answer
}
