'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, ZoomIn, Check } from 'lucide-react';

interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dataUrl: string) => void;
}

const CONTAINER = 300; // canvas display size (px)
const CROP_R = 130;    // crop circle radius
const OUTPUT = 256;    // output image size

export function AvatarCropDialog({ open, onOpenChange, onSave }: AvatarCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = CONTAINER / 2;
    const cy = CONTAINER / 2;

    ctx.clearRect(0, 0, CONTAINER, CONTAINER);

    // Draw image
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const ix = cx + offset.x - iw / 2;
    const iy = cy + offset.y - ih / 2;
    ctx.drawImage(img, ix, iy, iw, ih);

    // Dark overlay with circular hole (even-odd rule)
    ctx.beginPath();
    ctx.rect(0, 0, CONTAINER, CONTAINER);
    ctx.arc(cx, cy, CROP_R, 0, Math.PI * 2, true); // counter-clockwise = hole
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill('evenodd');

    // Circle border
    ctx.beginPath();
    ctx.arc(cx, cy, CROP_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid - rule of thirds (clipped to circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, CROP_R, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    const third = (CROP_R * 2) / 3;
    for (let i = 1; i < 3; i++) {
      // vertical
      ctx.beginPath();
      ctx.moveTo(cx - CROP_R + third * i, cy - CROP_R);
      ctx.lineTo(cx - CROP_R + third * i, cy + CROP_R);
      ctx.stroke();
      // horizontal
      ctx.beginPath();
      ctx.moveTo(cx - CROP_R, cy - CROP_R + third * i);
      ctx.lineTo(cx + CROP_R, cy - CROP_R + third * i);
      ctx.stroke();
    }
    ctx.restore();
  }, [scale, offset]);

  useEffect(() => {
    if (imageSrc) draw();
  }, [imageSrc, draw]);

  const loadImage = (src: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const fitScale = (CROP_R * 2) / Math.min(img.naturalWidth, img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
      setImageSrc(src);
    };
    img.src = src;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragOrigin.current.ox + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.oy + (e.clientY - dragOrigin.current.my),
    });
  };
  const onMouseUp = () => setDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragOrigin.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setOffset({
      x: dragOrigin.current.ox + (t.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.oy + (t.clientY - dragOrigin.current.my),
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.2, Math.min(8, s - e.deltaY * 0.002)));
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement('canvas');
    out.width = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext('2d')!;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();

    const cx = CONTAINER / 2;
    const cy = CONTAINER / 2;
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const ix = cx + offset.x - iw / 2;
    const iy = cy + offset.y - ih / 2;

    // Source rect (what's in the crop circle)
    const srcX = (cx - CROP_R - ix) / scale;
    const srcY = (cy - CROP_R - iy) / scale;
    const srcW = (CROP_R * 2) / scale;
    const srcH = (CROP_R * 2) / scale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT, OUTPUT);

    onSave(out.toDataURL('image/png'));
    handleClose();
  };

  const handleClose = () => {
    setImageSrc(null);
    imgRef.current = null;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Cập nhật ảnh đại diện</DialogTitle>
        </DialogHeader>

        {!imageSrc ? (
          <label className="flex flex-col items-center justify-center gap-3 h-52 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors group">
            <div className="w-14 h-14 rounded-full bg-[#58CC02]/10 flex items-center justify-center group-hover:bg-[#58CC02]/20 transition-colors">
              <Upload className="h-6 w-6 text-[#58CC02]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Nhấn để chọn ảnh</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · Tối đa 10MB</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Canvas */}
            <div className="rounded-2xl overflow-hidden bg-[#111] shadow-md">
              <canvas
                ref={canvasRef}
                width={CONTAINER}
                height={CONTAINER}
                style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', display: 'block' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onMouseUp}
              />
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-3 w-full">
              <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                value={[scale]}
                min={0.2}
                max={8}
                step={0.01}
                onValueChange={([v]) => setScale(v)}
                className="flex-1"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Kéo ảnh để căn chỉnh · Cuộn chuột hoặc kéo thanh để zoom
            </p>

            {/* Buttons */}
            <div className="flex gap-2 w-full">
              <label className="flex-1 cursor-pointer">
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Đổi ảnh
                  </span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              <Button
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-bold shadow-[0_3px_0_0_#46A302] hover:shadow-[0_2px_0_0_#46A302] hover:translate-y-[1px] transition-all"
              >
                <Check className="h-4 w-4 mr-2" />
                Lưu
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
