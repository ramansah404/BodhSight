import { Loader2 } from "lucide-react";

export default function LoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px]">
      <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
      <p className="text-sm font-medium text-secondary animate-pulse">Loading BodhSight module...</p>
    </div>
  );
}
