import { useEffect, useRef, useState } from "react";
import { useEditor } from "@/lib/editor/EditorContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Image as ImageIcon, Layers } from "lucide-react";

interface PendingDrop {
  file: File;
  url: string;
  img: HTMLImageElement;
}

export function DropZone() {
  const { importImage, openImageAsDoc } = useEditor();
  const [overlay, setOverlay] = useState(false);
  const [pending, setPending] = useState<PendingDrop[] | null>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
      dragDepth.current += 1;
      setOverlay(true);
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setOverlay(false);
      }
    };
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setOverlay(false);
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!files.length) return;
      const loaded: PendingDrop[] = [];
      for (const file of files) {
        try {
          const url = URL.createObjectURL(file);
          const img = await loadImage(url);
          loaded.push({ file, url, img });
        } catch {
          toast.error(`Couldn't read ${file.name}`);
        }
      }
      if (loaded.length) setPending(loaded);
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const cleanup = () => {
    pending?.forEach((p) => URL.revokeObjectURL(p.url));
    setPending(null);
  };

  const asLayers = () => {
    if (!pending) return;
    pending.forEach((p) => importImage(p.img, p.file.name));
    toast.success(`Added ${pending.length} layer${pending.length > 1 ? "s" : ""}`);
    cleanup();
  };

  const asNewImage = () => {
    if (!pending) return;
    // First file becomes the new doc; remaining are appended as layers.
    const [first, ...rest] = pending;
    openImageAsDoc(first.img, first.file.name);
    rest.forEach((p) => importImage(p.img, p.file.name));
    toast.success(`Opened ${first.file.name}`);
    cleanup();
  };

  return (
    <>
      {overlay && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-cyan-500/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-cyan-400 bg-neutral-950/80 px-10 py-8 text-center shadow-2xl">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-cyan-400" />
            <div className="text-lg font-semibold text-neutral-100">Drop image to import</div>
            <div className="mt-1 text-xs text-neutral-400">
              You'll choose: open as new image, or add as a layer
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && cleanup()}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100">
          <AlertDialogHeader>
            <AlertDialogTitle>
              How do you want to open {pending && pending.length > 1
                ? `${pending.length} images`
                : `"${pending?.[0]?.file.name ?? ""}"`}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Open as a new image to replace the current document, or drop it into the current
              document as a new layer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={asNewImage}
              className="flex flex-col items-start gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-left transition-colors hover:border-cyan-500/60 hover:bg-neutral-900/60"
            >
              <ImageIcon className="h-5 w-5 text-cyan-400" />
              <div className="font-semibold">Open as new image</div>
              <div className="text-xs text-neutral-400">
                Replaces the current document with a new canvas sized to the image.
              </div>
            </button>
            <button
              onClick={asLayers}
              className="flex flex-col items-start gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-left transition-colors hover:border-cyan-500/60 hover:bg-neutral-900/60"
            >
              <Layers className="h-5 w-5 text-cyan-400" />
              <div className="font-semibold">Add as new layer</div>
              <div className="text-xs text-neutral-400">
                Keeps your work and places the image as a new layer on top.
              </div>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <span className="hidden" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
