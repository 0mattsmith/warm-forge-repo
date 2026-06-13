import { useEditor } from "@/lib/editor/EditorContext";
import { ZoomIn, ZoomOut } from "lucide-react";

export function StatusBar() {
  const { state, set, activeLayer } = useEditor();
  return (
    <div className="h-7 bg-neutral-950 border-t border-neutral-800 text-neutral-400 text-[11px] flex items-center gap-4 px-3">
      <span>{state.docName}</span>
      <span>
        {state.width} × {state.height} px
      </span>
      <span>Tool: <span className="text-neutral-200 capitalize">{state.tool.replace("-", " ")}</span></span>
      <span>Layer: <span className="text-neutral-200">{activeLayer?.name ?? "—"}</span></span>
      <div className="flex-1" />
      <button
        onClick={() => set("zoom", Math.max(0.1, state.zoom / 1.25))}
        className="h-5 w-5 flex items-center justify-center hover:bg-neutral-800 rounded"
      >
        <ZoomOut className="h-3 w-3" />
      </button>
      <span className="tabular-nums w-12 text-center">{Math.round(state.zoom * 100)}%</span>
      <button
        onClick={() => set("zoom", Math.min(8, state.zoom * 1.25))}
        className="h-5 w-5 flex items-center justify-center hover:bg-neutral-800 rounded"
      >
        <ZoomIn className="h-3 w-3" />
      </button>
    </div>
  );
}
