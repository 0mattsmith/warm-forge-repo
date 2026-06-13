import { useEffect, useRef, useState } from "react";
import { useEditor } from "@/lib/editor/EditorContext";
import { toast } from "sonner";

export function EditorCanvas() {
  const { state, activeLayer, pushHistory, set, patch } = useEditor();
  const wrapRef = useRef<HTMLDivElement>(null);
  const compositeRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const startPt = useRef<{ x: number; y: number } | null>(null);

  // Repaint composite
  useEffect(() => {
    const c = compositeRef.current;
    if (!c) return;
    c.width = state.width;
    c.height = state.height;
    const ctx = c.getContext("2d")!;
    // checker
    ctx.clearRect(0, 0, c.width, c.height);
    const tile = 16;
    for (let y = 0; y < c.height; y += tile) {
      for (let x = 0; x < c.width; x += tile) {
        ctx.fillStyle = ((x / tile + y / tile) & 1) === 0 ? "#2a2a2a" : "#3a3a3a";
        ctx.fillRect(x, y, tile, tile);
      }
    }
    for (const l of state.layers) {
      if (!l.visible || !l.canvas) continue;
      ctx.globalAlpha = l.opacity;
      ctx.globalCompositeOperation =
        l.blend === "normal" ? "source-over" : (l.blend as GlobalCompositeOperation);
      ctx.drawImage(l.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, [state.layers, state.width, state.height]);

  // Draw selection overlay
  useEffect(() => {
    const o = overlayRef.current;
    if (!o) return;
    o.width = state.width;
    o.height = state.height;
    const ctx = o.getContext("2d")!;
    ctx.clearRect(0, 0, o.width, o.height);
    if (state.selection) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        state.selection.x + 0.5,
        state.selection.y + 0.5,
        state.selection.w,
        state.selection.h,
      );
      ctx.strokeStyle = "#000";
      ctx.lineDashOffset = 4;
      ctx.strokeRect(
        state.selection.x + 0.5,
        state.selection.y + 0.5,
        state.selection.w,
        state.selection.h,
      );
    }
  }, [state.selection, state.width, state.height]);

  const toCanvasCoords = (e: React.PointerEvent) => {
    const rect = compositeRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * state.width,
      y: ((e.clientY - rect.top) / rect.height) * state.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!activeLayer?.canvas || activeLayer.locked) {
      if (activeLayer?.locked) toast.error("Active layer is locked");
      return;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = toCanvasCoords(e);
    lastPt.current = p;
    startPt.current = p;
    setDrawing(true);
    pushHistory(state.tool);

    const ctx = activeLayer.canvas.getContext("2d")!;
    const color = e.button === 2 ? state.secondary : state.primary;

    switch (state.tool) {
      case "brush":
      case "pencil":
      case "eraser": {
        strokeDot(ctx, p, color);
        break;
      }
      case "fill": {
        floodFill(ctx, Math.floor(p.x), Math.floor(p.y), color);
        // force repaint
        patch({ layers: [...state.layers] });
        break;
      }
      case "eyedropper": {
        const data = ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
        const hex = `#${[data[0], data[1], data[2]]
          .map((v) => v.toString(16).padStart(2, "0"))
          .join("")}`;
        set("primary", hex);
        break;
      }
      case "select-rect":
        set("selection", { x: p.x, y: p.y, w: 0, h: 0 });
        break;
    }
  };

  const strokeDot = (
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number },
    color: string,
  ) => {
    ctx.save();
    if (state.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    }
    ctx.fillStyle = color;
    ctx.globalAlpha = state.brushOpacity;
    const r = state.brushSize / 2;
    if (state.tool === "pencil") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // soft brush via radial gradient
      const grad = ctx.createRadialGradient(p.x, p.y, r * state.brushHardness, p.x, p.y, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing || !activeLayer?.canvas) return;
    const p = toCanvasCoords(e);
    const ctx = activeLayer.canvas.getContext("2d")!;
    const color = state.primary;
    switch (state.tool) {
      case "brush":
      case "pencil":
      case "eraser": {
        // interpolate
        const last = lastPt.current!;
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        const dist = Math.hypot(dx, dy);
        const step = Math.max(1, state.brushSize / 4);
        const n = Math.max(1, Math.floor(dist / step));
        for (let i = 1; i <= n; i++) {
          strokeDot(ctx, { x: last.x + (dx * i) / n, y: last.y + (dy * i) / n }, color);
        }
        break;
      }
      case "select-rect": {
        const s = startPt.current!;
        set("selection", {
          x: Math.min(s.x, p.x),
          y: Math.min(s.y, p.y),
          w: Math.abs(p.x - s.x),
          h: Math.abs(p.y - s.y),
        });
        break;
      }
    }
    lastPt.current = p;
    // trigger repaint
    patch({ layers: [...state.layers] });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drawing || !activeLayer?.canvas) {
      setDrawing(false);
      return;
    }
    const p = toCanvasCoords(e);
    const ctx = activeLayer.canvas.getContext("2d")!;
    const s = startPt.current!;
    if (state.tool === "shape-rect") {
      ctx.fillStyle = state.primary;
      ctx.globalAlpha = state.brushOpacity;
      ctx.fillRect(Math.min(s.x, p.x), Math.min(s.y, p.y), Math.abs(p.x - s.x), Math.abs(p.y - s.y));
      ctx.globalAlpha = 1;
      patch({ layers: [...state.layers] });
    } else if (state.tool === "shape-ellipse") {
      ctx.fillStyle = state.primary;
      ctx.globalAlpha = state.brushOpacity;
      ctx.beginPath();
      ctx.ellipse(
        (s.x + p.x) / 2,
        (s.y + p.y) / 2,
        Math.abs(p.x - s.x) / 2,
        Math.abs(p.y - s.y) / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      patch({ layers: [...state.layers] });
    } else if (state.tool === "shape-line") {
      ctx.strokeStyle = state.primary;
      ctx.lineWidth = state.brushSize;
      ctx.lineCap = "round";
      ctx.globalAlpha = state.brushOpacity;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      patch({ layers: [...state.layers] });
    } else if (state.tool === "text") {
      const content = prompt("Enter text:");
      if (content) {
        ctx.fillStyle = state.primary;
        ctx.font = `${Math.max(12, state.brushSize * 2)}px sans-serif`;
        ctx.fillText(content, s.x, s.y);
        patch({ layers: [...state.layers] });
      }
    }
    setDrawing(false);
    lastPt.current = null;
    startPt.current = null;
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-auto bg-neutral-900 flex items-center justify-center"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="relative shadow-2xl"
        style={{
          width: state.width * state.zoom,
          height: state.height * state.zoom,
        }}
      >
        <canvas
          ref={compositeRef}
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: "pixelated" }}
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
          style={{ imageRendering: "pixelated" }}
        />
        <div
          className="absolute inset-0"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            cursor:
              state.tool === "eyedropper"
                ? "crosshair"
                : state.tool === "hand"
                  ? "grab"
                  : "crosshair",
          }}
        />
        {state.showGrid && (
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}
        {state.guides.map((g) => (
          <div
            key={g.id}
            className="absolute bg-cyan-400/70 pointer-events-none"
            style={
              g.orientation === "h"
                ? { left: 0, right: 0, top: g.position * state.zoom, height: 1 }
                : { top: 0, bottom: 0, left: g.position * state.zoom, width: 1 }
            }
          />
        ))}
      </div>
    </div>
  );
}

function floodFill(ctx: CanvasRenderingContext2D, x: number, y: number, hex: string) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const idx = (y * w + x) * 4;
  const tr = data[idx],
    tg = data[idx + 1],
    tb = data[idx + 2],
    ta = data[idx + 3];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (tr === r && tg === g && tb === b && ta === 255) return;
  const stack = [[x, y]];
  const match = (i: number) =>
    data[i] === tr && data[i + 1] === tg && data[i + 2] === tb && data[i + 3] === ta;
  let count = 0;
  while (stack.length && count < w * h) {
    count++;
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
    const i = (cy * w + cx) * 4;
    if (!match(i)) continue;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  ctx.putImageData(img, 0, 0);
}
