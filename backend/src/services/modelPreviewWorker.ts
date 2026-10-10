import { parentPort, workerData } from "node:worker_threads";
import { renderModelPreviewGlb, type RenderOptions } from "./modelPreviewRender";
import { renderModelImage, type ModelImageOptions } from "./modelImageRender";

// Worker entry point for one preview render, a GLB or a picture. Posts exactly one message, then exits.

export type ModelPreviewWorkerInput =
  | { kind: "glb"; srcPath: string; destPath: string; options: RenderOptions }
  | { kind: "image"; srcPath: string; destPath: string; ext: string; image: ModelImageOptions };
export type ModelPreviewWorkerResult =
  { status: "ok" } | { status: "too-complex" } | { status: "unsupported" } | { status: "error"; error: string };

async function run(): Promise<void> {
  const input = workerData as ModelPreviewWorkerInput;
  let result: ModelPreviewWorkerResult;
  try {
    result = {
      status:
        input.kind === "glb"
          ? await renderModelPreviewGlb(input.srcPath, input.destPath, input.options)
          : await renderModelImage(input.srcPath, input.destPath, input.ext, input.image),
    };
  } catch (err) {
    result = { status: "error", error: err instanceof Error ? (err.stack ?? err.message) : String(err) };
  }
  // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a worker_threads port, not window.postMessage.
  parentPort?.postMessage(result);
}

void run();
