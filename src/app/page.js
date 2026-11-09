"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../components/cart-provider";
import LoadingImage from "../components/loading-image";
import { products } from "../lib/products";

const categories = [
  { name: "All", emoji: "🛍️" },
  { name: "Fruits & veg", emoji: "🥑" },
  { name: "Dairy & eggs", emoji: "🥛" },
  { name: "Bakery", emoji: "🥐" },
  { name: "Pantry", emoji: "🌾" },
  { name: "Snacks", emoji: "🍿" },
  { name: "Drinks", emoji: "🧃" },
];

function Icon({ name, size = 20 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "search") {
    return <svg {...shared}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
  }
  if (name === "pin") {
    return <svg {...shared}><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
  }
  if (name === "chevron") {
    return <svg {...shared}><path d="m7 10 5 5 5-5" /></svg>;
  }
  if (name === "cart") {
    return <svg {...shared}><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L20 9H6" /><circle cx="10" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>;
  }
  if (name === "plus") {
    return <svg {...shared}><path d="M12 5v14M5 12h14" /></svg>;
  }
  if (name === "minus") {
    return <svg {...shared}><path d="M5 12h14" /></svg>;
  }
  if (name === "clock") {
    return <svg {...shared}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }
  return <svg {...shared}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const { cart, changeQuantity, isLoaded: isCartLoaded } = useCart();

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const searchText = `${product.name} ${product.detail} ${product.category}`.toLowerCase();
    return matchesCategory && searchText.includes(search.trim().toLowerCase());
  });
  const cartItems = products.filter((product) => cart[product.id]);
  const itemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const subtotal = cartItems.reduce((total, product) => total + product.price * cart[product.id], 0);
  const deliveryFee = subtotal === 0 || subtotal >= 299 ? 0 : 19;
  const handlingFee = subtotal === 0 ? 0 : 4;
  const total = subtotal + deliveryFee + handlingFee;

  function showCheckoutNotice() {
    setNotice("Checkout preview only. Connect a backend to place a real order.");
    window.setTimeout(() => setNotice(""), 3800);
  }

  function scrollToProducts() {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  function submitSearch(event) {
    event.preventDefault();
    setActiveCategory("All");
    scrollToProducts();
  }

  return (
    <main className="storefront">
      <div className="announcement">
        <span className="announcement-sparkle">✳</span>
        A little less waiting, a lot more living.
        <span className="announcement-right">Free delivery over ₹299</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Quickbite home">
          <span className="brand-mark"><span /></span>
          <span>quickbite<span className="brand-period">.</span></span>
        </a>

        <button className="location-button" type="button" aria-label="Delivery location: Indiranagar, Bengaluru">
          <span className="location-icon"><Icon name="pin" size={18} /></span>
          <span className="location-copy"><span className="location-label">Delivering to</span><strong>Indiranagar, Bengaluru</strong></span>
          <Icon name="chevron" size={17} />
        </button>

        <form className="search-box" role="search" onSubmit={submitSearch}>
          <Icon name="search" size={20} />
          <input
            type="search"
            placeholder="Search for fruits, milk, snacks..."
            aria-label="Search groceries"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="search-submit-button" type="submit" aria-label="Search products">
            Search
          </button>
        </form>

        <button className="account-button" type="button" aria-label="Your account">
          <span className="account-avatar">A</span>
          <span>Account</span>
        </button>
        <button className="header-cart" type="button" onClick={scrollToProducts} aria-label={`Cart, ${itemCount} items`}>
          <Icon name="cart" size={20} />
          <span>Cart</span>
          {itemCount > 0 && <span className="header-cart-count">{itemCount}</span>}
        </button>
      </header>

      <div className="header-rule" />

      <div className="page-shell" id="top">
        <section className="hero" aria-label="Quickbite delivery offer">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="live-dot" /> YOUR NEIGHBOURHOOD, ON SPEED DIAL</span>
            <h1>Good food.<br />Great mood.<br /><em>10 minutes.</em></h1>
            <p>Fresh finds and everyday favourites, right when you need them.</p>
            <button className="hero-button" type="button" onClick={scrollToProducts}>
              Shop the good stuff <Icon name="arrow" size={18} />
            </button>
            <div className="hero-footnote"><span>✳</span> Thoughtfully picked. Happily delivered.</div>
          </div>
          <div className="hero-photo">
            <Image
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1500&q=90"
              alt="A colourful market display of fresh fruits and vegetables"
              fill
              preload
              sizes="(max-width: 700px) 100vw, 58vw"
              style={{ objectFit: "cover", objectPosition: "center 52%" }}
            />
            <div className="hero-photo-tag"><span>✦</span><span>Freshness<br /><strong>on the way</strong></span></div>
          </div>
        </section>

        <section className="promise-row" aria-label="Delivery highlights">
          <div className="promise"><span className="promise-icon promise-green"><Icon name="clock" size={18} /></span><span><strong>At your door in 10</strong><small>Really, really quick</small></span></div>
          <span className="promise-divider" />
          <div className="promise"><span className="promise-icon promise-yellow">✳</span><span><strong>Freshness first</strong><small>Good stuff, every time</small></span></div>
          <span className="promise-divider" />
          <div className="promise"><span className="promise-icon promise-coral">♡</span><span><strong>Free delivery</strong><small>On orders over ₹299</small></span></div>
          <div className="promise-note">Your local good-food people <span>↗</span></div>
        </section>

        <section className="category-section" aria-labelledby="category-title">
          <div className="section-heading category-heading">
            <div><p className="eyebrow">THE GOOD STUFF, SORTED</p><h2 id="category-title">Shop by category</h2></div>
            <span className="category-hint">A little bit of everything, all in one place.</span>
          </div>
          <div className="category-list" role="tablist" aria-label="Grocery categories">
            {categories.map((category) => (
              <button
                className={`category-item${activeCategory === category.name ? " is-active" : ""}`}
                key={category.name}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.name}
                onClick={() => setActiveCategory(category.name)}
              >
                <span className="category-emoji" aria-hidden="true">{category.emoji}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="shopping-layout" id="products">
          <section className="product-section" aria-labelledby="products-title">
            <div className="section-heading product-heading">
              <div><p className="eyebrow">A GOOD DAY STARTS HERE</p><h2 id="products-title">{search ? "Search results" : activeCategory === "All" ? "Everyday favourites" : activeCategory}</h2></div>
              <span className="product-count">{filteredProducts.length} lovely finds</span>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image-wrap">
                      <Link className="product-image-link" href={`/products/${product.id}`} prefetch aria-label={`View ${product.name}`}>
                        <LoadingImage
                          src={product.image}
                          alt={product.name}
                          sizes="(max-width: 600px) 44vw, (max-width: 1000px) 28vw, 20vw"
                        />
                      </Link>
                      <span className="product-badge">{product.badge}</span>
                      {cart[product.id] > 0 && <span className="in-cart-label">{cart[product.id]} in bag</span>}
                    </div>
                    <div className="product-info">
                      <Link className="product-info-link" href={`/products/${product.id}`} prefetch>
                        <p className="product-detail">{product.detail}</p>
                        <h3>{product.name}</h3>
                      </Link>
                      <div className="product-buy-row">
                        <div className="price-block"><strong>₹{product.price}</strong><del>₹{product.originalPrice}</del></div>
                        {cart[product.id] ? (
                          <div className="quantity-control" aria-label={`${product.name} quantity`}>
                            <button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}><Icon name="minus" size={15} /></button>
                            <span aria-live="polite">{cart[product.id]}</span>
                            <button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Add one ${product.name}`}><Icon name="plus" size={15} /></button>
                          </div>
                        ) : (
                          <button className="add-button" type="button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Add ${product.name} to cart`}>
                            Add <Icon name="plus" size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-search"><span>🥬</span><h3>Nothing in the basket just yet</h3><p>Try another search, or browse all the good stuff.</p><button type="button" onClick={() => { setSearch(""); setActiveCategory("All"); }}>See everything</button></div>
            )}
          </section>

          <aside className="cart-panel" aria-labelledby="cart-title">
            <div className="cart-panel-heading">
              <div><p className="eyebrow">THE BEST PART</p><h2 id="cart-title">Your basket <span>({itemCount})</span></h2></div>
              <span className="basket-art">✳</span>
            </div>
            {!isCartLoaded ? (
              <div className="cart-loading-skeleton" aria-label="Loading basket">
                <span className="loading-skeleton cart-skeleton-row" />
                <span className="loading-skeleton cart-skeleton-row" />
                <span className="loading-skeleton cart-skeleton-total" />
              </div>
            ) : cartItems.length > 0 ? (
              <>
                <div className="cart-items">
                  {cartItems.map((product) => (
                    <div className="cart-item" key={product.id}>
                      <div className="cart-item-image"><LoadingImage src={product.image} alt="" sizes="52px" /></div>
                      <div className="cart-item-copy"><strong>{product.name}</strong><span>₹{product.price} × {cart[product.id]}</span></div>
                      <div className="cart-item-total">₹{product.price * cart[product.id]}</div>
                      <div className="cart-mini-quantity">
                        <button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}><Icon name="minus" size={13} /></button>
                        <span>{cart[product.id]}</span>
                        <button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Add one ${product.name}`}><Icon name="plus" size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-note"><span>✦</span>{subtotal >= 299 ? "You unlocked free delivery!" : `Add ₹${299 - subtotal} more for free delivery`}</div>
                <div className="bill-lines">
                  <div><span>Item total</span><span>₹{subtotal}</span></div>
                  <div><span>Delivery fee</span><span>{deliveryFee === 0 ? <em>FREE</em> : `₹${deliveryFee}`}</span></div>
                  <div><span>Handling</span><span>₹{handlingFee}</span></div>
                </div>
                <div className="cart-total"><strong>To pay</strong><strong>₹{total}</strong></div>
                <button className="checkout-button" type="button" onClick={showCheckoutNotice}>Continue to checkout <Icon name="arrow" size={17} /></button>
                <p className="checkout-caption">Fast delivery, happy fridge.</p>
              </>
            ) : (
              <div className="empty-cart"><span className="empty-cart-illustration">🧺</span><h3>Your basket is taking a little break</h3><p>Add a few favourites and we’ll bring them right over.</p><button type="button" onClick={scrollToProducts}>Find your favourites <Icon name="arrow" size={15} /></button></div>
            )}
          </aside>
        </div>

        <footer className="site-footer"><a className="footer-brand" href="#top">quickbite<span>.</span></a><span>Good things, delivered quickly.</span><span className="footer-right">Made for your neighbourhood <span>✳</span></span></footer>
      </div>

      {itemCount > 0 && <button className="mobile-cart-bar" type="button" onClick={() => document.querySelector(".cart-panel")?.scrollIntoView({ behavior: "smooth" })}><span><Icon name="cart" size={19} /> {itemCount} {itemCount === 1 ? "item" : "items"}</span><strong>View basket · ₹{total} <Icon name="arrow" size={16} /></strong></button>}
      {notice && <div className="toast" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
    </main>
  );
}
