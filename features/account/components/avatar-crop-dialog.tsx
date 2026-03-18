"use client"
/* eslint-disable @next/next/no-img-element */

import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Crop, Move, RefreshCw, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const CROPPER_VIEWPORT_SIZE = 288
const CROPPER_OUTPUT_SIZE = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 2.8

interface AvatarCropDialogProps {
  open: boolean
  imageSrc: string | null
  fileName: string
  isUploading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => Promise<boolean>
}

interface ImageSize {
  width: number
  height: number
}

interface Offset {
  x: number
  y: number
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

function getBaseScale(imageSize: ImageSize | null) {
  if (!imageSize) {
    return 1
  }

  return Math.max(
    CROPPER_VIEWPORT_SIZE / imageSize.width,
    CROPPER_VIEWPORT_SIZE / imageSize.height
  )
}

function clampOffset(offset: Offset, imageSize: ImageSize | null, scale: number): Offset {
  if (!imageSize) {
    return { x: 0, y: 0 }
  }

  const renderedWidth = imageSize.width * scale
  const renderedHeight = imageSize.height * scale
  const maxX = Math.max(0, (renderedWidth - CROPPER_VIEWPORT_SIZE) / 2)
  const maxY = Math.max(0, (renderedHeight - CROPPER_VIEWPORT_SIZE) / 2)

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  }
}

async function createCroppedAvatarFile({
  fileName,
  imageElement,
  imageSize,
  offset,
  scale,
}: {
  fileName: string
  imageElement: HTMLImageElement
  imageSize: ImageSize
  offset: Offset
  scale: number
}) {
  const sourceX = ((imageSize.width * scale - CROPPER_VIEWPORT_SIZE) / 2 - offset.x) / scale
  const sourceY = ((imageSize.height * scale - CROPPER_VIEWPORT_SIZE) / 2 - offset.y) / scale
  const sourceSize = CROPPER_VIEWPORT_SIZE / scale

  const canvas = document.createElement("canvas")
  canvas.width = CROPPER_OUTPUT_SIZE
  canvas.height = CROPPER_OUTPUT_SIZE

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Không thể khởi tạo công cụ crop ảnh.")
  }

  context.drawImage(
    imageElement,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    CROPPER_OUTPUT_SIZE,
    CROPPER_OUTPUT_SIZE
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("Không thể tạo ảnh sau khi cắt."))
          return
        }

        resolve(nextBlob)
      },
      "image/webp",
      0.92
    )
  })

  const normalizedName = fileName.replace(/\.[^/.]+$/, "") || "avatar"
  return new File([blob], `${normalizedName}-avatar.webp`, { type: "image/webp" })
}

export function AvatarCropDialog({
  fileName,
  imageSrc,
  isUploading = false,
  onConfirm,
  onOpenChange,
  open,
}: AvatarCropDialogProps) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState<ImageSize | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const baseScale = useMemo(() => getBaseScale(imageSize), [imageSize])
  const activeScale = baseScale * zoom
  const safeOffset = useMemo(
    () => clampOffset(offset, imageSize, activeScale),
    [activeScale, imageSize, offset]
  )

  useEffect(() => {
    if (!open) {
      setZoom(MIN_ZOOM)
      setOffset({ x: 0, y: 0 })
      setImageSize(null)
      setDragState(null)
      setIsSaving(false)
    }
  }, [open, imageSrc])

  const resetCrop = () => {
    setZoom(MIN_ZOOM)
    setOffset({ x: 0, y: 0 })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!imageSize || isSaving || isUploading) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: safeOffset.x,
      originY: safeOffset.y,
    })
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId || !imageSize) {
      return
    }

    const nextOffset = clampOffset(
      {
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      },
      imageSize,
      activeScale
    )

    setOffset(nextOffset)
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragState?.pointerId === event.pointerId) {
      setDragState(null)
    }
  }

  const handleSave = async () => {
    if (!imageRef.current || !imageSize) {
      return
    }

    setIsSaving(true)

    try {
      const croppedFile = await createCroppedAvatarFile({
        fileName,
        imageElement: imageRef.current,
        imageSize,
        offset: safeOffset,
        scale: activeScale,
      })

      const isSuccess = await onConfirm(croppedFile)
      if (isSuccess) {
        onOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !(isUploading || isSaving) && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-3xl border-white/10 bg-background/96 p-0 shadow-[0_36px_90px_-48px_rgba(56,189,248,0.35)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[inherit] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_100%),linear-gradient(180deg,rgba(14,23,38,0.98)_0%,rgba(9,15,28,0.98)_100%)]">
          <div className="border-b border-white/6 bg-gradient-to-r from-sky-500/10 via-cyan-400/6 to-violet-500/8 px-6 py-5">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Cắt và căn chỉnh ảnh đại diện
              </DialogTitle>
              <DialogDescription className="max-w-2xl leading-7 text-muted-foreground">
                Ảnh đại diện sẽ được cắt theo tỉ lệ 1:1. Kéo ảnh để canh bố cục và dùng thanh zoom để chọn khung hiển thị phù hợp.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="premium-card premium-card-muted rounded-[1.75rem] p-5">
                <div
                  className={cn(
                    "relative mx-auto size-[288px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                    imageSize ? "cursor-grab active:cursor-grabbing" : "cursor-wait"
                  )}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onPointerLeave={handlePointerEnd}
                >
                  {imageSrc ? (
                    <img
                      ref={imageRef}
                      alt="Avatar preview"
                      className="pointer-events-none absolute max-w-none select-none"
                      draggable={false}
                      onLoad={(event) => {
                        const nextImage = event.currentTarget
                        setImageSize({
                          width: nextImage.naturalWidth,
                          height: nextImage.naturalHeight,
                        })
                      }}
                      src={imageSrc}
                      style={{
                        width: imageSize ? `${imageSize.width * activeScale}px` : undefined,
                        height: imageSize ? `${imageSize.height * activeScale}px` : undefined,
                        left: imageSize
                          ? `${(CROPPER_VIEWPORT_SIZE - imageSize.width * activeScale) / 2 + safeOffset.x}px`
                          : 0,
                        top: imageSize
                          ? `${(CROPPER_VIEWPORT_SIZE - imageSize.height * activeScale) / 2 + safeOffset.y}px`
                          : 0,
                      }}
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10" />
                </div>
              </div>

              <div className="grid gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <ZoomIn className="size-4 text-sky-300" />
                    Thu phóng
                  </div>
                  <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
                </div>
                <Slider
                  className="[&_[data-slot=slider-range]]:bg-sky-400 [&_[data-slot=slider-thumb]]:border-sky-400 [&_[data-slot=slider-thumb]]:bg-background"
                  max={MAX_ZOOM}
                  min={MIN_ZOOM}
                  onValueChange={(value) => {
                    const nextZoom = value[0] ?? MIN_ZOOM
                    setZoom(nextZoom)
                    setOffset((currentOffset) =>
                      clampOffset(currentOffset, imageSize, baseScale * nextZoom)
                    )
                  }}
                  step={0.05}
                  value={[zoom]}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="premium-card premium-card-muted rounded-[1.5rem] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Crop className="size-4 text-cyan-300" />
                  Xem trước 1:1
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="relative size-32 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/50">
                    {imageSrc && imageSize ? (
                      <img
                        alt="Avatar preview nhỏ"
                        className="pointer-events-none absolute max-w-none select-none"
                        draggable={false}
                        src={imageSrc}
                        style={{
                          width: `${imageSize.width * activeScale * (128 / CROPPER_VIEWPORT_SIZE)}px`,
                          height: `${imageSize.height * activeScale * (128 / CROPPER_VIEWPORT_SIZE)}px`,
                          left: `${((CROPPER_VIEWPORT_SIZE - imageSize.width * activeScale) / 2 + safeOffset.x) * (128 / CROPPER_VIEWPORT_SIZE)}px`,
                          top: `${((CROPPER_VIEWPORT_SIZE - imageSize.height * activeScale) / 2 + safeOffset.y) * (128 / CROPPER_VIEWPORT_SIZE)}px`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Ảnh sẽ được xuất ra dạng vuông chuẩn avatar, phù hợp cho profile, sidebar và các khu account khác.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-foreground">Mẹo căn ảnh</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                  <li className="flex gap-2">
                    <Move className="mt-1 size-4 shrink-0 text-sky-300" />
                    Kéo ảnh để đặt khuôn mặt hoặc chủ thể vào giữa khung vuông.
                  </li>
                  <li className="flex gap-2">
                    <ZoomIn className="mt-1 size-4 shrink-0 text-cyan-300" />
                    Zoom nhẹ nếu ảnh quá rộng hoặc cần lấy cận cảnh hơn.
                  </li>
                  <li className="flex gap-2">
                    <RefreshCw className="mt-1 size-4 shrink-0 text-violet-300" />
                    Dùng nút đặt lại nếu muốn quay về vị trí mặc định.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/6 px-6 py-5 sm:justify-between">
            <Button
              className="border-white/10 bg-white/[0.03] hover:border-cyan-400/24 hover:bg-cyan-500/8"
              onClick={resetCrop}
              type="button"
              variant="outline"
            >
              <RefreshCw className="size-4" />
              Đặt lại
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                className="border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]"
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Huỷ
              </Button>
              <Button
                className="border border-sky-400/18 bg-foreground text-background shadow-[0_20px_36px_-24px_rgba(56,189,248,0.5)] hover:-translate-y-0.5 hover:border-sky-300/28 hover:bg-foreground/92 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/92"
                disabled={!imageSize || isSaving || isUploading}
                onClick={() => void handleSave()}
                type="button"
              >
                {isSaving || isUploading ? "Đang lưu..." : "Lưu ảnh đã cắt"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
