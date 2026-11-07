import { randomUUID } from "node:crypto";
import { runCocoSimulation } from "../../../lib/coco-simulation";

export const runtime = "nodejs";

async function readInput(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("Brak danych");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      throw new RangeError("Żądanie jest za duże");
    }
    text += decoder.decode(part.value, { stream: true });
  }
  return JSON.parse(text + decoder.decode()) as unknown;
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 4096) return Response.json({ error: "Żądanie jest za duże" }, { status: 413 });
    const input = await readInput(request);
    return Response.json(runCocoSimulation(input, `otx_coco_${randomUUID()}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieprawidłowa symulacja";
    return Response.json({ error: message }, { status: error instanceof RangeError ? 413 : 400 });
  }
}
