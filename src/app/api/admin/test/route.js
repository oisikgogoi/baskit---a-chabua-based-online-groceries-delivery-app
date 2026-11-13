
import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";

export async function GET() {
  try {
    await adminDb.listCollections();

    return NextResponse.json({
      success: true,
      message: "Firebase Admin connected successfully!",
    });
  } catch (error) {
    console.error("Firebase Admin test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Firebase Admin connection failed.",
      },
      { status: 500 }
    );
  }
}
