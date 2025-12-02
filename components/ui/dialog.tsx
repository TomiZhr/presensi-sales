// src/components/ui/dialog.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// Root dialog
export const Dialog = DialogPrimitive.Root;

// Trigger untuk membuka dialog
export const DialogTrigger = DialogPrimitive.Trigger;

// Konten dialog
export const DialogContent: React.FC<React.PropsWithChildren<{
  className?: string;
}>> = ({ children, className }) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50" />
      <DialogPrimitive.Content
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    bg-white rounded-2xl p-4 shadow-lg ${className}`}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};
