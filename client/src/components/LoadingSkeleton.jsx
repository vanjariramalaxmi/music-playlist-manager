export default function LoadingSkeleton({ count = 3, variant = 'row' }) {
  return (
    <div className={`skeleton-list skeleton-${variant}`} aria-label="Loading content">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-item" key={index} />
      ))}
    </div>
  );
}
