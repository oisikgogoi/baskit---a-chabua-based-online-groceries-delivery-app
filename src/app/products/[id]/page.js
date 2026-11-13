
import ProductDetailClient from "../../../components/product-detail-client";

export const instant = false;

export default async function ProductPage({ params }) {
  const { id } = await params;

  return <ProductDetailClient productId={id} />;
}
