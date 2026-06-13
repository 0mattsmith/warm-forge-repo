import {
  Move,
  Square,
  Circle,
  Lasso,
  Wand2,
  PenTool,
  Brush,
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Type,
  Minus,
  Droplets,
  Sparkles,
  Stamp,
  CircleDot,
  Sun,
  ZoomIn,
  Hand,
  Waves,
} from "lucide-react";
import { useEditor } from "@/lib/editor/EditorContext";
import type { ToolId } from "@/lib/editor/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const TOOLS: { id: ToolId; icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string }[] = [
  { id: "move", icon: Move, label: "Move", shortcut: "V" },
  { id: "select-rect", icon: Square, label: "Rectangle Select", shortcut: "M" },
  { id: "select-ellipse", icon: Circle, label: "Ellipse Select" },
  { id: "lasso", icon: Lasso, label: "Lasso", shortcut: "L" },
  { id: "magic-wand", icon: Wand2, label: "Magic Wand", shortcut: "W" },
  { id: "pen", icon: PenTool, label: "Pen / Vector", shortcut: "P" },
  { id: "brush", icon: Brush, label: "Brush", shortcut: "B" },
  { id: "pencil", icon: Pencil, label: "Pencil", shortcut: "N" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
  { id: "fill", icon: PaintBucket, label: "Paint Bucket", shortcut: "G" },
  { id: "gradient", icon: Sun, label: "Gradient" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "shape-rect", icon: Square, label: "Rectangle" },
  { id: "shape-ellipse", icon: Circle, label: "Ellipse" },
  { id: "shape-line", icon: Minus, label: "Line" },
  { id: "eyedropper", icon: Pipette, label: "Eyedropper", shortcut: "I" },
  { id: "liquify", icon: Waves, label: "Liquify (stub)" },
  { id: "smudge", icon: Droplets, label: "Smudge (stub)" },
  { id: "clone", icon: Stamp, label: "Clone (stub)" },
  { id: "blur", icon: CircleDot, label: "Blur (stub)" },
  { id: "sharpen", icon: Sparkles, label: "Sharpen (stub)" },
  { id: "dodge", icon: Sun, label: "Dodge (stub)" },
  { id: "zoom", icon: ZoomIn, label: "Zoom", shortcut: "Z" },
  { id: "hand", icon: Hand, label: "Hand", shortcut: "H" },
];

export function ToolPanel() {
  const { state, set } = useEditor();
  return (
    <div className="flex w-12 flex-col items-center gap-0.5 bg-neutral-900 border-r border-neutral-800 py-2 overflow-y-auto">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const active = state.tool === t.id;
        return (
          <Tooltip key={t.id} delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={() => set("tool", t.id)}
                className={cn(
                  "h-9 w-9 rounded flex items-center justify-center text-neutral-300 hover:bg-neutral-800 transition-colors",
                  active && "bg-cyan-600 text-white hover:bg-cyan-600",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t.label}
              {t.shortcut && <span className="ml-2 opacity-60">{t.shortcut}</span>}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
