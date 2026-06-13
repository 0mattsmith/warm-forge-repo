import { useEditor } from "@/lib/editor/EditorContext";
import { Play, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export function Timeline() {
  const { state, patch } = useEditor();

  const addFrame = () => {
    const id = Math.random().toString(36).slice(2, 10);
    patch({
      frames: [...state.frames, { id, name: `Frame ${state.frames.length + 1}`, durationMs: 100 }],
    });
  };

  return (
    <div className="h-32 bg-neutral-900 border-t border-neutral-800 text-neutral-200 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-800">
        <span className="text-[10px] uppercase tracking-wider text-neutral-400">Timeline</span>
        <button
          onClick={() => toast.info("Animation playback coming soon")}
          className="ml-2 h-6 w-6 rounded flex items-center justify-center hover:bg-neutral-800"
        >
          <Play className="h-3 w-3" />
        </button>
        <button
          onClick={addFrame}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-neutral-800"
          title="Add frame"
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          onClick={() => toast.info("Duplicate frame coming soon")}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-neutral-800"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={() =>
            patch({
              frames: state.frames.length > 1 ? state.frames.slice(0, -1) : state.frames,
            })
          }
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-neutral-800"
        >
          <Trash2 className="h-3 w-3" />
        </button>
        <span className="text-xs text-neutral-500 ml-2">
          {state.frames.length} frame{state.frames.length !== 1 && "s"}
        </span>
      </div>
      <div className="flex-1 overflow-x-auto flex items-center gap-2 px-3 py-2">
        {state.frames.map((f, i) => (
          <div
            key={f.id}
            className="shrink-0 w-20 h-16 bg-neutral-800 border border-neutral-700 rounded flex flex-col items-center justify-center text-[10px] text-neutral-400 hover:border-cyan-500 cursor-pointer"
          >
            <div className="text-neutral-500">#{i + 1}</div>
            <div className="text-neutral-300">{f.name}</div>
            <div>{f.durationMs}ms</div>
          </div>
        ))}
      </div>
    </div>
  );
}
