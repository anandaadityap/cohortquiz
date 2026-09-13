"use client";

import { useState } from "react";

export function ShareControls({
  url,
  whatsappText,
}: {
  url: string;
  whatsappText: string;
}) {
  const [copied, setCopied] = useState<"link" | "wa" | null>(null);

  async function copy(value: string, which: "link" | "wa") {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="space-y-3">
      <p className="break-all font-mono text-sm">{url}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(url, "link")}
          className="rounded-full border border-line px-3 py-1.5 text-sm"
        >
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={() => copy(whatsappText, "wa")}
          className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
        >
          {copied === "wa" ? "Copied" : "Copy WhatsApp text"}
        </button>
      </div>
    </div>
  );
}
