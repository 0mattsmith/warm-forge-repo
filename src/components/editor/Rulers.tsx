import { useEditor } from "@/lib/editor/EditorContext";

export function Rulers({ children }: { children: React.ReactNode }) {
  const { state } = useEditor();
  if (!state.showRulers) return <>{children}</>;
  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div className="h-5 bg-neutral-950 border-b border-neutral-800 flex items-end overflow-hidden text-[9px] text-neutral-500 pl-5">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="shrink-0 border-l border-neutral-700/60 h-2 px-1" style={{ width: 50 }}>
            {i * 50}
          </div>
        ))}
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="w-5 bg-neutral-950 border-r border-neutral-800 flex flex-col items-end overflow-hidden text-[9px] text-neutral-500">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 border-t border-neutral-700/60 w-2 text-right pr-0.5"
              style={{ height: 50 }}
            >
              {i * 50}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
