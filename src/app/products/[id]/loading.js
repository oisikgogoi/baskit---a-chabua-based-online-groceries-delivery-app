export default function LoadingProduct() {
  return (
    <main className="product-page" aria-busy="true" aria-label="Loading product">
      <div className="product-breadcrumbs">
        <span className="product-skeleton product-skeleton-crumb" />
        <span className="product-skeleton product-skeleton-crumb" />
      </div>
      <div className="product-detail-card product-detail-skeleton">
        <div className="product-skeleton product-skeleton-image" />
        <div className="product-skeleton-copy">
          <span className="product-skeleton product-skeleton-category" />
          <span className="product-skeleton product-skeleton-title" />
          <span className="product-skeleton product-skeleton-description" />
          <span className="product-skeleton product-skeleton-price" />
          <span className="product-skeleton product-skeleton-action" />
          <span className="product-skeleton product-skeleton-action" />
        </div>
      </div>
    </main>
  );
}
