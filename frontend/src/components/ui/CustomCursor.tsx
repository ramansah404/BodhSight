import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function CustomCursor() {
  const location = useLocation();
  const cursorRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: -40, y: -40 });
  const position = useRef({ x: -40, y: -40 });

  const isPublicPage = location.pathname === "/" || location.pathname === "/login";

  useEffect(() => {
    if (!isPublicPage || window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };
    const onOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      cursorRef.current?.classList.toggle("is-hovering", Boolean(target.closest("a, button, input, textarea, select, [data-cursor-hover]")));
    };
    const onDown = () => cursorRef.current?.classList.add("is-pressed");
    const onUp = () => cursorRef.current?.classList.remove("is-pressed");

    const render = () => {
      position.current.x += (pointer.current.x - position.current.x) * 0.28;
      position.current.y += (pointer.current.y - position.current.y) * 0.28;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
      }
      frame = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(frame);
    };
  }, [isPublicPage]);

  if (!isPublicPage) return null;

  return <div ref={cursorRef} className="bodh-cursor" aria-hidden="true" />;
}
