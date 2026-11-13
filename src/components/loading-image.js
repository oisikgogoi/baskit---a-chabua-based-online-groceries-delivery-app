
"use client";

import Image from "next/image";
import { useState } from "react";

export default function LoadingImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  objectFit = "cover",
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={priority}
        loading={priority ? undefined : "lazy"}
        className={`loading-image ${isLoaded ? "is-loaded" : ""} ${className}`.trim()}
        style={{ objectFit }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />

      {!isLoaded && (
        <span
          className={`image-loading-placeholder ${hasError ? "has-error" : ""}`}
          aria-hidden="true"
        >
          {hasError ? (
            "Image unavailable"
          ) : (
            <span className="image-loading-shimmer" />
          )}
        </span>
      )}
    </>
  );
}
