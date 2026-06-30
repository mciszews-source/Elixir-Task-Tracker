"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon = "🗑",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-[999998] flex items-center justify-center bg-[rgba(10,14,40,0.75)] backdrop-blur-md"
    >
      <div
        className="elixir-popover w-[360px] max-w-[90vw] p-9 text-center"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="mb-3 text-[32px]">{icon}</div>
        <div className="font-display text-[16px] font-semibold tracking-[0.08em] text-white">
          {title}
        </div>
        {detail && (
          <div className="mt-2 px-2 text-[13px] text-white/50 italic">
            {detail}
          </div>
        )}
        <div className="mt-6 flex justify-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="elixir-btn"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              variant === "danger" ? "elixir-btn elixir-btn-danger" : "elixir-btn elixir-btn-primary"
            }
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
