import type { PurchaseSelection } from "@/features/catalog/product-purchase"

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(",")}}`
  }

  return JSON.stringify(value)
}

function getSelectionSignature(selection: PurchaseSelection) {
  const { quantity, ...signature } = selection

  void quantity

  return stableStringify(signature)
}

export function createCartLineId(slug: string, selection?: PurchaseSelection | null) {
  if (!selection) {
    return `${slug}::default`
  }

  return `${slug}::${getSelectionSignature(selection)}`
}
