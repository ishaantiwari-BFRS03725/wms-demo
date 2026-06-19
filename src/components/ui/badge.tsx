import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] leading-none transition-colors before:content-[''] before:inline-block before:size-[5px] before:rounded-full before:bg-current focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        secondary: "border-border bg-secondary text-muted-foreground",
        destructive: "border-risk/30 bg-risk-bg text-risk",
        outline: "border-border bg-transparent text-foreground",
        ok: "border-ok/30 bg-ok-bg text-ok",
        warn: "border-warn/30 bg-warn-bg text-warn",
        sys: "border-sys/30 bg-sys-bg text-sys",
        ai: "border-ai-ring bg-ai-bg text-ai",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
