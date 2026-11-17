"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";

function NavigationIcon({ name }) {
  const shared = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...shared}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </svg>
    );
  }

  if (name === "categories") {
    return (
      <svg {...shared}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...shared}>
        <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L20 9H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </svg>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isDeliveryBoy, isAdmin } = useAuth();
  const { cart } = useCart();
  const itemCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );
  const visibleRoutes = ["/", "/cart", "/checkout", "/orders"];

  if (
    !visibleRoutes.includes(pathname) &&
    !pathname?.startsWith("/products/")
  ) {
    return null;
  }

  if (isDeliveryBoy || isAdmin) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link
        href="/#top"
        className="mobile-nav-item"
        aria-label="Go to home"
      >
        <NavigationIcon name="home" />
        <span>Home</span>
      </Link>

      <Link
        href="/#categories"
        className="mobile-nav-item"
        aria-label="Browse categories"
      >
        <NavigationIcon name="categories" />
        <span>Categories</span>
      </Link>

      <Link
        href="/orders"
        className="mobile-nav-item"
        aria-label="My Orders"
      >
        <NavigationIcon name="orders" />
        <span>My Orders</span>
      </Link>

      <Link
        href="/cart"
        className="mobile-nav-item"
        aria-label={`My Cart, ${itemCount} items`}
      >
        <span className="mobile-nav-cart-icon">
          <NavigationIcon name="cart" />
          {itemCount > 0 && (
            <span className="mobile-nav-count">{itemCount}</span>
          )}
        </span>
        <span>My Cart</span>
      </Link>
    </nav>
  );
}
