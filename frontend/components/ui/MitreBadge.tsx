export default function MitreBadge({
  techniqueId,
  techniqueName,
}: {
  techniqueId?: string;
  techniqueName?: string;
}) {
  if (!techniqueId) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] bg-accent-red/8 text-accent-red border border-accent-red/20">
      {techniqueId}
      {techniqueName && (
        <span className="text-accent-red/60 font-normal normal-case hidden lg:inline tracking-normal">
          {techniqueName}
        </span>
      )}
    </span>
  );
}
