export default function SoniMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`soni-mark${compact ? " soni-mark--compact" : ""}`} aria-hidden="true">
      <span className="soni-mark__screen">
        <span className="soni-mark__brow soni-mark__brow--left" />
        <span className="soni-mark__brow soni-mark__brow--right" />
        <span className="soni-mark__eye soni-mark__eye--left" />
        <span className="soni-mark__eye soni-mark__eye--right" />
        <span className="soni-mark__smile" />
      </span>
      <span className="soni-mark__antenna soni-mark__antenna--left" />
      <span className="soni-mark__antenna soni-mark__antenna--right" />
    </span>
  );
}
