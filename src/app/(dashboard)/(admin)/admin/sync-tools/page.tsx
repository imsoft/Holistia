"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, RefreshCw, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export default function SyncToolsPage() {
  const [professionalId, setProfessionalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [cleanResult, setCleanResult] = useState<any>(null);

  const handleDiagnostic = async () => {
    if (!professionalId.trim()) {
      toast.error("Por favor ingresa un Professional ID");
      return;
    }

    try {
      setDiagnosing(true);
      setDiagnosticResult(null);

      const response = await fetch(
        `/api/debug/check-google-calendar-blocks?professionalId=${professionalId.trim()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener diagnóstico");
      }

      setDiagnosticResult(data);
      toast.success("Diagnóstico completado");
    } catch (error: any) {
      console.error("Error en diagnóstico:", error);
      toast.error(error.message || "Error al ejecutar diagnóstico");
    } finally {
      setDiagnosing(false);
    }
  };

  const handleForceSync = async () => {
    if (!professionalId.trim()) {
      toast.error("Por favor ingresa un Professional ID");
      return;
    }

    try {
      setLoading(true);
      setSyncResult(null);

      const response = await fetch("/api/admin/force-sync-google-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ professionalId: professionalId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al sincronizar");
      }

      setSyncResult(data);

      if (data.success) {
        toast.success(
          `Sincronización exitosa: ${data.syncResult.created} eventos creados, ${data.syncResult.deleted} eliminados`
        );
      } else {
        toast.error(data.syncResult.error || "Error en sincronización");
      }

      // Actualizar diagnóstico después de sincronizar
      setTimeout(() => handleDiagnostic(), 1000);
    } catch (error: any) {
      console.error("Error en sincronización:", error);
      toast.error(error.message || "Error al forzar sincronización");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanDuplicates = async () => {
    if (!professionalId.trim()) {
      toast.error("Por favor ingresa un Professional ID");
      return;
    }

    try {
      setCleaning(true);
      setCleanResult(null);

      const response = await fetch("/api/admin/clean-duplicate-blocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ professionalId: professionalId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al limpiar duplicados");
      }

      setCleanResult(data);

      if (data.duplicatesRemoved > 0) {
        toast.success(
          `Limpieza exitosa: ${data.duplicatesRemoved} duplicados eliminados`
        );
      } else {
        toast.info("No se encontraron duplicados para eliminar");
      }

      // Actualizar diagnóstico después de limpiar
      setTimeout(() => handleDiagnostic(), 1000);
    } catch (error: any) {
      console.error("Error en limpieza:", error);
      toast.error(error.message || "Error al limpiar duplicados");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-800">
            Herramientas de Sincronización Google Calendar
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Input Card */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Buscar Profesional</CardTitle>
            <CardDescription>
              Ingresa el ID del profesional para diagnosticar y sincronizar su Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="professionalId">Professional ID</Label>
              <div className="flex gap-2">
                <Input
                  id="professionalId"
                  placeholder="bd8101ae-2d9e-4cf8-a9a7-927b69e9359c"
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleDiagnostic}
                  disabled={diagnosing || !professionalId.trim()}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {diagnosing ? "Diagnosticando..." : "Diagnosticar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Result */}
        {diagnosticResult && (
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Professional Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">Profesional</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Nombre:</span>{" "}
                    <span className="font-medium">{diagnosticResult.professional.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ID:</span>{" "}
                    <span className="font-mono text-xs">{diagnosticResult.professional.id}</span>
                  </div>
                </div>
              </div>

              {/* Google Calendar Status */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Estado:</span>{" "}
                    <Badge variant={diagnosticResult.googleCalendar.connected ? "default" : "secondary"}>
                      {diagnosticResult.googleCalendar.connected ? "Conectado" : "No Conectado"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>{" "}
                    <span className="font-medium">{diagnosticResult.googleCalendar.email}</span>
                  </div>
                </div>
              </div>

              {/* Blocks Statistics */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">Estadísticas de Bloqueos</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{diagnosticResult.blocks.total}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{diagnosticResult.blocks.external}</div>
                    <div className="text-gray-600">Externos (Google)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{diagnosticResult.blocks.internal}</div>
                    <div className="text-gray-600">Internos (Holistia)</div>
                  </div>
                </div>
              </div>

              {/* External Blocks List */}
              {diagnosticResult.externalBlocks && diagnosticResult.externalBlocks.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Eventos Externos ({diagnosticResult.externalBlocks.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {diagnosticResult.externalBlocks.map((block: any) => (
                      <div key={block.id} className="bg-white p-3 rounded border text-sm">
                        <div className="font-medium text-gray-900">{block.title}</div>
                        <div className="text-gray-600 mt-1">
                          {block.start_date} {block.start_time && `• ${block.start_time} - ${block.end_time}`}
                        </div>
                        {block.google_calendar_event_id && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            Google ID: {block.google_calendar_event_id}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleCleanDuplicates}
                  disabled={cleaning}
                  variant="outline"
                  size="lg"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${cleaning ? 'animate-spin' : ''}`} />
                  {cleaning ? "Limpiando..." : "Limpiar Duplicados"}
                </Button>

                <Button
                  onClick={handleForceSync}
                  disabled={loading || !diagnosticResult.googleCalendar.connected}
                  size="lg"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? "Sincronizando..." : "Forzar Sincronización"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync Result */}
        {syncResult && (
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-500" />
                Resultado de Sincronización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{syncResult.blocks.before}</div>
                    <div className="text-gray-600">Antes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{syncResult.blocks.after}</div>
                    <div className="text-gray-600">Después</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${syncResult.blocks.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {syncResult.blocks.difference >= 0 ? '+' : ''}{syncResult.blocks.difference}
                    </div>
                    <div className="text-gray-600">Diferencia</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <div>✅ Eventos creados: <span className="font-bold text-green-600">{syncResult.syncResult.created}</span></div>
                  <div>🗑️ Eventos eliminados: <span className="font-bold text-red-600">{syncResult.syncResult.deleted}</span></div>
                  {syncResult.syncResult.message && (
                    <div className="mt-2 text-gray-700">{syncResult.syncResult.message}</div>
                  )}

                  {/* Diagnostics */}
                  {syncResult.syncResult.diagnostics && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Diagnóstico Detallado:</h4>
                      <div className="space-y-1">
                        <div>📊 Eventos obtenidos de Google: <span className="font-bold">{syncResult.syncResult.diagnostics.totalFromGoogle}</span></div>
                        <div>🔵 Eventos de citas Holistia: <span className="font-bold">{syncResult.syncResult.diagnostics.holistiaEvents}</span></div>
                        <div>🟢 Bloques ya existentes: <span className="font-bold">{syncResult.syncResult.diagnostics.existingBlocks}</span></div>
                        <div>🎯 Eventos después de filtrar: <span className="font-bold">{syncResult.syncResult.diagnostics.afterFiltering}</span></div>
                      </div>

                      {syncResult.syncResult.diagnostics.totalFromGoogle > 0 && syncResult.syncResult.diagnostics.afterFiltering === 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                          ⚠️ Se obtuvieron {syncResult.syncResult.diagnostics.totalFromGoogle} eventos de Google Calendar pero todos fueron filtrados.
                          Esto puede ser porque son eventos transparentes, ya existen como bloques, o son citas de Holistia.
                        </div>
                      )}

                      {syncResult.syncResult.diagnostics.totalFromGoogle === 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                          ❌ No se obtuvieron eventos de Google Calendar. Verifica que el profesional tenga eventos en los próximos 30 días.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* External Blocks After Sync */}
              {syncResult.externalBlocks && syncResult.externalBlocks.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Eventos Sincronizados ({syncResult.externalBlocks.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {syncResult.externalBlocks.map((block: any) => (
                      <div key={block.id} className="bg-white p-3 rounded border text-sm">
                        <div className="font-medium text-gray-900">{block.title}</div>
                        <div className="text-gray-600 mt-1">
                          {block.start_date} {block.start_time && `• ${block.start_time} - ${block.end_time}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Creado: {new Date(block.created_at).toLocaleString('es-MX')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Clean Result */}
        {cleanResult && (
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                Resultado de Limpieza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <div>🧹 Duplicados eliminados: <span className="font-bold text-orange-600">{cleanResult.duplicatesRemoved}</span></div>
                  <div>📊 Total de bloques (antes): <span className="font-bold">{cleanResult.totalBlocks}</span></div>
                  <div>✅ Bloques únicos: <span className="font-bold text-green-600">{cleanResult.uniqueBlocks}</span></div>
                  <div>📈 Bloques restantes: <span className="font-bold">{cleanResult.remainingBlocks}</span></div>
                  {cleanResult.message && (
                    <div className="mt-2 text-gray-700">{cleanResult.message}</div>
                  )}
                </div>
              </div>

              {cleanResult.duplicatesRemoved > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                  ✅ Se eliminaron correctamente {cleanResult.duplicatesRemoved} bloques duplicados.
                  Ahora hay {cleanResult.uniqueBlocks} eventos únicos en el calendario.
                </div>
              )}

              {cleanResult.duplicatesRemoved === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  ℹ️ No se encontraron duplicados. El calendario está limpio.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
