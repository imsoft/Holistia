/**
 * Convierte un archivo .mov (QuickTime) a MP4 en el navegador usando ffmpeg.wasm.
 * Solo se usa cuando el usuario sube .mov para que se reproduzca en todos los navegadores (Chrome, etc.).
 * Carga ~31 MB la primera vez; conversión por remux (-c copy) es rápida.
 */
export async function convertMovToMp4(file: File): Promise<File> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  await ffmpeg.writeFile("input.mov", await fetchFile(file));
  // Remux only (-c copy): no re-encoding, rápido y sin pérdida de calidad
  await ffmpeg.exec(["-i", "input.mov", "-c", "copy", "output.mp4"]);

  const data = await ffmpeg.readFile("output.mp4");
  const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array(0);
  const blob = new Blob([bytes], { type: "video/mp4" });
  const newName = file.name.replace(/\.mov$/i, ".mp4");
  return new File([blob], newName, { type: "video/mp4" });
}

/** Indica si el archivo es .mov / QuickTime y conviene convertirlo a MP4. */
export function isMovFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".mov") ||
    file.type === "video/quicktime"
  );
}
