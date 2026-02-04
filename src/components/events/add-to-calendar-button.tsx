"use client";

import type { ComponentProps } from "react";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToCalendarButtonProps extends Omit<ComponentProps<typeof Button>, "asChild"> {
  eventId: string;
}

export function AddToCalendarButton({
  eventId,
  className,
  ...buttonProps
}: AddToCalendarButtonProps) {
  const calendarUrl = `/api/events/${eventId}/calendar`;

  return (
    <Button
      variant="secondary"
      size="sm"
      asChild
      className={cn("shadow-lg", className)}
      {...buttonProps}
    >
      <Link href={calendarUrl} target="_blank" rel="noopener noreferrer">
        <CalendarPlus className="h-4 w-4 mr-2" />
        Añadir al calendario
      </Link>
    </Button>
  );
}
