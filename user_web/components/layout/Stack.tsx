import * as React from "react"
import { cn } from "@/lib/utils"

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal"
  spacing?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around"
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = "vertical",
      spacing = "md",
      align,
      justify,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      vertical: {
        xs: "space-y-1",
        sm: "space-y-2",
        md: "space-y-4",
        lg: "space-y-6",
        xl: "space-y-8",
        "2xl": "space-y-12",
      },
      horizontal: {
        xs: "space-x-1",
        sm: "space-x-2",
        md: "space-x-4",
        lg: "space-x-6",
        xl: "space-x-8",
        "2xl": "space-x-12",
      },
    }

    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    }

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          direction === "vertical" ? "flex-col" : "flex-row",
          spacingClasses[direction][spacing],
          align && alignClasses[align],
          justify && justifyClasses[justify],
          className
        )}
        {...props}
      />
    )
  }
)
Stack.displayName = "Stack"

export { Stack }
