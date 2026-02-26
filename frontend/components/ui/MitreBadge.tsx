export default function MitreBadge({
  techniqueId,
  techniqueName,
}: {
  techniqueId?: string;
  techniqueName?: string;
}) {
  if (!techniqueId) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-purple-500/15 text-purple-400 border border-purple-500/30">
      {techniqueId}
      {techniqueName && (
        <span className="text-purple-400/60 font-sans hidden lg:inline">
          {" "}
          {techniqueName}
        </span>
      )}
    </span>
  );
}
