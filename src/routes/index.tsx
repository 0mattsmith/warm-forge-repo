import { createFileRoute } from "@tanstack/react-router";
import { EditorProvider, useEditor } from "@/lib/editor/EditorContext";
import { MenuBar } from "@/components/editor/MenuBar";
import { ToolPanel } from "@/components/editor/ToolPanel";
import { RightPanels } from "@/components/editor/RightPanels";
import { EditorCanvas } from "@/components/editor/Canvas";
import { Rulers } from "@/components/editor/Rulers";
import { StatusBar } from "@/components/editor/StatusBar";
import { Timeline } from "@/components/editor/Timeline";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixelboard — Layered Image Editor (PWA)" },
      {
        name: "description",
        content:
          "A Paint.NET-inspired browser image editor: layers, vector pen, text, animation timeline, AI tools, and PNG/JPG/WebP/ICO/PSD I/O.",
      },
      { name: "theme-color", content: "#0a0a0a" },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  component: EditorPage,
});

function Shortcuts() {
  const { undo, redo, set, state } = useEditor();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (ctrl && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        redo();
      } else if (!ctrl) {
        const map: Record<string, typeof state.tool> = {
          v: "move",
          m: "select-rect",
          l: "lasso",
          w: "magic-wand",
          p: "pen",
          b: "brush",
          n: "pencil",
          e: "eraser",
          g: "fill",
          t: "text",
          i: "eyedropper",
          z: "zoom",
          h: "hand",
        };
        const t = map[e.key.toLowerCase()];
        if (t) set("tool", t);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, set, state.tool]);
  return null;
}

function EditorPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-screen w-screen bg-neutral-950" />;
  }
  return (
    <div className="dark h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col">
      <EditorProvider>
        <TooltipProvider>
          <Shortcuts />
          <header className="h-9 bg-neutral-950 border-b border-neutral-800 flex items-center px-3 gap-2 shrink-0">
            <div className="font-semibold text-sm tracking-tight">
              <span className="text-cyan-400">Pixel</span>board
            </div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Layered Image Editor</div>
          </header>
          <MenuBar />
          <div className="flex-1 flex min-h-0">
            <ToolPanel />
            <div className="flex-1 flex flex-col min-w-0">
              <Rulers>
                <EditorCanvas />
              </Rulers>
              <Timeline />
            </div>
            <RightPanels />
          </div>
          <StatusBar />
          <Toaster theme="dark" position="bottom-right" />
        </TooltipProvider>
      </EditorProvider>
    </div>
  );
}
