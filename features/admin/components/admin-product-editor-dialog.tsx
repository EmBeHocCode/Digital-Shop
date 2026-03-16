"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PencilLine, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AdminEditableProduct {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  category: string
  domain: string
  status: string
  imageUrl: string | null
  isFeatured: boolean
  sortOrder: number
  price: number
  priceLabel: string
}

interface AdminProductEditorDialogProps {
  mode: "create" | "edit"
  product?: AdminEditableProduct
}

type ProductFormState = {
  name: string
  slug: string
  tagline: string
  description: string
  price: string
  priceLabel: string
  category: string
  domain: string
  status: string
  imageUrl: string
  isFeatured: boolean
  sortOrder: string
}

function getInitialState(product?: AdminEditableProduct): ProductFormState {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    tagline: product?.tagline ?? "",
    description: product?.description ?? "",
    price: product ? `${product.price}` : "",
    priceLabel: product?.priceLabel ?? "",
    category: product?.category ?? "",
    domain: product?.domain ?? "DIGITAL_GOODS",
    status: product?.status ?? "DRAFT",
    imageUrl: product?.imageUrl ?? "",
    isFeatured: product?.isFeatured ?? false,
    sortOrder: `${product?.sortOrder ?? 0}`,
  }
}

export function AdminProductEditorDialog({
  mode,
  product,
}: AdminProductEditorDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formState, setFormState] = useState<ProductFormState>(getInitialState(product))
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const title = useMemo(
    () => (mode === "create" ? "Tạo sản phẩm mới" : `Chỉnh sửa ${product?.name ?? "sản phẩm"}`),
    [mode, product?.name]
  )

  function updateField<Key extends keyof ProductFormState>(key: Key, value: ProductFormState[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setFormState(getInitialState(product))
      setMessage(null)
    }
  }

  function buildPayload() {
    return {
      name: formState.name,
      slug: formState.slug,
      tagline: formState.tagline || null,
      description: formState.description || null,
      price: formState.price || 0,
      priceLabel: formState.priceLabel || null,
      category: formState.category,
      domain: formState.domain,
      status: formState.status,
      imageUrl: formState.imageUrl || null,
      isFeatured: formState.isFeatured,
      sortOrder: Number(formState.sortOrder || 0),
    }
  }

  function handleSubmit() {
    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch(
          mode === "create" ? "/api/admin/products" : `/api/admin/products/${product?.id}`,
          {
            method: mode === "create" ? "POST" : "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildPayload()),
          }
        )

        const payload = (await response.json()) as { success?: boolean; message?: string }
        if (!response.ok || !payload.success) {
          setMessage(payload.message ?? "Không thể lưu sản phẩm.")
          return
        }

        setOpen(false)
        router.refresh()
      } catch {
        setMessage("Không thể kết nối tới admin API.")
      }
    })
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant={mode === "create" ? "default" : "outline"}>
          {mode === "create" ? <Plus className="size-4" /> : <PencilLine className="size-4" />}
          {mode === "create" ? "Tạo sản phẩm" : "Sửa"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Quản lý foundation product cho storefront đang dùng ở `/services` và purchase experience.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`product-name-${mode}-${product?.id ?? "new"}`}>Tên sản phẩm</Label>
            <Input
              id={`product-name-${mode}-${product?.id ?? "new"}`}
              onChange={(event) => updateField("name", event.target.value)}
              value={formState.name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`product-slug-${mode}-${product?.id ?? "new"}`}>Slug</Label>
            <Input
              id={`product-slug-${mode}-${product?.id ?? "new"}`}
              onChange={(event) => updateField("slug", event.target.value)}
              value={formState.slug}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`product-category-${mode}-${product?.id ?? "new"}`}>Category</Label>
            <Input
              id={`product-category-${mode}-${product?.id ?? "new"}`}
              onChange={(event) => updateField("category", event.target.value)}
              value={formState.category}
            />
          </div>
          <div className="grid gap-2">
            <Label>Domain</Label>
            <Select onValueChange={(value) => updateField("domain", value)} value={formState.domain}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFRASTRUCTURE">Infrastructure</SelectItem>
                <SelectItem value="DIGITAL_GOODS">Digital goods</SelectItem>
                <SelectItem value="TELECOM">Telecom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Trạng thái</Label>
            <Select onValueChange={(value) => updateField("status", value)} value={formState.status}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`product-price-${mode}-${product?.id ?? "new"}`}>Giá base</Label>
            <Input
              id={`product-price-${mode}-${product?.id ?? "new"}`}
              inputMode="decimal"
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="Ví dụ: 149000"
              value={formState.price}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`product-price-label-${mode}-${product?.id ?? "new"}`}>Price label</Label>
            <Input
              id={`product-price-label-${mode}-${product?.id ?? "new"}`}
              onChange={(event) => updateField("priceLabel", event.target.value)}
              placeholder="Từ 149.000đ/tháng"
              value={formState.priceLabel}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`product-sort-${mode}-${product?.id ?? "new"}`}>Sort order</Label>
            <Input
              id={`product-sort-${mode}-${product?.id ?? "new"}`}
              inputMode="numeric"
              onChange={(event) => updateField("sortOrder", event.target.value)}
              value={formState.sortOrder}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`product-tagline-${mode}-${product?.id ?? "new"}`}>Tagline</Label>
            <Input
              id={`product-tagline-${mode}-${product?.id ?? "new"}`}
              onChange={(event) => updateField("tagline", event.target.value)}
              value={formState.tagline}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`product-image-${mode}-${product?.id ?? "new"}`}>Image URL</Label>
            <Input
              id={`product-image-${mode}-${product?.id ?? "new"}`}
              onChange={(event) => updateField("imageUrl", event.target.value)}
              value={formState.imageUrl}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`product-description-${mode}-${product?.id ?? "new"}`}>Mô tả</Label>
            <Textarea
              id={`product-description-${mode}-${product?.id ?? "new"}`}
              onChange={(event) => updateField("description", event.target.value)}
              rows={6}
              value={formState.description}
            />
          </div>
          <div className="md:col-span-2">
            <Label className="inline-flex items-center gap-3">
              <Checkbox
                checked={formState.isFeatured}
                onCheckedChange={(checked) => updateField("isFeatured", checked === true)}
              />
              Đánh dấu featured trên storefront
            </Label>
          </div>
        </div>

        {message ? <p className="text-sm text-destructive">{message}</p> : null}

        <DialogFooter>
          <Button disabled={isPending} onClick={handleSubmit}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
