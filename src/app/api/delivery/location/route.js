
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

function responseError(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export async function POST(request) {
  try {
    // Verify Firebase authentication token.
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return responseError("Authentication required.", 401);
    }

    const decodedToken = await adminAuth.verifyIdToken(token, true);

    // Only delivery personnel can submit GPS coordinates.
    if (decodedToken.deliveryBoy !== true) {
      return responseError("Delivery personnel access required.", 403);
    }

    const body = await request.json();

    const {
      orderId,
      latitude,
      longitude,
      accuracy,
      isActive = true,
    } = body;

    if (
      typeof orderId !== "string" ||
      !orderId.trim() ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      typeof isActive !== "boolean"
    ) {
      return responseError("Invalid location information.");
    }

    if (
      accuracy !== undefined &&
      (
        typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        accuracy < 0
      )
    ) {
      return responseError("Invalid GPS accuracy.");
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const locationRef = adminDb
      .collection("deliveryLocations")
      .doc(orderId);

    await adminDb.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);

      if (!orderSnapshot.exists) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const order = orderSnapshot.data();

      // The delivery person must be assigned to this order.
      if (order.deliveryBoyId !== decodedToken.uid) {
        throw new Error("ORDER_NOT_ASSIGNED");
      }

      if (
        order.orderStatus === "delivered" ||
        order.orderStatus === "cancelled"
      ) {
        throw new Error("ORDER_CLOSED");
      }

      transaction.set(locationRef, {
        orderId,
        deliveryBoyId: decodedToken.uid,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        isActive,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      message: isActive
        ? "Delivery location updated."
        : "Location sharing stopped.",
    });
  } catch (error) {
    if (error.message === "ORDER_NOT_FOUND") {
      return responseError("Order not found.", 404);
    }

    if (error.message === "ORDER_NOT_ASSIGNED") {
      return responseError("This order is not assigned to you.", 403);
    }

    if (error.message === "ORDER_CLOSED") {
      return responseError("This order is already closed.", 400);
    }

    if (error.code === "auth/id-token-expired" ||
        error.code === "auth/argument-error" ||
        error.code === "auth/id-token-revoked") {
      return responseError("Your session is invalid. Please log in again.", 401);
    }

    console.error("Delivery location API error:", error);

    return responseError("Unable to update delivery location.", 500);
  }
}
