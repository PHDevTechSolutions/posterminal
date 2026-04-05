"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <label className={cn(
        "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2",
        props.checked ? "bg-indigo-600" : "bg-gray-200",
        className
      )}>
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <span className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          props.checked ? "translate-x-6" : "translate-x-1"
        )} />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
