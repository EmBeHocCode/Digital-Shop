import { Prisma } from "@prisma/client"
import type { CartItemConfiguration } from "@/features/cart/types"

function isJsonObject(
  value: Prisma.JsonValue | null | undefined
): value is Prisma.JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function isStringArray(value: Prisma.JsonValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

export function parseOrderItemConfiguration(
  metadata: Prisma.JsonValue | null
): CartItemConfiguration | undefined {
  if (!isJsonObject(metadata)) {
    return undefined
  }

  const rawConfiguration = isJsonObject(metadata.configuration)
    ? metadata.configuration
    : metadata

  const title = rawConfiguration.title
  const kind = rawConfiguration.kind
  const summaryLines = rawConfiguration.summaryLines
  const selection = rawConfiguration.selection
  const allowQuantityAdjustment = rawConfiguration.allowQuantityAdjustment

  if (
    typeof title !== "string" ||
    typeof kind !== "string" ||
    !isStringArray(summaryLines) ||
    !selection
  ) {
    return undefined
  }

  return {
    kind: kind as CartItemConfiguration["kind"],
    title,
    summaryLines,
    selection: selection as CartItemConfiguration["selection"],
    allowQuantityAdjustment:
      typeof allowQuantityAdjustment === "boolean"
        ? allowQuantityAdjustment
        : true,
  }
}
