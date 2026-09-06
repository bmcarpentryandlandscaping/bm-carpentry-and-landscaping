"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "./MediaPicker";
import type { MediaRow } from "@/lib/schemas";

type Props = {
  label: string;
  value: string;
  alt?: string;
  onChange: (url: string, row: MediaRow) => void;
  onAltChange?: (alt: string) => void;
  /** Show the crop at the ratio the slot really renders at — see spec §9. */
  aspect?: string;
  kind?: "image" | "video" | "both";
};

/**
 * The one image control every editor uses: the real crop at the slot's own
 * aspect ratio, with its controls beneath.
 *
 * Showing the true aspect matters — a portrait phone photo dropped into a
 * landscape slot looks fine in a square thumbnail and wrong on the site.
 *
 * The photo leads and the chrome recedes: "Change photo" is a quiet text
 * action sitting under the plate rather than a filled button competing with
 * the image, and it only reads as a button on hover/focus.
 */
export function ImageSlot({
  label,
  value,
  alt,
  onChange,
  onAltChange,
  aspect = "16 / 9",
  kind = "image",
}: Props) {
  const [picking, setPicking] = useState(false);
  // Ten mosaic tiles render ten ImageSlots; deriving the field id from `label`
  // alone would collide and break the label/input association for screen readers.
  const fieldId = useId();
  const isVideo = /\.mp4($|\?)/i.test(value);

  return (
    <div>
      <Label className="text-sm text-muted-foreground">{label}</Label>

      <div className="admin-plate mt-2" style={{ aspectRatio: aspect }}>
        {value ? (
          isVideo ? (
            <video src={value} muted loop autoPlay playsInline />
          ) : (
            <img src={value} alt={alt ?? ""} />
          )
        ) : (
          <p className="admin-plate-empty">
            No photo yet. Choose one to see it here.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setPicking(true)}
        className="mt-2.5 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-current"
      >
        {value ? "Change photo" : "Choose a photo"}
      </button>

      {onAltChange && (
        <div className="mt-5">
          <Label htmlFor={fieldId} className="text-sm text-muted-foreground">
            Describe the photo
          </Label>
          <Input
            id={fieldId}
            value={alt ?? ""}
            maxLength={160}
            placeholder="Blackbutt deck and pergola, Avalon"
            onChange={(e) => onAltChange(e.target.value)}
            className="mt-2"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Read aloud to people who cannot see it, and used by Google.
          </p>
        </div>
      )}

      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        kind={kind}
        onSelect={(row) => onChange(row.url, row)}
      />
    </div>
  );
}
