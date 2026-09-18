import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const MIN_SCALE = 0.3;
const MAX_SCALE = 2;
const EDGE = 28;
const DRAG_SLOP = 4;

interface View {
  x: number;
  y: number;
  scale: number;
}

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export function usePanZoom(contentWidth: number, contentHeight: number, topBand: number) {
  const viewport = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);
  const touched = useRef(false);
  const captured = useRef(false);
  const origin = useRef({ pointerX: 0, pointerY: 0, viewX: 0, viewY: 0 });

  const fit = useCallback(() => {
    const node = viewport.current;

    if (!node || contentWidth === 0 || contentHeight === 0) {
      return;
    }

    const boxed = contentHeight + topBand;
    const scale = clampScale(
      Math.min(
        1,
        (node.clientWidth - EDGE * 2) / contentWidth,
        (node.clientHeight - EDGE * 2) / boxed
      )
    );

    touched.current = false;
    setView({
      x: (node.clientWidth - contentWidth * scale) / 2,
      y: (node.clientHeight - boxed * scale) / 2 + topBand * scale,
      scale,
    });
  }, [contentWidth, contentHeight, topBand]);

  useEffect(() => {
    fit();
  }, [fit]);

  useEffect(() => {
    const node = viewport.current;

    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!touched.current) {
        fit();
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fit]);

  const zoomAt = useCallback((factor: number, pointX: number, pointY: number) => {
    touched.current = true;
    setView((current) => {
      const scale = clampScale(current.scale * factor);
      const ratio = scale / current.scale;

      return {
        scale,
        x: pointX - ratio * (pointX - current.x),
        y: pointY - ratio * (pointY - current.y),
      };
    });
  }, []);

  useEffect(() => {
    const node = viewport.current;

    if (!node) {
      return;
    }

    const onWheel = (wheelEvent: WheelEvent) => {
      wheelEvent.preventDefault();
      const box = node.getBoundingClientRect();

      zoomAt(
        wheelEvent.deltaY < 0 ? 1.12 : 1 / 1.12,
        wheelEvent.clientX - box.left,
        wheelEvent.clientY - box.top
      );
    };

    node.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      node.removeEventListener('wheel', onWheel);
    };
  }, [zoomAt]);

  const onPointerDown = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerEvent.button !== 0) {
      return;
    }

    moved.current = false;
    captured.current = false;
    origin.current = {
      pointerX: pointerEvent.clientX,
      pointerY: pointerEvent.clientY,
      viewX: view.x,
      viewY: view.y,
    };
    setDragging(true);
  };

  const onPointerMove = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) {
      return;
    }

    const deltaX = pointerEvent.clientX - origin.current.pointerX;
    const deltaY = pointerEvent.clientY - origin.current.pointerY;

    if (Math.abs(deltaX) > DRAG_SLOP || Math.abs(deltaY) > DRAG_SLOP) {
      moved.current = true;
      touched.current = true;

      if (!captured.current) {
        captured.current = true;
        pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
      }
    }

    if (!moved.current) {
      return;
    }

    setView((current) => ({
      scale: current.scale,
      x: origin.current.viewX + deltaX,
      y: origin.current.viewY + deltaY,
    }));
  };

  const onPointerUp = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }

    setDragging(false);
  };

  const centreZoom = (factor: number) => {
    const node = viewport.current;

    if (node) {
      zoomAt(factor, node.clientWidth / 2, node.clientHeight / 2);
    }
  };

  return {
    viewport,
    view,
    dragging,
    fit,
    zoomIn: () => {
      centreZoom(1.25);
    },
    zoomOut: () => {
      centreZoom(1 / 1.25);
    },
    wasDragged: () => moved.current,
    surface: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
