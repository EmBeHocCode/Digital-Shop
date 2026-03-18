"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Loader2, Trash2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "@/hooks/use-toast"
import { avatarUploadConstraints } from "@/features/account/avatar-constants"
import { AvatarCropDialog } from "@/features/account/components/avatar-crop-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface ProfileAvatarUploaderProps {
  email: string
  image: string | null
  name: string
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((value) => value[0]?.toUpperCase())
      .join("") || "NU"
  )
}

export function ProfileAvatarUploader({
  email,
  image,
  name,
}: ProfileAvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()
  const { update } = useSession()
  const [isPending, startTransition] = useTransition()
  const [currentImage, setCurrentImage] = useState(image)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [cropFileName, setCropFileName] = useState("avatar")
  const [isCropOpen, setIsCropOpen] = useState(false)
  const fileInputId = useMemo(() => {
    const normalizedSeed = `${email}-${name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    return `profile-avatar-input-${normalizedSeed || "default"}`
  }, [email, name])

  useEffect(() => {
    return () => {
      if (cropSource) {
        URL.revokeObjectURL(cropSource)
      }
    }
  }, [cropSource])

  const syncSession = async (nextImage: string | null) => {
    setCurrentImage(nextImage)
    await update({
      email,
      image: nextImage,
      name,
    })
    router.refresh()
  }

  const closeCropDialog = () => {
    setIsCropOpen(false)
    if (cropSource) {
      URL.revokeObjectURL(cropSource)
    }
    setCropSource(null)
    setCropFileName("avatar")
  }

  const uploadAvatar = async (file: File) => {
    const formData = new FormData()
    formData.set("avatar", file)

    const response = await fetch("/api/account/avatar", {
      method: "POST",
      body: formData,
    })

    const payload = (await response.json().catch(() => null)) as
      | {
          success?: boolean
          message?: string
          user?: {
            image: string | null
          }
        }
      | null

    if (!response.ok || !payload?.success) {
      toast({
        title: "Không thể cập nhật ảnh đại diện",
        description: payload?.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      })
      return false
    }

    await syncSession(payload.user?.image ?? null)

    toast({
      title: "Đã cập nhật ảnh đại diện",
      description: "Avatar mới đã được lưu vào hồ sơ tài khoản.",
    })
    return true
  }

  const handleUpload = (file: File | null) => {
    if (!file) {
      return
    }

    if (!avatarUploadConstraints.acceptedMimeTypes.some((mimeType) => mimeType === file.type)) {
      toast({
        title: "Định dạng chưa được hỗ trợ",
        description: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.",
        variant: "destructive",
      })
      return
    }

    if (file.size > avatarUploadConstraints.maxBytes) {
      toast({
        title: "Ảnh quá lớn",
        description: `Ảnh đại diện phải nhỏ hơn ${avatarUploadConstraints.maxBytesLabel}.`,
        variant: "destructive",
      })
      return
    }

    if (cropSource) {
      URL.revokeObjectURL(cropSource)
    }

    setCropSource(URL.createObjectURL(file))
    setCropFileName(file.name)
    setIsCropOpen(true)
  }

  const handleRemove = () => {
    startTransition(async () => {
      const response = await fetch("/api/account/avatar", {
        method: "DELETE",
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean
            message?: string
            user?: {
              image: string | null
            }
          }
        | null

      if (!response.ok || !payload?.success) {
        toast({
          title: "Không thể gỡ ảnh đại diện",
          description: payload?.message ?? "Vui lòng thử lại sau.",
          variant: "destructive",
        })
        return
      }

      await syncSession(payload.user?.image ?? null)

      toast({
        title: "Đã gỡ ảnh đại diện",
        description: "Hồ sơ đã quay về avatar mặc định.",
      })
    })
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-[1.65rem] bg-sky-500/12 blur-xl" />
        <div className="relative rounded-[1.65rem] border border-white/10 bg-background/80 p-1.5 shadow-[0_24px_48px_-28px_rgba(56,189,248,0.38)] backdrop-blur-sm transition-transform duration-200 hover:scale-[1.015]">
          <Avatar className="size-20 rounded-[1.2rem] border border-white/10">
            <AvatarImage src={currentImage ?? "/placeholder-user.jpg"} alt={name} />
            <AvatarFallback className="rounded-[1.2rem] bg-foreground/10 text-xl font-semibold text-foreground">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          accept={avatarUploadConstraints.acceptedMimeTypes.join(",")}
          className="hidden"
          id={fileInputId}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            handleUpload(file)
            event.currentTarget.value = ""
          }}
          type="file"
        />
        <Button
          className="border-sky-500/15 bg-background/70 shadow-[0_18px_32px_-26px_rgba(56,189,248,0.55)] hover:border-sky-400/30 hover:bg-sky-500/8"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          type="button"
          variant="outline"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {currentImage ? "Đổi ảnh" : "Thêm ảnh"}
        </Button>
        {currentImage ? (
          <Button
            className="hover:bg-rose-500/10 hover:text-rose-200"
            disabled={isPending}
            onClick={handleRemove}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
            Gỡ ảnh
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        JPG, PNG hoặc WEBP. Dung lượng tối đa {avatarUploadConstraints.maxBytesLabel}.
      </p>
      <AvatarCropDialog
        fileName={cropFileName}
        imageSrc={cropSource}
        isUploading={isPending}
        onConfirm={async (file) => {
          return await new Promise<boolean>((resolve) => {
            startTransition(async () => {
              const isSuccess = await uploadAvatar(file)
              resolve(isSuccess)
            })
          })
        }}
        onOpenChange={(open) => {
          if (!open) {
            closeCropDialog()
            return
          }

          setIsCropOpen(true)
        }}
        open={isCropOpen}
      />
    </div>
  )
}
