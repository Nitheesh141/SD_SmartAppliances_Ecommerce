"use client";

import React, { useEffect, useRef, useState } from "react";

interface ApplianceElement {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: number;
  opacity: number;
  depth: number; // 0.3 (far) to 1.0 (near)
  angle: number;
  rotationSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  depth: number;
  color: string;
  life: number;
  maxLife: number;
}

export default function KitchenBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detect theme on mount and when DOM classes change
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Speed configuration based on system motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speedMultiplier = prefersReducedMotion ? 0.08 : 0.6;

    // Element pools
    const appliances: ApplianceElement[] = [];
    const particles: Particle[] = [];

    // Initialize floating appliance outlines
    const applianceCount = Math.max(8, Math.min(18, Math.floor((width * height) / 100000)));
    for (let i = 0; i < applianceCount; i++) {
      const depth = 0.3 + Math.random() * 0.7; // parallax depth
      appliances.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15 * speedMultiplier * depth,
        vy: (Math.random() - 0.5) * 0.12 * speedMultiplier * depth,
        size: 28 + Math.random() * 22,
        type: Math.floor(Math.random() * 6), // 6 different appliance types
        opacity: 0.05 + (depth - 0.3) * 0.12, // deeper objects are fainter
        depth,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.002 * speedMultiplier,
      });
    }

    // Initialize connectivity node particles
    const particleCount = Math.max(30, Math.min(80, Math.floor((width * height) / 20000)));
    for (let i = 0; i < particleCount; i++) {
      const depth = 0.2 + Math.random() * 0.8;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25 * speedMultiplier * depth,
        vy: (Math.random() - 0.5) * 0.22 * speedMultiplier * depth,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + (depth - 0.2) * 0.25,
        depth,
        color: isDark ? "rgba(147, 197, 253, 0.4)" : "rgba(215, 25, 32, 0.15)",
        life: 1,
        maxLife: 1,
      });
    }

    // Handle resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Drawing helpers for appliance vector silhouettes
    const drawAppliance = (ctx: CanvasRenderingContext2D, type: number, x: number, y: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      switch (type) {
        case 0: // Refrigerator
          ctx.beginPath();
          ctx.roundRect(-size * 0.35, -size * 0.7, size * 0.7, size * 1.4, size * 0.08);
          ctx.stroke();
          // Split line between freezer and lower part
          ctx.beginPath();
          ctx.moveTo(-size * 0.35, -size * 0.15);
          ctx.lineTo(size * 0.35, -size * 0.15);
          ctx.stroke();
          // Handles
          ctx.beginPath();
          ctx.moveTo(size * 0.12, -size * 0.5);
          ctx.lineTo(size * 0.12, -size * 0.25);
          ctx.moveTo(size * 0.12, -size * 0.05);
          ctx.lineTo(size * 0.12, size * 0.35);
          ctx.stroke();
          break;

        case 1: // Coffee Cup / Mug (representing Coffee Maker)
          // Cup body
          ctx.beginPath();
          ctx.moveTo(-size * 0.4, -size * 0.3);
          ctx.lineTo(size * 0.4, -size * 0.3);
          ctx.arc(0, -size * 0.3, size * 0.4, 0, Math.PI);
          ctx.stroke();
          // Handle
          ctx.beginPath();
          ctx.arc(size * 0.4, -size * 0.1, size * 0.18, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
          // Saucer
          ctx.beginPath();
          ctx.ellipse(0, size * 0.16, size * 0.6, size * 0.08, 0, 0, Math.PI * 2);
          ctx.stroke();
          // Steam lines
          ctx.beginPath();
          ctx.moveTo(-size * 0.18, -size * 0.45);
          ctx.bezierCurveTo(-size * 0.22, -size * 0.55, -size * 0.1, -size * 0.6, -size * 0.15, -size * 0.7);
          ctx.moveTo(size * 0.05, -size * 0.45);
          ctx.bezierCurveTo(size * 0.01, -size * 0.55, size * 0.15, -size * 0.6, size * 0.1, -size * 0.7);
          ctx.stroke();
          break;

        case 2: // Blender
          // Base
          ctx.beginPath();
          ctx.roundRect(-size * 0.3, size * 0.2, size * 0.6, size * 0.3, size * 0.05);
          ctx.stroke();
          // Jar (trapezoid)
          ctx.beginPath();
          ctx.moveTo(-size * 0.18, size * 0.2);
          ctx.lineTo(-size * 0.28, -size * 0.5);
          ctx.lineTo(size * 0.28, -size * 0.5);
          ctx.lineTo(size * 0.18, size * 0.2);
          ctx.closePath();
          ctx.stroke();
          // Handle
          ctx.beginPath();
          ctx.moveTo(size * 0.24, -size * 0.42);
          ctx.lineTo(size * 0.38, -size * 0.4);
          ctx.lineTo(size * 0.3, -size * 0.08);
          ctx.lineTo(size * 0.2, -size * 0.1);
          ctx.stroke();
          // Lid
          ctx.beginPath();
          ctx.moveTo(-size * 0.3, -size * 0.5);
          ctx.lineTo(size * 0.3, -size * 0.5);
          ctx.lineTo(size * 0.15, -size * 0.58);
          ctx.lineTo(-size * 0.15, -size * 0.58);
          ctx.closePath();
          ctx.stroke();
          break;

        case 3: // Air Fryer / Smart Cooker
          ctx.beginPath();
          // Outer capsule shell
          ctx.roundRect(-size * 0.4, -size * 0.55, size * 0.8, size * 1.1, size * 0.2);
          ctx.stroke();
          // Drawer horizontal line
          ctx.beginPath();
          ctx.moveTo(-size * 0.4, size * 0.08);
          ctx.lineTo(size * 0.4, size * 0.08);
          ctx.stroke();
          // Touch display circle
          ctx.beginPath();
          ctx.arc(0, -size * 0.22, size * 0.13, 0, Math.PI * 2);
          ctx.stroke();
          // Handle
          ctx.beginPath();
          ctx.roundRect(-size * 0.08, size * 0.18, size * 0.16, size * 0.25, size * 0.04);
          ctx.stroke();
          break;

        case 4: // Microwave / Oven
          ctx.beginPath();
          ctx.roundRect(-size * 0.5, -size * 0.38, size * 1.0, size * 0.76, size * 0.06);
          ctx.stroke();
          // Glass panel
          ctx.beginPath();
          ctx.roundRect(-size * 0.42, -size * 0.26, size * 0.58, size * 0.52, size * 0.04);
          ctx.stroke();
          // Control buttons panel splitter
          ctx.beginPath();
          ctx.moveTo(size * 0.26, -size * 0.38);
          ctx.lineTo(size * 0.26, size * 0.38);
          ctx.stroke();
          // Dynamic dials/indicator lines
          ctx.beginPath();
          ctx.arc(size * 0.38, -size * 0.18, size * 0.06, 0, Math.PI * 2);
          ctx.arc(size * 0.38, size * 0.04, size * 0.06, 0, Math.PI * 2);
          ctx.stroke();
          break;

        case 5: // Electric Kettle
          ctx.beginPath();
          // Kettle body (slightly tapered cylinder)
          ctx.moveTo(-size * 0.28, size * 0.4);
          ctx.lineTo(-size * 0.22, -size * 0.35);
          ctx.lineTo(size * 0.22, -size * 0.35);
          ctx.lineTo(size * 0.28, size * 0.4);
          ctx.closePath();
          ctx.stroke();
          // Lid knob
          ctx.beginPath();
          ctx.arc(0, -size * 0.4, size * 0.06, 0, Math.PI * 2);
          ctx.stroke();
          // Spout
          ctx.beginPath();
          ctx.moveTo(-size * 0.23, -size * 0.25);
          ctx.lineTo(-size * 0.4, -size * 0.15);
          ctx.lineTo(-size * 0.26, -size * 0.05);
          ctx.stroke();
          // Handle
          ctx.beginPath();
          ctx.moveTo(size * 0.24, -size * 0.22);
          ctx.bezierCurveTo(size * 0.44, -size * 0.18, size * 0.44, size * 0.26, size * 0.27, size * 0.3);
          ctx.stroke();
          break;
      }
      ctx.restore();
    };

    // Primary Loop
    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      const strokeStyle = isDark ? "rgba(147, 197, 253, 0.18)" : "rgba(215, 25, 32, 0.09)";
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.2;

      // Update and Draw floating smart appliances
      appliances.forEach((element) => {
        element.x += element.vx;
        element.y += element.vy;
        element.angle += element.rotationSpeed;

        // Boundaries wrap
        if (element.x < -element.size * 2) element.x = width + element.size * 2;
        if (element.x > width + element.size * 2) element.x = -element.size * 2;
        if (element.y < -element.size * 2) element.y = height + element.size * 2;
        if (element.y > height + element.size * 2) element.y = -element.size * 2;

        // Mouse attraction/repulsion physics
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - element.x;
          const dy = mouseRef.current.y - element.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 280) {
            // Gentle float away from the cursor
            const force = (280 - dist) * 0.00018 * speedMultiplier * element.depth;
            element.x -= dx * force;
            element.y -= dy * force;
          }
        }

        ctx.strokeStyle = isDark
          ? `rgba(147, 197, 253, ${element.opacity * 1.5})`
          : `rgba(215, 25, 32, ${element.opacity})`;
        ctx.lineWidth = 1.0 + (element.depth - 0.3) * 0.8;
        drawAppliance(ctx, element.type, element.x, element.y, element.size, element.angle);
      });

      // Update and Draw network connectivity nodes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Cursor attraction physics
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 220) {
            // Connective particles bend slightly towards mouse gravity
            const force = (220 - dist) * 0.00035 * speedMultiplier * p.depth;
            p.x += dx * force;
            p.y += dy * force;
          }
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw smart home network grid lines connecting nodes and floating appliances
      ctx.lineWidth = 0.55;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Draw connections between particle nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 95 + (p1.depth - 0.2) * 45; // deeper particles connect over shorter distances
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.09 * p1.depth;
            ctx.strokeStyle = isDark
              ? `rgba(147, 197, 253, ${alpha * 1.5})`
              : `rgba(215, 25, 32, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw connection lines from nodes to nearby drifting appliances
        appliances.forEach((element) => {
          const dx = p1.x - element.x;
          const dy = p1.y - element.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.075 * p1.depth;
            ctx.strokeStyle = isDark
              ? `rgba(147, 197, 253, ${alpha * 1.5})`
              : `rgba(215, 25, 32, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(element.x, element.y);
            ctx.stroke();
          }
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none transition-colors duration-500 bg-transparent"
    />
  );
}
