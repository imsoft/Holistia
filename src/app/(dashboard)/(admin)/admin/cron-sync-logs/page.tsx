"use client";

import { useState, useEffect, useCallback } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Timer,
  ArrowLeft,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, formatDuration, intervalToDuration } from "date-fns";
import { es } from "date-fns/locale";

// ============================================================================
// Types
// ============================================================================

interface CronSyncLog {
  id: string;
  status: 'running' | 'completed' | 'error';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  total_profiles: number;
  successful_count: number;
  failed_count: number;
  results: ProfessionalResult[] | null;
  error_message: string | null;
}

interface ProfessionalResult {
  userId: string;
  email: string;
  success: boolean;
  error?: string;
  created?: number;
  deleted?: number;
  diagnostics?: {
    totalFromGoogle: number;
    holistiaEvents: number;
    existingBlocks: number;
    afterFiltering: number;
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function CronSyncLogsPage() {
  const [logs, setLogs] = useState<CronSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CronSyncLog | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 15;

  // ============================================================================
  // Fetch Logs
  // ============================================================================

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: (page * PAGE_SIZE).toString(),
      });
      const res = await fetch(`/api/admin/cron-sync-logs?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar logs');
      }

      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching logs:', err);
      toast.error('Error al cargar logs de sincronización');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ============================================================================
  // Auto-refresh
  // ============================================================================

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 30_000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // ============================================================================
  // Stats Calculations
  // ============================================================================

  const stats = {
    lastExecution: logs[0] || null,
    last24hCount: logs.filter(log => {
      const logDate = new Date(log.started_at);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logDate > yesterday;
    }).length,
    successRate: logs.length > 0
      ? Math.round((logs.filter(l => l.status === 'completed').length / logs.length) * 100)
      : 0,
    avgProfiles: logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.total_profiles, 0) / logs.length)
      : 0,
  };

  // ============================================================================
  // Helpers
  // ============================================================================

  const getStatusBadge = (status: CronSyncLog['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">En proceso</Badge>;
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-300">Completado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const formatDurationMs = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    if (seconds < 60) return `${seconds}.${Math.floor(milliseconds / 100)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleResultExpand = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  // ============================================================================
  // Detail View
  // ============================================================================

  if (selectedLog) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLog(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la lista
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                Detalle de Ejecución
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatTimestamp(selectedLog.started_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-500" />
                Resumen de Ejecución
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Estado</div>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duración</div>
                  <div className="mt-1 font-semibold">{formatDurationMs(selectedLog.duration_ms)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Profesionales</div>
                  <div className="mt-1 font-semibold">{selectedLog.total_profiles}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Resultados</div>
                  <div className="mt-1 font-semibold">
                    <span className="text-green-600">{selectedLog.successful_count} OK</span>
                    {' / '}
                    <span className="text-red-600">{selectedLog.failed_count} Fallos</span>
                  </div>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  <strong>Error:</strong> {selectedLog.error_message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-Professional Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Resultados por Profesional ({selectedLog.results?.length || 0})
              </CardTitle>
              <CardDescription>
                Detalle de sincronización para cada profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedLog.results || selectedLog.results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay resultados disponibles</p>
              ) : (
                <div className="space-y-3">
                  {selectedLog.results.map((result, index) => {
                    const resultId = `${selectedLog.id}-${result.userId}`;
                    const isExpanded = expandedResults.has(resultId);

                    return (
                      <div
                        key={resultId}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="flex items-start gap-3 cursor-pointer"
                          onClick={() => toggleResultExpand(resultId)}
                        >
                          {result.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{result.email}</span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            {result.success ? (
                              <div className="text-sm text-muted-foreground mt-1">
                                Creados: {result.created || 0} | Eliminados: {result.deleted || 0}
                              </div>
                            ) : (
                              <div className="text-sm text-red-600 mt-1">
                                {result.error || 'Error desconocido'}
                              </div>
                            )}
                          </div>
                        </div>

                        {isExpanded && result.diagnostics && (
                          <div className="mt-3 ml-8 pl-4 border-l-2 border-gray-200">
                            <div className="text-sm space-y-1">
                              <div className="text-muted-foreground">
                                <strong>Diagnósticos:</strong>
                              </div>
                              <div>Eventos de Google Calendar: {result.diagnostics.totalFromGoogle}</div>
                              <div>Eventos de citas Holistia: {result.diagnostics.holistiaEvents}</div>
                              <div>Bloques ya existentes: {result.diagnostics.existingBlocks}</div>
                              <div>Eventos después de filtrar: {result.diagnostics.afterFiltering}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // List View
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Logs de Sincronización Google Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Historial de ejecuciones del cron (cada 30 min)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                Auto-refresh (30s)
              </Label>
            </div>
            <Button
              onClick={fetchLogs}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Last Execution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Última Ejecución
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  {stats.lastExecution ? (
                    <>
                      <div className="text-lg font-bold">
                        {formatDistanceToNow(new Date(stats.lastExecution.started_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(stats.lastExecution.started_at)}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Sin ejecuciones</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last 24h Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Últimas 24 horas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <div className="text-2xl font-bold">{stats.last24hCount}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ejecuciones del cron
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa de Éxito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="text-2xl font-bold">{stats.successRate}%</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                de ejecuciones completadas
              </div>
            </CardContent>
          </Card>

          {/* Avg Profiles */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profesionales Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                <div className="text-2xl font-bold">{stats.avgProfiles}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                por ejecución
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs List */}
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay logs de sincronización disponibles</p>
                <p className="text-sm mt-2">Los logs aparecerán cuando el cron se ejecute</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card
                key={log.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(log.status)}
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(log.started_at)}
                        </span>
                        {log.duration_ms && (
                          <span className="text-sm text-muted-foreground">
                            • Duración: {formatDurationMs(log.duration_ms)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Profesionales: <strong>{log.total_profiles}</strong>
                        </span>
                        <span className="text-green-600">
                          OK: <strong>{log.successful_count}</strong>
                        </span>
                        {log.failed_count > 0 && (
                          <span className="text-red-600">
                            Fallos: <strong>{log.failed_count}</strong>
                          </span>
                        )}
                      </div>
                      {log.error_message && (
                        <div className="mt-2 text-sm text-red-600 truncate">
                          Error: {log.error_message}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Página {page + 1} de {Math.ceil(total / PAGE_SIZE)} ({total} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(Math.ceil(total / PAGE_SIZE) - 1, p + 1))}
                disabled={page >= Math.ceil(total / PAGE_SIZE) - 1 || loading}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
