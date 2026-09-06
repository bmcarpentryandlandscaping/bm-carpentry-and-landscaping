"use client";

import { createClient } from "@/lib/supabase/client";
import { createMediaRow } from "@/app/(admin)/admin/_actions/media";
import { MAX_EDGE, WEBP_QUALITY, fitWithin } from "@/lib/media";
import type { MediaRow } from "@/lib/schemas";

export const ACCEPT = "image/*,video/mp4";
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

/**
 * What the Storage bucket's `allowed_mime_types` will actually accept.
 *
 * Kept in step with supabase/migrations/0001_init.sql by hand — the bucket is
 * the real control, this list only exists so a rejection can be explained in a
 * sentence instead of surfacing PostgREST's own error text.
 */
const BUCKET_MIMES = ["image/webp", "image/jpeg", "image/png", "video/mp4"];

/**
 * Resize and re-encode an image to WebP before it ever leaves the browser.
 *
 * This is a convenience, not a security control — the Storage bucket enforces
 * its own mime and size limits server-side, because a valid session could PUT
 * straight past this function.
 *
 * On any failure it returns the original file rather than losing the upload:
 * createImageBitmap can reject on unusual colour profiles, and OffscreenCanvas
 * is missing on older Safari.
 */
async function toWebp(file: File): Promise<{ blob: Blob; width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    // Read the intrinsic size BEFORE close() — close() zeroes both, so the
    // "re-encode came out bigger" path below would otherwise report 0 x 0.
    const srcWidth = bitmap.width;
    const srcHeight = bitmap.height;
    const { width, height } = fitWithin(srcWidth, srcHeight, MAX_EDGE);

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement("canvas"), { width, height });

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob =
      canvas instanceof OffscreenCanvas
        ? await canvas.convertToBlob({ type: "image/webp", quality: WEBP_QUALITY })
        : await new Promise<Blob>((resolve, reject) =>
            (canvas as HTMLCanvasElement).toBlob(
              (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
              "image/webp",
              WEBP_QUALITY,
            ),
          );

    // A re-encode that came out bigger is not worth having.
    if (blob.size >= file.size) return { blob: file, width: srcWidth, height: srcHeight };
    return { blob, width, height };
  } catch (err) {
    console.warn("[upload] falling back to the original file:", err);
    return { blob: file };
  }
}

/** Upload one file to Storage and record it in the media table. */
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<MediaRow> {
  const isVideo = file.type === "video/mp4";
  if (!isVideo && !file.type.startsWith("image/")) {
    throw new Error("Only images and .mp4 video can be uploaded.");
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video must be 25MB or smaller.");
  }

  onProgress?.(5);
  const { blob, width, height } = isVideo ? { blob: file as Blob, width: undefined, height: undefined } : await toWebp(file);

  // toWebp hands back the ORIGINAL file whenever it cannot decode or re-encode
  // it — which is exactly what happens to an iPhone HEIC, and this client works
  // from a phone. Without this check that file reaches Storage, gets rejected by
  // the bucket's allowed_mime_types, and the client is shown a raw Supabase
  // string. Say what to do instead.
  if (!isVideo && !BUCKET_MIMES.includes(blob.type)) {
    throw new Error(
      "This photo is in a format the site cannot use. Open it on your phone, tap Share, choose Save to Files, then upload that copy — or send it to yourself by email first.",
    );
  }
  onProgress?.(35);

  // `"".split(".")` is `[""]`, never `[]`, so `.pop()` can never return undefined —
  // a `?? "jpg"` fallback here is dead code that never fires. Without an explicit
  // check, a dotless filename becomes its own extension ("photo" -> "uuid.photo")
  // and a trailing dot yields "uuid.". Derive it deliberately, lowercase it, and
  // only accept something that actually looks like an extension.
  const rawExt = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  const ext = isVideo
    ? "mp4"
    : blob.type === "image/webp"
      ? "webp"
      : /^[a-z0-9]{1,5}$/.test(rawExt)
        ? rawExt
        : "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: blob.type || (isVideo ? "video/mp4" : "image/webp"),
    upsert: false,
  });
  // The bucket's allowed_mime_types / file_size_limit reject here, server-side.
  if (error) throw new Error(error.message);
  onProgress?.(80);

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(path);

  const result = await createMediaRow({
    url: publicUrl,
    name: file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "untitled",
    alt: "",
    kind: isVideo ? "video" : "image",
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    bytes: blob.size,
  });
  if (!result.ok) throw new Error(result.error);

  onProgress?.(100);
  return result.data;
}

/**
 * Uploads with a concurrency cap, so a 20-file drop does not stall the tab.
 *
 * Note for consumers: on success `onFile(name, 100)` fires TWICE — once from
 * inside `uploadFile`'s own progress reporting, and again here with the finished
 * `row`. Treat completion as `row !== undefined || error !== undefined`, never as
 * `pct === 100`, or the UI will clear a tile a beat early with no data to show.
 */
export async function uploadAll(
  files: File[],
  onFile: (name: string, pct: number, row?: MediaRow, error?: string) => void,
  concurrency = 3,
): Promise<void> {
  const queue = [...files];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      try {
        const row = await uploadFile(file, (pct) => onFile(file!.name, pct));
        onFile(file.name, 100, row);
      } catch (err) {
        onFile(file.name, 100, undefined, err instanceof Error ? err.message : "Upload failed");
      }
    }
  });
  await Promise.all(workers);
}
