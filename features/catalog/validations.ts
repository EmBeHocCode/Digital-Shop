import { z } from "zod"

export const catalogHighlightSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

export const catalogMetadataSchema = z.object({
  features: z.array(z.string().min(1)).default([]),
  highlights: z.array(catalogHighlightSchema).default([]),
  idealFor: z.array(z.string().min(1)).default([]),
  operations: z.array(z.string().min(1)).default([]),
})

export type CatalogMetadataInput = z.infer<typeof catalogMetadataSchema>
