import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useEditor } from "@/lib/editor/EditorContext";
import { toast } from "sonner";

export function MenuBar() {
  const { state, newDoc, undo, redo, set, importImage, composite, addLayer, clearGuides, addGuide } =
    useEditor();

  const promptNew = () => {
    const w = parseInt(prompt("Width:", String(state.width)) || "", 10);
    const h = parseInt(prompt("Height:", String(state.height)) || "", 10);
    if (w > 0 && h > 0) newDoc(w, h);
  };

  const openImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/x-icon,image/vnd.microsoft.icon,.ico,.cur";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        importImage(img, file.name);
        URL.revokeObjectURL(url);
        toast.success(`Imported ${file.name} (${img.width}×${img.height})`);
      };
      img.onerror = () => toast.error(`Cannot decode ${file.name} — format may not be supported by the browser`);
      img.src = url;
    };
    input.click();
  };

  const exportAs = (type: "image/png" | "image/jpeg" | "image/webp", ext: string) => {
    const c = composite();
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = state.docName.replace(/\.[^.]+$/, "") + "." + ext;
      a.click();
      URL.revokeObjectURL(url);
    }, type);
  };

  const exportIco = () => {
    // produce a minimal ICO from a 256×256 PNG. Real ICO supports multiple sizes;
    // we generate a single-image ICO container with embedded PNG (Vista+ valid).
    const src = composite();
    const size = 256;
    const tmp = document.createElement("canvas");
    tmp.width = size;
    tmp.height = size;
    tmp.getContext("2d")!.drawImage(src, 0, 0, size, size);
    tmp.toBlob(async (pngBlob) => {
      if (!pngBlob) return;
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      const header = new Uint8Array(6 + 16);
      const dv = new DataView(header.buffer);
      dv.setUint16(0, 0, true); // reserved
      dv.setUint16(2, 1, true); // type 1 = ICO
      dv.setUint16(4, 1, true); // count
      dv.setUint8(6, 0); // width 0 = 256
      dv.setUint8(7, 0); // height 0 = 256
      dv.setUint8(8, 0); // colors
      dv.setUint8(9, 0); // reserved
      dv.setUint16(10, 1, true); // planes
      dv.setUint16(12, 32, true); // bpp
      dv.setUint32(14, pngBytes.length, true);
      dv.setUint32(18, 22, true); // offset
      const out = new Blob([header, pngBytes], { type: "image/x-icon" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = state.docName.replace(/\.[^.]+$/, "") + ".ico";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported ICO (256×256, PNG-encoded)");
    }, "image/png");
  };

  const saveAsPsd = () => {
    // Stubbed: real PSD writer would need full spec implementation. Save flattened PNG with .psd extension placeholder
    // and warn the user.
    toast.info("PSD writer is stubbed — saving flattened snapshot as .png placeholder for now. Use Export for real images.");
    const c = composite();
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = state.docName.endsWith(".psd") ? state.docName : state.docName + ".psd";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const todo = (label: string) => () => toast.info(`${label}: coming soon`);

  return (
    <Menubar className="rounded-none border-x-0 border-t-0 bg-neutral-950 border-neutral-800 text-neutral-200 h-9 px-1">
      <MenubarMenu>
        <MenubarTrigger className="text-xs">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={promptNew}>
            New… <MenubarShortcut>Ctrl+N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={openImage}>
            Open / Import… <MenubarShortcut>Ctrl+O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={todo("Open Recent")}>Open Recent</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={saveAsPsd}>
            Save as .psd <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Export</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onClick={() => exportAs("image/png", "png")}>PNG</MenubarItem>
              <MenubarItem onClick={() => exportAs("image/jpeg", "jpg")}>JPEG</MenubarItem>
              <MenubarItem onClick={() => exportAs("image/webp", "webp")}>WebP</MenubarItem>
              <MenubarItem onClick={exportIco}>ICO (Icon)</MenubarItem>
              <MenubarItem onClick={todo("CUR export")}>CUR (Cursor)</MenubarItem>
              <MenubarItem onClick={todo("Animated GIF export")}>Animated GIF</MenubarItem>
              <MenubarItem onClick={todo("Animated WebP export")}>Animated WebP</MenubarItem>
              <MenubarItem onClick={todo("APNG export")}>APNG</MenubarItem>
              <MenubarItem onClick={todo("SVG export")}>SVG</MenubarItem>
              <MenubarItem onClick={todo("PDF export")}>PDF</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem onClick={todo("Print")}>Print…</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={undo}>
            Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={redo}>
            Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={todo("Cut")}>Cut</MenubarItem>
          <MenubarItem onClick={todo("Copy")}>Copy</MenubarItem>
          <MenubarItem onClick={todo("Paste")}>Paste</MenubarItem>
          <MenubarItem onClick={todo("Paste as New Layer")}>Paste as New Layer</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={todo("Preferences")}>Preferences…</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Image</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={todo("Canvas Size")}>Canvas Size…</MenubarItem>
          <MenubarItem onClick={todo("Resize")}>Resize…</MenubarItem>
          <MenubarItem onClick={todo("Crop to Selection")}>Crop to Selection</MenubarItem>
          <MenubarItem onClick={todo("Rotate")}>Rotate / Flip…</MenubarItem>
          <MenubarItem onClick={todo("Flatten")}>Flatten</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Layers</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => addLayer("raster")}>New Layer</MenubarItem>
          <MenubarItem onClick={() => addLayer("group")}>New Group</MenubarItem>
          <MenubarItem onClick={() => addLayer("text")}>New Text Layer</MenubarItem>
          <MenubarItem onClick={() => addLayer("adjustment")}>New Adjustment Layer</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={todo("Merge Down")}>Merge Down</MenubarItem>
          <MenubarItem onClick={todo("Merge Visible")}>Merge Visible</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Select</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => set("selection", null)}>Deselect</MenubarItem>
          <MenubarItem onClick={todo("Select All")}>Select All</MenubarItem>
          <MenubarItem onClick={todo("Invert")}>Invert</MenubarItem>
          <MenubarItem onClick={todo("Feather Selection")}>Feather…</MenubarItem>
          <MenubarItem onClick={todo("Expand/Contract")}>Expand / Contract…</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Adjustments</MenubarTrigger>
        <MenubarContent>
          {["Brightness / Contrast", "Hue / Saturation", "Levels", "Curves", "Color Balance", "Black & White", "Invert", "Sepia", "Auto-Level"].map((a) => (
            <MenubarItem key={a} onClick={todo(a)}>{a}</MenubarItem>
          ))}
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Effects</MenubarTrigger>
        <MenubarContent>
          <MenubarSub>
            <MenubarSubTrigger>Blurs</MenubarSubTrigger>
            <MenubarSubContent>
              {["Gaussian Blur", "Motion Blur", "Radial Blur", "Surface Blur", "Zoom Blur"].map(
                (a) => (
                  <MenubarItem key={a} onClick={todo(a)}>{a}</MenubarItem>
                ),
              )}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Distort</MenubarSubTrigger>
            <MenubarSubContent>
              {["Liquify", "Bulge", "Pinch", "Twist", "Polar Inversion"].map((a) => (
                <MenubarItem key={a} onClick={todo(a)}>{a}</MenubarItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Noise</MenubarSubTrigger>
            <MenubarSubContent>
              {["Add Noise", "Reduce Noise", "Median"].map((a) => (
                <MenubarItem key={a} onClick={todo(a)}>{a}</MenubarItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Stylize</MenubarSubTrigger>
            <MenubarSubContent>
              {["Edge Detect", "Emboss", "Outline", "Relief", "Glow"].map((a) => (
                <MenubarItem key={a} onClick={todo(a)}>{a}</MenubarItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Render</MenubarSubTrigger>
            <MenubarSubContent>
              {["Clouds", "Julia Fractal", "Mandelbrot", "Perlin Noise"].map((a) => (
                <MenubarItem key={a} onClick={todo(a)}>{a}</MenubarItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">AI</MenubarTrigger>
        <MenubarContent>
          {["Generative Fill", "Generative Expand", "Remove Background", "Upscale 2×", "Inpaint", "Style Transfer", "Text → Image", "Restore Photo"].map(
            (a) => (
              <MenubarItem key={a} onClick={todo(a)}>{a}</MenubarItem>
            ),
          )}
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => set("zoom", Math.min(8, state.zoom * 1.25))}>
            Zoom In <MenubarShortcut>Ctrl++</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => set("zoom", Math.max(0.1, state.zoom / 1.25))}>
            Zoom Out <MenubarShortcut>Ctrl+-</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => set("zoom", 1)}>Actual Size</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => set("showRulers", !state.showRulers)}>
            {state.showRulers ? "Hide" : "Show"} Rulers
          </MenubarItem>
          <MenubarItem onClick={() => set("showGrid", !state.showGrid)}>
            {state.showGrid ? "Hide" : "Show"} Grid
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Guides</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onClick={() => addGuide({ orientation: "h", position: state.height / 2 })}>
                Add Horizontal Guide
              </MenubarItem>
              <MenubarItem onClick={() => addGuide({ orientation: "v", position: state.width / 2 })}>
                Add Vertical Guide
              </MenubarItem>
              <MenubarItem onClick={clearGuides}>Clear All Guides</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Window</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={todo("Toggle Layers")}>Layers</MenubarItem>
          <MenubarItem onClick={todo("Toggle History")}>History</MenubarItem>
          <MenubarItem onClick={todo("Toggle Timeline")}>Timeline</MenubarItem>
          <MenubarItem onClick={todo("Toggle Navigator")}>Navigator</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => toast("Pixelboard — a Paint.NET-inspired web editor (work in progress)")}>
            About
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
