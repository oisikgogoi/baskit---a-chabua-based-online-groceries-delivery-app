import Link from "next/link";
import { notFound } from "next/navigation";
import ProductActions from "../../../components/product-actions";
import LoadingImage from "../../../components/loading-image";
import { products } from "../../../lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ id: String(product.id) }));
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = products.find((item) => String(item.id) === id);

  if (!product) notFound();

  return (
    <main className="product-page">
      <nav className="product-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <article className="product-detail-card">
        <div className="product-detail-image">
          <LoadingImage
            src={product.image}
            alt={product.name}
            priority
            sizes="(max-width: 700px) 100vw, 50vw"
          />
          <span className="product-badge">{product.badge}</span>
        </div>
        <div className="product-detail-copy">
          <p className="product-detail-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-description">{product.detail}</p>
          <div className="product-detail-price">
            <strong>₹{product.price}</strong>
            <del>₹{product.originalPrice}</del>
            <span>Inclusive of all taxes</span>
          </div>
          <ProductActions product={product} />
          <div className="product-delivery-note">
            <span className="product-delivery-icon" aria-hidden="true">↗</span>
            <span><strong>Fast local delivery</strong><small>Usually at your door in 10 minutes</small></span>
          </div>
          <p className="product-id">Product ID: {product.id}</p>
        </div>
      </article>
      <section className="product-information" aria-labelledby="product-information-title">
        <h2 id="product-information-title">Product information</h2>
        <dl>
          <div><dt>Category</dt><dd>{product.category}</dd></div>
          <div><dt>Pack size</dt><dd>{product.detail}</dd></div>
          <div><dt>Availability</dt><dd>In stock</dd></div>
        </dl>
      </section>
    </main>
  );
}
