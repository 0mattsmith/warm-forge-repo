export type ToolId =
  | "move"
  | "select-rect"
  | "select-ellipse"
  | "lasso"
  | "magic-wand"
  | "pen"
  | "brush"
  | "pencil"
  | "eraser"
  | "fill"
  | "gradient"
  | "text"
  | "shape-rect"
  | "shape-ellipse"
  | "shape-line"
  | "eyedropper"
  | "liquify"
  | "smudge"
  | "clone"
  | "blur"
  | "sharpen"
  | "dodge"
  | "burn"
  | "zoom"
  | "hand";

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type LayerKind = "raster" | "text" | "vector" | "adjustment" | "group";

export interface Layer {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..1
  blend: BlendMode;
  // For raster/text/vector: a canvas holding pixels (text/vector are rasterized for now)
  canvas?: HTMLCanvasElement;
  // For groups
  children?: string[];
  parentId?: string | null;
  // Metadata for stubs
  text?: { content: string; font: string; size: number; color: string };
  adjustment?: { kind: string; params: Record<string, number> };
}

export interface Frame {
  id: string;
  name: string;
  durationMs: number;
  // Snapshot of layer pixel data keyed by layer id
  snapshots: Record<string, ImageData | null>;
}

export interface Guide {
  id: string;
  orientation: "h" | "v";
  position: number; // in canvas pixels
}
