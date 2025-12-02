"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean;
}

export const Label: React.FC<LabelProps> = ({ className, disabled, ...props }) => {
  return (
    <label
      data-disabled={disabled ? true : undefined}
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none " +
          "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 " +
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
};
