
import OrderTrackingClient from "../../../components/order-tracking-client";

export const instant = false;

export default async function TrackOrderPage({ params }) {
  const { orderId } = await params;

  return <OrderTrackingClient orderId={orderId} />;
}
