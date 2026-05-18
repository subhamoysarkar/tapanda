import React, { useRef, useEffect } from 'react';
import { useScroll } from 'framer-motion';

export default function TapandaHeroAnim() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const frameCount = 345;
  const currentFrame = (index: number) =>
    `/images/hero_animation/Tapanda_Logo_Anim_${index.toString().padStart(3, '0')}.webp`;

  // Preload images into memory
  const images = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.current.push(img);
    }
  }, []);

  // Handle drawing to canvas on scroll progress change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set internal canvas resolution (adjust according to your assets' aspect ratio)
    canvas.width = 1920;
    canvas.height = 1080;

    // Draw first frame initially
    if (images.current[0]) {
      images.current[0].onload = () => {
        context.drawImage(images.current[0], 0, 0, canvas.width, canvas.height);
      };
    }

    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(latest * frameCount)
      );

      const img = images.current[frameIndex];
      if (img && img.complete) {
        requestAnimationFrame(() => {
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
        });
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative h-[400vh] w-full"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Place your Hero text overlays here */}
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="relative z-20 flex h-full flex-col items-center justify-center text-white text-center">
          <span className="mb-6 text-sm uppercase tracking-widest text-[#C9A84C]">
            Interior Design Studio
          </span>
          <h1 className="text-5xl md:text-7xl font-light leading-tight mb-4 font-serif">
            We Do Design <br />
            <em className="text-[#C9A84C] italic">For You…</em> <br />
            We Don't Re-arrange <br />
            <em className="text-[#C9A84C] italic">Templates…</em>
          </h1>
          <p className="text-lg opacity-80 mb-8 max-w-lg">
            Luxury Through Intelligence — Not Overspending
          </p>
          <button className="bg-[#C9A84C] text-black uppercase tracking-widest text-xs py-4 px-10 hover:bg-[#D4A843] transition-colors">
            Consult Now
          </button>
        </div>
      </div>
    </section>
  );
}
