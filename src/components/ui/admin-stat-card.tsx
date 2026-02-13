"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface AdminStatCardProps {
  /** Título de la card (gris, texto pequeño) */
  title: string;
  /** Valor principal (número o texto grande en negrita) */
  value: string;
  /** Tendencia: valor (ej. "+12.5%") y si es positiva */
  trend?: { value: string; positive: boolean };
  /** Texto secundario con icono de flecha (ej. "Subiendo este mes") */
  secondaryText?: string;
  /** Texto terciario en gris pequeño (ej. "Visitantes últimos 6 meses") */
  tertiaryText?: string;
  /** Enlace opcional: la card se vuelve clicable */
  href?: string;
  /** Clases adicionales para el contenedor */
  className?: string;
}

/**
 * Card de estadística unificada para el admin.
 * Diseño: título gris, valor grande, badge de tendencia (arriba derecha),
 * línea con flecha + texto secundario, texto terciario gris.
 */
export function AdminStatCard({
  title,
  value,
  trend,
  secondaryText,
  tertiaryText,
  href,
  className,
}: AdminStatCardProps) {
  const isPositive = trend?.positive ?? true;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  const content = (
    <Card
      className={cn(
        "bg-card rounded-xl border shadow-sm overflow-hidden",
        href && "cursor-pointer transition-all hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-sm font-medium text-muted-foreground break-words">{title}</span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
                isPositive
                  ? "bg-muted text-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-foreground tracking-tight break-words">{value}</div>
        {secondaryText && (
          <div className="flex items-center gap-1 mt-2">
            <TrendIcon
              className={cn(
                "h-4 w-4 shrink-0",
                isPositive ? "text-green-600" : "text-red-600"
              )}
            />
            <span className="text-sm font-medium text-foreground break-words">{secondaryText}</span>
          </div>
        )}
        {tertiaryText && (
          <p className="mt-1 text-xs text-muted-foreground">{tertiaryText}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
