import React, { useEffect, useRef, useState } from "react";

const cursorAssets = {
  normal: "/assets/cursors/brush-normal.png",
  hover: "/assets/cursors/brush-hover.png",
  pressed: "/assets/cursors/brush-pressed.png",
  loading: Array.from({ length: 8 }, (_, i) => `/assets/cursors/brush-loading-${i}.png`),
};

const interactiveSelector = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "[role='button']",
  ".cursor-pointer",
].join(",");

const FancyCursor = () => {
  const cursorRef = useRef(null);
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const frameRef = useRef(0);
  const [cursorState, setCursorState] = useState("normal");
  const [loadingFrame, setLoadingFrame] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let rafId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const moveCursor = (clientX, clientY) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${clientX - 4}px, ${clientY - 59}px, 0)`;
      }
    };

    const handleMouseMove = (e) => {
      const { clientX, clientY, target } = e;
      moveCursor(clientX, clientY);

      pointsRef.current.push({ x: clientX, y: clientY, age: 1 });
      if (pointsRef.current.length > 18) pointsRef.current.shift();

      if (target?.closest?.(interactiveSelector)) {
        setCursorState((current) => (current === "pressed" || current === "loading" ? current : "hover"));
      } else {
        setCursorState((current) => (current === "pressed" || current === "loading" ? current : "normal"));
      }
    };

    const handleMouseDown = () => setCursorState("pressed");
    const handleMouseUp = (e) => {
      const next = e.target?.closest?.(interactiveSelector) ? "hover" : "normal";
      setCursorState("loading");
      window.setTimeout(() => setCursorState(next), 420);
    };
    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
    };
    const handleMouseEnter = (e) => {
      if (cursorRef.current) cursorRef.current.style.opacity = "1";
      moveCursor(e.clientX, e.clientY);
    };

    const drawTrail = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const points = pointsRef.current;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.age *= 0.92;
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      pointsRef.current = points.filter((p) => p.age > 0.15);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(124, 58, 237, 0.65)");
      gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.45)");
      gradient.addColorStop(1, "rgba(249, 115, 22, 0.25)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      rafId = requestAnimationFrame(drawTrail);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("resize", resizeCanvas);
    drawTrail();

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (cursorState !== "loading") return undefined;
    const id = window.setInterval(() => {
      frameRef.current = (frameRef.current + 1) % cursorAssets.loading.length;
      setLoadingFrame(frameRef.current);
    }, 70);
    return () => window.clearInterval(id);
  }, [cursorState]);

  const src = cursorState === "loading" ? cursorAssets.loading[loadingFrame] : cursorAssets[cursorState];

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />

      <img
        ref={cursorRef}
        src={src}
        alt="cursor"
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: cursorState === "hover" ? "48px" : "44px",
          height: cursorState === "hover" ? "48px" : "44px",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 1,
          transition: "width 120ms ease, height 120ms ease, opacity 160ms ease",
          filter: "drop-shadow(0 0 8px rgba(124,58,237,0.45)) drop-shadow(2px 4px 7px rgba(0,0,0,0.55))",
          transformOrigin: "4px 59px",
          willChange: "transform",
        }}
      />
    </>
  );
};

export default FancyCursor;
