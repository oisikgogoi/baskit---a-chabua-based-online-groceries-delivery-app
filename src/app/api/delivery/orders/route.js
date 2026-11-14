
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

function getBearerToken(request) {
  const authorization = request.headers.get("authorization");

  return authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
}

async function verifyDeliveryPerson(request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("AUTH_REQUIRED");
  }

  const decodedToken = await adminAuth.verifyIdToken(token, true);

  if (decodedToken.deliveryBoy !== true) {
    throw new Error("DELIVERY_ACCESS_REQUIRED");
  }

  return decodedToken;
}

function authErrorResponse(error) {
  if (
    error.message === "AUTH_REQUIRED" ||
    error.code?.startsWith("auth/")
  ) {
    return NextResponse.json(
      { success: false, message: "Please sign in again." },
      { status: 401 }
    );
  }

  if (error.message === "DELIVERY_ACCESS_REQUIRED") {
    return NextResponse.json(
      {
        success: false,
        message: "Delivery personnel access required.",
      },
      { status: 403 }
    );
  }

  return null;
}

function serializeDate(value) {
  return value?.toDate?.()?.toISOString() || null;
}

function getCustomerDetails(order) {
  const customer = order.customer || {};

  const phone =
    customer.phone ||
    customer.phoneNumber ||
    customer.mobile ||
    customer.mobileNumber ||
    customer.contactNumber ||
    order.customerPhone ||
    order.customerPhoneNumber ||
    order.phone ||
    order.phoneNumber ||
    order.mobile ||
    order.mobileNumber ||
    "";

  return {
    ...customer,
    phone: String(phone || "").trim(),
  };
}

// Read payment method from supported Firestore structures.
function getPaymentMethod(order) {
  const candidates = [
    order.paymentMethod,
    order.payment?.method,
    order.payment?.paymentMethod,
    order.paymentDetails?.method,
    order.paymentInfo?.method,
    order.paymentType,
    order.paymentMode,
    order.payment_type,
    order.payment_mode,
  ];

  const method = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );

  return method ? method.trim() : "";
}

function normalizePaymentMethod(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isCodOrder(order) {
  const method = normalizePaymentMethod(getPaymentMethod(order));

  return [
    "cod",
    "cash",
    "cashondelivery",
    "cashondeliverypayment",
  ].includes(method);
}

function getPaymentStatus(order) {
  return String(
    order.paymentStatus ||
    order.payment?.status ||
    order.paymentDetails?.status ||
    order.paymentInfo?.status ||
    "pending"
  )
    .trim()
    .toLowerCase();
}

function isPaymentPaid(order) {
  return [
    "paid",
    "completed",
    "success",
    "successful",
  ].includes(getPaymentStatus(order));
}

// Delivery status sequence.
const STATUS_TRANSITIONS = {
  placed: "confirmed",
  pending: "confirmed",
  order_placed: "confirmed",
  confirmed: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "out_for_delivery",
  out_for_delivery: "delivered",
};

// GET: Load assigned orders.
export async function GET(request) {
  try {
    const decodedToken = await verifyDeliveryPerson(request);

    const snapshot = await adminDb
      .collection("orders")
      .where("deliveryBoyId", "==", decodedToken.uid)
      .get();

    const orders = snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }))
      .filter(
        (order) =>
          order.orderStatus !== "delivered" &&
          order.orderStatus !== "cancelled"
      )
      .map((order) => ({
        id: order.id,
        orderStatus: order.orderStatus || "placed",
        customer: getCustomerDetails(order),
        deliveryAddress: order.deliveryAddress || {},
        items: order.items || [],

        paymentMethod: getPaymentMethod(order),
        isCodOrder: isCodOrder(order),

        paymentStatus: getPaymentStatus(order),
        isPaymentPaid: isPaymentPaid(order),

        paymentCollection: order.paymentCollection
          ? {
              method: order.paymentCollection.method || "",
              collectedAt: serializeDate(
                order.paymentCollection.collectedAt
              ),
            }
          : null,

        totalAmount:
          order.totalAmount ??
          order.total ??
          order.grandTotal ??
          order.pricing?.total ??
          order.amount ??
          0,

        createdAt: serializeDate(order.createdAt),
        updatedAt: serializeDate(order.updatedAt),
      }));

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Delivery orders API error:", error);

    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load assigned orders.",
      },
      { status: 500 }
    );
  }
}

// POST: Update status OR collect COD payment.
export async function POST(request) {
  try {
    const decodedToken = await verifyDeliveryPerson(request);
    const body = await request.json();

    const orderId =
      typeof body.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection("orders").doc(orderId);

    // UPDATE DELIVERY STATUS
    if (body.action === "update_status") {
      const requestedStatus =
        typeof body.status === "string"
          ? body.status.trim().toLowerCase()
          : "";

      if (!Object.values(STATUS_TRANSITIONS).includes(requestedStatus)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid delivery status.",
          },
          { status: 400 }
        );
      }

      const result = await adminDb.runTransaction(async (transaction) => {
        const orderSnapshot = await transaction.get(orderRef);

        if (!orderSnapshot.exists) {
          return {
            success: false,
            status: 404,
            message: "Order not found.",
          };
        }

        const order = orderSnapshot.data();

        if (order.deliveryBoyId !== decodedToken.uid) {
          return {
            success: false,
            status: 403,
            message: "This order is not assigned to you.",
          };
        }

        const currentStatus = String(
          order.orderStatus || "placed"
        ).toLowerCase();

        if (currentStatus === "cancelled") {
          return {
            success: false,
            status: 400,
            message: "A cancelled order cannot be updated.",
          };
        }

        if (currentStatus === "delivered") {
          return {
            success: false,
            status: 409,
            message: "This order has already been delivered.",
          };
        }

        const nextStatus = STATUS_TRANSITIONS[currentStatus];

        if (nextStatus !== requestedStatus) {
          return {
            success: false,
            status: 409,
            message: `Invalid status transition. Current status: ${currentStatus}.`,
          };
        }

        transaction.update(orderRef, {
          orderStatus: requestedStatus,
          updatedAt: FieldValue.serverTimestamp(),
          statusUpdatedAt: FieldValue.serverTimestamp(),
          statusUpdatedBy: decodedToken.uid,
        });

        return {
          success: true,
          status: requestedStatus,
        };
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
          },
          { status: result.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Order status updated successfully.",
        orderStatus: result.status,
      });
    }

    // COLLECT COD PAYMENT
    const method =
      typeof body.method === "string"
        ? body.method.trim().toLowerCase()
        : "";

    if (!["cash", "upi"].includes(method)) {
      return NextResponse.json(
        {
          success: false,
          message: "Select a valid payment method.",
        },
        { status: 400 }
      );
    }

    if (body.confirmedReceived !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "Confirm that the payment has been received.",
        },
        { status: 400 }
      );
    }

    const result = await adminDb.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);

      if (!orderSnapshot.exists) {
        return {
          success: false,
          status: 404,
          message: "Order not found.",
        };
      }

      const order = orderSnapshot.data();

      if (order.deliveryBoyId !== decodedToken.uid) {
        return {
          success: false,
          status: 403,
          message: "This order is not assigned to you.",
        };
      }

      if (
        order.orderStatus === "cancelled" ||
        order.orderStatus === "delivered"
      ) {
        return {
          success: false,
          status: 400,
          message: "Payment cannot be collected for this order.",
        };
      }

      const originalPaymentMethod = getPaymentMethod(order);

      if (!isCodOrder(order)) {
        return {
          success: false,
          status: 400,
          message: `This is not recognized as a COD order. Detected method: ${
            originalPaymentMethod || "not found"
          }.`,
        };
      }

      if (isPaymentPaid(order)) {
        return {
          success: false,
          status: 409,
          message: "This order has already been marked as paid.",
        };
      }

      const collectedAt = FieldValue.serverTimestamp();

      transaction.update(orderRef, {
        paymentStatus: "paid",
        paymentCollection: {
          method,
          collectedBy: decodedToken.uid,
          collectedAt,
        },
        paymentCollectedAt: collectedAt,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        method,
      };
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully recorded.",
      paymentStatus: "paid",
      method: result.method,
    });
  } catch (error) {
    console.error("Delivery orders API error:", error);

    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process delivery order request.",
      },
      { status: 500 }
    );
  }
}
