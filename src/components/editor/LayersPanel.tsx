import { useEditor } from "@/lib/editor/EditorContext";
import {
  Eye,
  EyeOff,
  Lock,
  Plus,
  FolderPlus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type as TypeIcon,
  SlidersHorizontal,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlendMode } from "@/lib/editor/types";

const BLENDS: BlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
];

export function LayersPanel() {
  const {
    state,
    addLayer,
    duplicateLayer,
    deleteLayer,
    renameLayer,
    setLayerVisible,
    setLayerOpacity,
    setLayerBlend,
    moveLayer,
    setActiveLayer,
    activeLayer,
  } = useEditor();

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-neutral-200 text-xs">
      <div className="px-3 py-2 border-b border-neutral-800 font-semibold uppercase tracking-wider text-[10px] text-neutral-400">
        Layers
      </div>

      {activeLayer && (
        <div className="px-3 py-2 border-b border-neutral-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-12 text-neutral-400">Blend</span>
            <Select
              value={activeLayer.blend}
              onValueChange={(v) => setLayerBlend(activeLayer.id, v as BlendMode)}
            >
              <SelectTrigger className="h-7 text-xs bg-neutral-800 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLENDS.map((b) => (
                  <SelectItem key={b} value={b} className="text-xs capitalize">
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-neutral-400">Opacity</span>
            <Slider
              value={[activeLayer.opacity * 100]}
              max={100}
              step={1}
              onValueChange={(v) => setLayerOpacity(activeLayer.id, v[0] / 100)}
              className="flex-1"
            />
            <span className="w-8 text-right tabular-nums">{Math.round(activeLayer.opacity * 100)}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {[...state.layers].reverse().map((l) => {
          const active = l.id === state.activeLayerId;
          return (
            <div
              key={l.id}
              onClick={() => setActiveLayer(l.id)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 border-b border-neutral-800/60 cursor-pointer hover:bg-neutral-800/60",
                active && "bg-cyan-900/40",
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLayerVisible(l.id, !l.visible);
                }}
                className="text-neutral-400 hover:text-white"
              >
                {l.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <div className="h-8 w-8 bg-neutral-800 rounded border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                {l.canvas ? (
                  <LayerThumb canvas={l.canvas} />
                ) : l.kind === "adjustment" ? (
                  <SlidersHorizontal className="h-4 w-4 text-amber-400" />
                ) : l.kind === "text" ? (
                  <TypeIcon className="h-4 w-4 text-cyan-400" />
                ) : (
                  <FolderPlus className="h-4 w-4 text-neutral-500" />
                )}
              </div>
              <input
                value={l.name}
                onChange={(e) => renameLayer(l.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-xs outline-none truncate"
              />
              {l.locked && <Lock className="h-3 w-3 text-neutral-500" />}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 p-1 border-t border-neutral-800 bg-neutral-950">
        <IconBtn title="New layer" onClick={() => addLayer("raster")}>
          <Plus className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="New group" onClick={() => addLayer("group")}>
          <FolderPlus className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="Text layer" onClick={() => addLayer("text")}>
          <TypeIcon className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="Adjustment layer" onClick={() => addLayer("adjustment")}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </IconBtn>
        <div className="flex-1" />
        <IconBtn
          title="Duplicate"
          onClick={() => state.activeLayerId && duplicateLayer(state.activeLayerId)}
        >
          <Copy className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title="Move up"
          onClick={() => state.activeLayerId && moveLayer(state.activeLayerId, 1)}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title="Move down"
          onClick={() => state.activeLayerId && moveLayer(state.activeLayerId, -1)}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title="Delete"
          onClick={() => state.activeLayerId && deleteLayer(state.activeLayerId)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="h-7 w-7 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white"
    >
      {children}
    </button>
  );
}

function LayerThumb({ canvas }: { canvas: HTMLCanvasElement }) {
  return (
    <img
      src={canvas.toDataURL()}
      className="h-full w-full object-contain"
      style={{ imageRendering: "pixelated" }}
      alt=""
    />
  );
}
