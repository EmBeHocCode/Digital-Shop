"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faCircleCheck,
  faCloudArrowUp,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus
} from "@fortawesome/free-solid-svg-icons";
import { acceptedAvatarMimeTypes, maxUploadSizeInBytes } from "@/constants/media";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  serializeSessionUser,
  sessionUserUpdatedEventName,
  type SessionUserCookie
} from "@/services/auth-service";
import type { User } from "@/types/domain";

type NoticeState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

async function createImage(imageSource: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Không thể đọc ảnh đã chọn.")));
    image.src = imageSource;
  });
}

async function getCroppedAvatarBlob(imageSource: string, cropArea: Area, mimeType: string) {
  const image = await createImage(imageSource);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Trình duyệt hiện tại không hỗ trợ chỉnh ảnh.");
  }

  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  const outputMimeType =
    mimeType === "image/png" || mimeType === "image/webp" ? mimeType : "image/jpeg";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không tạo được ảnh sau khi cắt."));
          return;
        }

        resolve(blob);
      },
      outputMimeType,
      outputMimeType === "image/jpeg" ? 0.92 : undefined
    );
  });
}

function getExtensionFromMimeType(fileType: string) {
  if (fileType === "image/png") {
    return ".png";
  }

  if (fileType === "image/webp") {
    return ".webp";
  }

  return ".jpg";
}

function formatMaxUploadSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function toSessionCookieUser(user: User): SessionUserCookie {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar
  };
}

export function ProfileAvatarUploader({ user }: { user: User }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [displayUser, setDisplayUser] = useState(user);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState("image/jpeg");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const maxUploadSizeLabel = useMemo(
    () => formatMaxUploadSize(maxUploadSizeInBytes),
    []
  );

  const resetCropState = useCallback(() => {
    if (imageSource?.startsWith("blob:")) {
      URL.revokeObjectURL(imageSource);
    }

    setImageSource(null);
    setSelectedMimeType("image/jpeg");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsModalOpen(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [imageSource]);

  const handleCropComplete = useCallback((_croppedArea: Area, nextCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setNotice(null);

    if (!acceptedAvatarMimeTypes.includes(file.type)) {
      setNotice({
        type: "error",
        message: "Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP cho ảnh đại diện."
      });
      event.target.value = "";
      return;
    }

    if (file.size > maxUploadSizeInBytes) {
      setNotice({
        type: "error",
        message: `Ảnh đại diện cần nhỏ hơn ${maxUploadSizeLabel}.`
      });
      event.target.value = "";
      return;
    }

    const nextImageSource = URL.createObjectURL(file);
    setImageSource(nextImageSource);
    setSelectedMimeType(file.type);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsModalOpen(true);
  };

  const handleUploadAvatar = async () => {
    if (!imageSource || !croppedAreaPixels) {
      setNotice({
        type: "error",
        message: "Hãy chọn vùng cắt trước khi lưu ảnh đại diện."
      });
      return;
    }

    setIsSaving(true);
    setNotice(null);

    try {
      const croppedBlob = await getCroppedAvatarBlob(
        imageSource,
        croppedAreaPixels,
        selectedMimeType
      );
      const croppedFile = new File(
        [croppedBlob],
        `avatar-${Date.now()}${getExtensionFromMimeType(croppedBlob.type || selectedMimeType)}`,
        {
          type: croppedBlob.type || selectedMimeType
        }
      );

      const formData = new FormData();
      formData.append("avatar", croppedFile);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        user?: User;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.message || "Không thể cập nhật ảnh đại diện.");
      }

      const updatedUser = payload.user;
      setDisplayUser(updatedUser);
      document.cookie = `meowmarket-user=${serializeSessionUser(
        toSessionCookieUser(updatedUser)
      )}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      window.dispatchEvent(
        new CustomEvent(sessionUserUpdatedEventName, {
          detail: toSessionCookieUser(updatedUser)
        })
      );

      setNotice({
        type: "success",
        message: "Ảnh đại diện đã được cập nhật."
      });
      resetCropState();
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Có lỗi xảy ra khi tải ảnh đại diện lên."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-[28px] border border-white/70 bg-gradient-to-br from-[#fff0f6] to-[#eef3ff] p-6 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar
              fullName={displayUser.fullName}
              avatar={displayUser.avatar}
              size={104}
              className="ring-4 ring-white/70"
            />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted">
                Ảnh đại diện
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink">{displayUser.fullName}</h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
                Tải ảnh mới và căn chỉnh vùng cắt hình vuông để avatar hiển thị đẹp ở header,
                profile và các màn hỗ trợ sau này.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <input
              ref={inputRef}
              type="file"
              accept={acceptedAvatarMimeTypes.join(",")}
              className="hidden"
              onChange={handleFileSelection}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
            >
              <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
              Đổi ảnh đại diện
            </button>
            <p className="text-xs text-muted">
              Hỗ trợ PNG, JPG, WEBP. Dung lượng tối đa {maxUploadSizeLabel}.
            </p>
          </div>
        </div>
        {notice ? (
          <div
            className={`mt-5 rounded-[20px] px-4 py-3 text-sm font-medium ${
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            {notice.type === "success" ? (
              <FontAwesomeIcon icon={faCircleCheck} className="mr-2 h-4 w-4" />
            ) : null}
            {notice.message}
          </div>
        ) : null}
      </div>

      <Modal
        open={isModalOpen}
        title="Cắt ảnh đại diện"
        onClose={() => {
          if (!isSaving) {
            resetCropState();
          }
        }}
      >
        <div className="space-y-5">
          <div className="relative h-[320px] overflow-hidden rounded-[24px] bg-slate-950">
            {imageSource ? (
              <Cropper
                image={imageSource}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-ink">
              <span>Phóng to</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="h-4 w-4 text-muted" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary"
              />
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="h-4 w-4 text-muted" />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={resetCropState}
              disabled={isSaving}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleUploadAvatar}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FontAwesomeIcon
                icon={faCloudArrowUp}
                className={`h-4 w-4 ${isSaving ? "animate-pulse" : ""}`}
              />
              {isSaving ? "Đang lưu avatar..." : "Lưu avatar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
