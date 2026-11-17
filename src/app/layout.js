
import { Geist, Geist_Mono } from "next/font/google";
import AuthGate from "../components/auth-gate";
import { CartProvider } from "../components/cart-provider";
import { AuthProvider } from "../components/auth-provider";
import MobileBottomNav from "../components/mobile-bottom-nav";
import "./globals.css";

import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quickbite | Good food, delivered quickly",
  description:
    "Fresh finds and everyday favourites, delivered to your door in minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthGate>
            <CartProvider>
              <div className="app-content">{children}</div>
              <MobileBottomNav />
            </CartProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
