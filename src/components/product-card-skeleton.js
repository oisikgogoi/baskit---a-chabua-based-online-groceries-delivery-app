export default function ProductCardSkeleton() {
  return (
    <article className="product-card-skeleton" aria-hidden="true">
      <div className="product-card-skeleton-image loading-skeleton" />
      <div className="product-card-skeleton-copy">
        <span className="loading-skeleton product-card-skeleton-detail" />
        <span className="loading-skeleton product-card-skeleton-title" />
        <span className="loading-skeleton product-card-skeleton-price" />
      </div>
    </article>
  );
}
