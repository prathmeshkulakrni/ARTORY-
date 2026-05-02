"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThreeDMarquee({ images, className }) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      <div
        className="flex w-[150%] justify-center gap-4 sm:gap-6 md:gap-8"
        style={{
          transform: "rotateX(20deg) rotateZ(-20deg) rotateY(10deg) scale(1.2)",
          transformStyle: "preserve-3d",
        }}
      >
        <MarqueeColumn images={images} speed={30} reverse />
        <MarqueeColumn images={images} speed={40} />
        <MarqueeColumn images={images} speed={35} reverse className="hidden sm:flex" />
        <MarqueeColumn images={images} speed={45} className="hidden md:flex" />
        <MarqueeColumn images={images} speed={32} reverse className="hidden lg:flex" />
      </div>
    </div>
  );
}

function MarqueeColumn({ images, speed = 30, reverse = false, className }) {
  // If we don't have enough images, duplicate them
  const displayImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    let arr = [...images];
    while (arr.length < 10) {
      arr = [...arr, ...images];
    }
    return arr;
  }, [images]);

  if (displayImages.length === 0) return null;

  const yStart = reverse ? "-50%" : "0%";
  const yEnd = reverse ? "0%" : "-50%";

  return (
    <div
      className={cn(
        "relative flex h-[250vh] w-40 sm:w-48 md:w-64 -translate-y-[75vh] flex-col overflow-hidden",
        className
      )}
    >
      <motion.div
        className="flex flex-col gap-4 sm:gap-6 md:gap-8"
        animate={{ y: [yStart, yEnd] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speed,
        }}
      >
        {/* Render twice for infinite loop */}
        {[...displayImages, ...displayImages].map((img, idx) => (
          <div
            key={idx}
            className="relative h-56 sm:h-64 md:h-80 w-full shrink-0 overflow-hidden rounded-2xl shadow-2xl border border-white/10"
          >
            <img
              src={img}
              alt="marquee item"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
