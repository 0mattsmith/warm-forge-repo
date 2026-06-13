import { useEditor } from "@/lib/editor/EditorContext";
import { Slider } from "@/components/ui/slider";
import { LayersPanel } from "./LayersPanel";
import { History, Image as ImageIcon, Layers as LayersIcon, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RightPanels() {
  const { state, set, history, undo } = useEditor();

  return (
    <div className="w-72 flex flex-col bg-neutral-900 border-l border-neutral-800 text-neutral-200">
      <div className="p-3 border-b border-neutral-800 space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-neutral-400">Colors</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              value={state.primary}
              onChange={(e) => set("primary", e.target.value)}
              className="h-10 w-10 border-2 border-neutral-700 rounded cursor-pointer bg-transparent"
            />
          </div>
          <button
            onClick={() => {
              const a = state.primary;
              set("primary", state.secondary);
              set("secondary", a);
            }}
            className="text-xs text-neutral-400 hover:text-white px-1"
            title="Swap"
          >
            ⇄
          </button>
          <input
            type="color"
            value={state.secondary}
            onChange={(e) => set("secondary", e.target.value)}
            className="h-10 w-10 border-2 border-neutral-700 rounded cursor-pointer bg-transparent"
          />
          <div className="flex-1 text-xs">
            <div className="font-mono">{state.primary}</div>
            <div className="font-mono text-neutral-500">{state.secondary}</div>
          </div>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {[
            "#000000",
            "#ffffff",
            "#ff0000",
            "#ff8800",
            "#ffee00",
            "#00cc00",
            "#00aaff",
            "#0044ff",
            "#aa00ff",
            "#ff00aa",
          ].map((c) => (
            <button
              key={c}
              onClick={() => set("primary", c)}
              className="h-5 rounded border border-neutral-700"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div className="p-3 border-b border-neutral-800 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-neutral-400">Brush</div>
        <Row label={`Size: ${state.brushSize}`}>
          <Slider
            value={[state.brushSize]}
            min={1}
            max={300}
            step={1}
            onValueChange={(v) => set("brushSize", v[0])}
          />
        </Row>
        <Row label={`Hardness: ${Math.round(state.brushHardness * 100)}%`}>
          <Slider
            value={[state.brushHardness * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => set("brushHardness", v[0] / 100)}
          />
        </Row>
        <Row label={`Opacity: ${Math.round(state.brushOpacity * 100)}%`}>
          <Slider
            value={[state.brushOpacity * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => set("brushOpacity", v[0] / 100)}
          />
        </Row>
        <Row label={`Feather: ${state.featherPx}px`}>
          <Slider
            value={[state.featherPx]}
            min={0}
            max={50}
            step={1}
            onValueChange={(v) => set("featherPx", v[0])}
          />
        </Row>
      </div>

      <Tabs defaultValue="layers" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start bg-neutral-950 rounded-none border-b border-neutral-800 h-9">
          <TabsTrigger value="layers" className="text-xs gap-1">
            <LayersIcon className="h-3 w-3" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1">
            <History className="h-3 w-3" />
            History
          </TabsTrigger>
          <TabsTrigger value="adjust" className="text-xs gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Adjust
          </TabsTrigger>
          <TabsTrigger value="nav" className="text-xs gap-1">
            <ImageIcon className="h-3 w-3" />
            Nav
          </TabsTrigger>
        </TabsList>
        <TabsContent value="layers" className="flex-1 mt-0 min-h-0">
          <LayersPanel />
        </TabsContent>
        <TabsContent value="history" className="flex-1 mt-0 overflow-auto text-xs">
          <div className="p-2 space-y-0.5">
            {history.past.length === 0 && (
              <div className="text-neutral-500 italic">No history yet</div>
            )}
            {history.past.map((h, i) => (
              <div key={i} className="px-2 py-1 hover:bg-neutral-800 rounded">
                {h.label}
              </div>
            ))}
            <button
              onClick={undo}
              className="mt-2 w-full text-left px-2 py-1 bg-neutral-800 rounded hover:bg-neutral-700"
            >
              Undo last
            </button>
          </div>
        </TabsContent>
        <TabsContent value="adjust" className="flex-1 mt-0 overflow-auto text-xs p-3 space-y-3">
          <div className="text-neutral-400">Non-destructive adjustments (stubbed)</div>
          {["Brightness/Contrast", "Hue/Saturation", "Levels", "Curves", "Color Balance", "Black & White", "Photo Filter", "Channel Mixer", "Invert", "Posterize", "Threshold"].map(
            (a) => (
              <button
                key={a}
                onClick={() => alert(`${a}: coming soon as adjustment layer`)}
                className="block w-full text-left px-2 py-1 bg-neutral-800/50 rounded hover:bg-neutral-800"
              >
                {a}
              </button>
            ),
          )}
        </TabsContent>
        <TabsContent value="nav" className="flex-1 mt-0 overflow-auto text-xs p-3">
          <div className="text-neutral-400">
            Document {state.width}×{state.height}
            <br />
            Zoom: {Math.round(state.zoom * 100)}%
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-neutral-400 mb-1">{label}</div>
      {children}
    </div>
  );
}
