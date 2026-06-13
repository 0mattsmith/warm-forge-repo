import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { BlendMode, Guide, Layer, ToolId } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

function makeCanvas(w: number, h: number, fill?: string) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  if (fill) {
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
  }
  return c;
}

export interface EditorState {
  docName: string;
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  tool: ToolId;
  primary: string;
  secondary: string;
  brushSize: number;
  brushHardness: number;
  brushOpacity: number;
  layers: Layer[];
  activeLayerId: string | null;
  guides: Guide[];
  showRulers: boolean;
  showGrid: boolean;
  // Animation
  frames: { id: string; name: string; durationMs: number }[];
  activeFrameId: string | null;
  // Selection rect (in canvas px)
  selection: { x: number; y: number; w: number; h: number } | null;
  featherPx: number;
}

interface HistoryEntry {
  label: string;
  layers: Layer[]; // shallow copies; canvases are cloned
  activeLayerId: string | null;
}

interface EditorContextValue {
  state: EditorState;
  set: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  patch: (p: Partial<EditorState>) => void;
  newDoc: (w: number, h: number, bg?: string) => void;
  addLayer: (kind?: Layer["kind"], name?: string) => string;
  duplicateLayer: (id: string) => void;
  deleteLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  setLayerVisible: (id: string, v: boolean) => void;
  setLayerOpacity: (id: string, o: number) => void;
  setLayerBlend: (id: string, b: BlendMode) => void;
  moveLayer: (id: string, dir: -1 | 1) => void;
  setActiveLayer: (id: string) => void;
  pushHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;
  history: { past: HistoryEntry[]; future: HistoryEntry[] };
  addGuide: (g: Omit<Guide, "id">) => void;
  clearGuides: () => void;
  importImage: (img: HTMLImageElement, name: string) => void;
  composite: () => HTMLCanvasElement;
  activeLayer: Layer | null;
}

const EditorContext = createContext<EditorContextValue | null>(null);

function cloneLayer(l: Layer): Layer {
  let canvas: HTMLCanvasElement | undefined;
  if (l.canvas) {
    canvas = makeCanvas(l.canvas.width, l.canvas.height);
    canvas.getContext("2d")!.drawImage(l.canvas, 0, 0);
  }
  return { ...l, canvas };
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const initialW = 800;
  const initialH = 600;
  const bgLayer: Layer = {
    id: uid(),
    name: "Background",
    kind: "raster",
    visible: true,
    locked: false,
    opacity: 1,
    blend: "normal",
    canvas: makeCanvas(initialW, initialH, "#ffffff"),
  };
  const layer1: Layer = {
    id: uid(),
    name: "Layer 1",
    kind: "raster",
    visible: true,
    locked: false,
    opacity: 1,
    blend: "normal",
    canvas: makeCanvas(initialW, initialH),
  };

  const [state, setState] = useState<EditorState>({
    docName: "Untitled.psd",
    width: initialW,
    height: initialH,
    zoom: 1,
    pan: { x: 0, y: 0 },
    tool: "brush",
    primary: "#000000",
    secondary: "#ffffff",
    brushSize: 12,
    brushHardness: 0.8,
    brushOpacity: 1,
    layers: [bgLayer, layer1],
    activeLayerId: layer1.id,
    guides: [],
    showRulers: true,
    showGrid: false,
    frames: [{ id: uid(), name: "Frame 1", durationMs: 100 }],
    activeFrameId: null,
    selection: null,
    featherPx: 0,
  });

  const historyRef = useRef<{ past: HistoryEntry[]; future: HistoryEntry[] }>({
    past: [],
    future: [],
  });
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  const set = useCallback(<K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const patch = useCallback((p: Partial<EditorState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const pushHistory = useCallback((label: string) => {
    setState((s) => {
      historyRef.current.past.push({
        label,
        layers: s.layers.map(cloneLayer),
        activeLayerId: s.activeLayerId,
      });
      if (historyRef.current.past.length > 50) historyRef.current.past.shift();
      historyRef.current.future = [];
      return s;
    });
    refresh();
  }, []);

  const undo = useCallback(() => {
    const past = historyRef.current.past;
    if (!past.length) return;
    setState((s) => {
      const snap = past.pop()!;
      historyRef.current.future.push({
        label: snap.label,
        layers: s.layers.map(cloneLayer),
        activeLayerId: s.activeLayerId,
      });
      return { ...s, layers: snap.layers, activeLayerId: snap.activeLayerId };
    });
    refresh();
  }, []);

  const redo = useCallback(() => {
    const future = historyRef.current.future;
    if (!future.length) return;
    setState((s) => {
      const snap = future.pop()!;
      historyRef.current.past.push({
        label: snap.label,
        layers: s.layers.map(cloneLayer),
        activeLayerId: s.activeLayerId,
      });
      return { ...s, layers: snap.layers, activeLayerId: snap.activeLayerId };
    });
    refresh();
  }, []);

  const newDoc = useCallback((w: number, h: number, bg = "#ffffff") => {
    const bgL: Layer = {
      id: uid(),
      name: "Background",
      kind: "raster",
      visible: true,
      locked: false,
      opacity: 1,
      blend: "normal",
      canvas: makeCanvas(w, h, bg),
    };
    const l1: Layer = {
      id: uid(),
      name: "Layer 1",
      kind: "raster",
      visible: true,
      locked: false,
      opacity: 1,
      blend: "normal",
      canvas: makeCanvas(w, h),
    };
    historyRef.current = { past: [], future: [] };
    setState((s) => ({
      ...s,
      width: w,
      height: h,
      layers: [bgL, l1],
      activeLayerId: l1.id,
      pan: { x: 0, y: 0 },
      zoom: 1,
      selection: null,
    }));
  }, []);

  const addLayer = useCallback(
    (kind: Layer["kind"] = "raster", name?: string) => {
      const id = uid();
      setState((s) => {
        const layer: Layer = {
          id,
          name:
            name ??
            (kind === "group"
              ? `Group ${s.layers.filter((l) => l.kind === "group").length + 1}`
              : kind === "text"
                ? `Text ${s.layers.filter((l) => l.kind === "text").length + 1}`
                : kind === "adjustment"
                  ? `Adjustment ${s.layers.filter((l) => l.kind === "adjustment").length + 1}`
                  : `Layer ${s.layers.length}`),
          kind,
          visible: true,
          locked: false,
          opacity: 1,
          blend: "normal",
          canvas: kind === "group" ? undefined : makeCanvas(s.width, s.height),
          children: kind === "group" ? [] : undefined,
        };
        return { ...s, layers: [...s.layers, layer], activeLayerId: id };
      });
      return id;
    },
    [],
  );

  const duplicateLayer = useCallback((id: string) => {
    setState((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx < 0) return s;
      const dup = cloneLayer(s.layers[idx]);
      dup.id = uid();
      dup.name = `${s.layers[idx].name} copy`;
      const layers = [...s.layers];
      layers.splice(idx + 1, 0, dup);
      return { ...s, layers, activeLayerId: dup.id };
    });
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setState((s) => {
      if (s.layers.length <= 1) return s;
      const layers = s.layers.filter((l) => l.id !== id);
      const active = s.activeLayerId === id ? layers[layers.length - 1].id : s.activeLayerId;
      return { ...s, layers, activeLayerId: active };
    });
  }, []);

  const renameLayer = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) => (l.id === id ? { ...l, name } : l)),
    }));
  }, []);

  const setLayerVisible = useCallback((id: string, v: boolean) => {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) => (l.id === id ? { ...l, visible: v } : l)),
    }));
  }, []);

  const setLayerOpacity = useCallback((id: string, o: number) => {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) => (l.id === id ? { ...l, opacity: o } : l)),
    }));
  }, []);

  const setLayerBlend = useCallback((id: string, b: BlendMode) => {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) => (l.id === id ? { ...l, blend: b } : l)),
    }));
  }, []);

  const moveLayer = useCallback((id: string, dir: -1 | 1) => {
    setState((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx < 0) return s;
      const next = idx + dir;
      if (next < 0 || next >= s.layers.length) return s;
      const layers = [...s.layers];
      [layers[idx], layers[next]] = [layers[next], layers[idx]];
      return { ...s, layers };
    });
  }, []);

  const setActiveLayer = useCallback((id: string) => {
    setState((s) => ({ ...s, activeLayerId: id }));
  }, []);

  const addGuide = useCallback((g: Omit<Guide, "id">) => {
    setState((s) => ({ ...s, guides: [...s.guides, { ...g, id: uid() }] }));
  }, []);

  const clearGuides = useCallback(() => {
    setState((s) => ({ ...s, guides: [] }));
  }, []);

  const importImage = useCallback((img: HTMLImageElement, name: string) => {
    setState((s) => {
      const w = Math.max(s.width, img.width);
      const h = Math.max(s.height, img.height);
      const c = makeCanvas(w, h);
      c.getContext("2d")!.drawImage(img, 0, 0);
      const layer: Layer = {
        id: uid(),
        name,
        kind: "raster",
        visible: true,
        locked: false,
        opacity: 1,
        blend: "normal",
        canvas: c,
      };
      return { ...s, width: w, height: h, layers: [...s.layers, layer], activeLayerId: layer.id };
    });
  }, []);

  const composite = useCallback(() => {
    const out = makeCanvas(state.width, state.height);
    const ctx = out.getContext("2d")!;
    for (const l of state.layers) {
      if (!l.visible || !l.canvas) continue;
      ctx.globalAlpha = l.opacity;
      ctx.globalCompositeOperation =
        l.blend === "normal" ? "source-over" : (l.blend as GlobalCompositeOperation);
      ctx.drawImage(l.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    return out;
  }, [state.layers, state.width, state.height]);

  const activeLayer = useMemo(
    () => state.layers.find((l) => l.id === state.activeLayerId) ?? null,
    [state.layers, state.activeLayerId],
  );

  const value: EditorContextValue = {
    state,
    set,
    patch,
    newDoc,
    addLayer,
    duplicateLayer,
    deleteLayer,
    renameLayer,
    setLayerVisible,
    setLayerOpacity,
    setLayerBlend,
    moveLayer,
    setActiveLayer,
    pushHistory,
    undo,
    redo,
    history: historyRef.current,
    addGuide,
    clearGuides,
    importImage,
    composite,
    activeLayer,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
