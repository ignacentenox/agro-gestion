import { Loader2 } from "lucide-react";

export function GlobalLoader({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="flex flex-col items-center">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600 mb-4" />
        <span className="text-white font-semibold">Cargando...</span>
      </div>
    </div>
  );
}
