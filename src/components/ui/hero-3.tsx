"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// Props interface for the component
interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  ctaHref: string;
  images: string[];
  className?: string;
}

// Reusable Button component styled like in the image
const ActionButton = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <Link href={href}>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="mt-8 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75"
    >
      {children}
    </motion.button>
  </Link>
);

// Image component with error handling
const MarqueeImage = ({ src, index, imageIndex }: { src: string; index: number; imageIndex: number }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="relative aspect-3/4 h-48 md:h-64 shrink-0"
      style={{
        rotate: `${(index % 2 === 0 ? -2 : 5)}deg`,
      }}
    >
      {!imageError ? (
        <Image
          src={src}
          alt={`Showcase image ${imageIndex + 1}`}
          fill
          className="object-cover rounded-2xl shadow-md"
          priority={index < 10}
          sizes="(max-width: 768px) 192px, 256px"
          onError={() => {
            console.error(`Failed to load image: ${src}`);
            setImageError(true);
          }}
        />
      ) : (
        <div className="w-full h-full bg-muted rounded-2xl flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Image {imageIndex + 1}</span>
        </div>
      )}
    </div>
  );
};

// The main hero component
export const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  tagline,
  title,
  description,
  ctaText,
  ctaHref,
  images,
  className,
}) => {
  // Animation variants for the text content
  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 100, 
        damping: 20 
      } 
    },
  };

  // Duplicate images multiple times for a seamless infinite loop
  // Más duplicados para una animación más suave
  const duplicatedImages = [...images, ...images, ...images, ...images, ...images];

  return (
    <section
      className={cn(
        "relative w-full h-screen overflow-hidden bg-background flex flex-col items-center justify-center text-center px-4",
        "md:justify-start md:pt-16",
        "lg:justify-center lg:pt-0",
        "xl:justify-center xl:pt-0",
        className
      )}
    >
      <div className="z-10 flex flex-col items-center w-full max-w-4xl pb-32 md:pb-40 lg:pb-48 xl:pb-56">
        {/* Tagline */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
        >
          {tagline}
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground"
        >
          {typeof title === 'string' ? (
            title.split(" ").map((word, i) => (
              <motion.span
                key={i}
                variants={FADE_IN_ANIMATION_VARIANTS}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))
          ) : (
            title
          )}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          {description}
        </motion.p>

        {/* Call to Action Button */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.6 }}
        >
          <ActionButton href={ctaHref}>{ctaText}</ActionButton>
        </motion.div>
      </div>

      {/* Animated Image Marquee */}
      <div className="absolute bottom-0 left-0 w-full h-1/4 md:h-1/3 lg:h-2/5 [mask:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] overflow-hidden">
        <motion.div
          className="flex gap-4 will-change-transform"
          initial={{ x: 0 }}
          animate={{
            x: `-${(duplicatedImages.length / 5) * 100}%`,
          }}
          transition={{
            ease: "linear",
            duration: 300,
            repeat: Infinity,
            repeatType: "loop",
          }}
          style={{
            willChange: "transform",
          }}
        >
          {duplicatedImages.map((src, index) => {
            const imageIndex = index % images.length;
            return (
              <MarqueeImage
                key={`${src}-${index}`}
                src={src}
                index={index}
                imageIndex={imageIndex}
              />
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

