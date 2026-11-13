
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";

import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

function responseError(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export async function POST(request) {
  let createdUid = null;

  try {
    // Verify the admin's Firebase ID token.
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return responseError("Authentication required.", 401);
    }

    const idToken = authorization.slice(7);

    const decodedToken = await adminAuth.verifyIdToken(
      idToken,
      true
    );

    if (decodedToken.admin !== true) {
      return responseError("Admin access required.", 403);
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.trim()
        : "";

    if (!name || name.length < 2 || name.length > 80) {
      return responseError("Enter a valid delivery person's name.");
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return responseError("Enter a valid email address.");
    }

    if (
      phoneNumber &&
      !/^\+[1-9]\d{7,14}$/.test(phoneNumber)
    ) {
      return responseError(
        "Phone number must use international format, e.g. +919876543210."
      );
    }

    // Generate a temporary password on the server.
    const temporaryPassword =
      randomBytes(24).toString("base64url");

    // Create the Firebase Authentication account.
    const deliveryUser = await adminAuth.createUser({
      email,
      password: temporaryPassword,
      displayName: name,
      ...(phoneNumber ? { phoneNumber } : {}),
      disabled: false,
    });

    createdUid = deliveryUser.uid;

    // Assign the privileged claim only from the server.
    await adminAuth.setCustomUserClaims(
      deliveryUser.uid,
      {
        deliveryBoy: true,
      }
    );

    // Save delivery personnel details in Firestore.
    await adminDb
      .collection("deliveryPersonnel")
      .doc(deliveryUser.uid)
      .set({
        uid: deliveryUser.uid,
        name,
        email,
        phoneNumber,
        status: "active",
        createdBy: decodedToken.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      message: "Delivery account created successfully.",
      deliveryPerson: {
        uid: deliveryUser.uid,
        name,
        email,
        phoneNumber,
      },
      temporaryPassword,
    });
  } catch (error) {
    console.error("Delivery account creation error:", error);

    // Roll back the Auth account if a later step fails.
    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error(
          "Delivery account rollback failed:",
          rollbackError
        );
      }
    }

    if (error.code === "auth/email-already-exists") {
      return responseError(
        "An account with this email already exists.",
        409
      );
    }

    if (
      error.code === "auth/invalid-email" ||
      error.code === "auth/invalid-phone-number"
    ) {
      return responseError("Invalid email or phone number.");
    }

    if (
      error.code === "auth/id-token-expired" ||
      error.code === "auth/invalid-id-token" ||
      error.code === "auth/revoked-id-token"
    ) {
      return responseError(
        "Your session has expired. Please log in again.",
        401
      );
    }

    return responseError(
      "Unable to create delivery account. Please try again.",
      500
    );
  }
}
