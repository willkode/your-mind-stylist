import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function LazyImage({ 
  src, 
  alt, 
  className = "", 
  wrapperClassName = "",
  placeholderSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23E4D9C4' width='400' height='300'/%3E%3C/svg%3E",
  threshold = 0.1,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "50px" }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={imgRef} className={wrapperClassName}>
      <motion.img
        src={isInView ? src : placeholderSrc}
        alt={alt}
        className={className}
        onLoad={() => setIsLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
        loading="lazy"
        {...props}
      />
    </div>
  );
}