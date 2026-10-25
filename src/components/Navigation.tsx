"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import {
  EYE,
  START,
  ROOMS,
  findPath,
  walkable,
  roomAt,
  guidedPoint,
  guidedYaw,
  guidedRoomProgress,
  guidedProgressAt,
  type Mode,
  type Point,
  type Room,
} from "@/lib/space";
export type Position = {
  x: number;
  z: number;
  yaw: number;
  room: Room;
  progress: number;
  detour: boolean;
  returning: boolean;
};
export type NavigationAPI = {
  go: (room: Room) => void;
  reset: () => void;
  scrub: (progress: number) => void;
  hold: (key: string, down: boolean) => void;
};
type Props = {
  mode: Mode;
  api: React.RefObject<NavigationAPI | null>;
  report: (position: Position) => void;
  onReady: () => void;
  onInteract: () => void;
  reducedMotion: boolean;
  paused: boolean;
};
const shortest = (from: number, to: number) =>
  from + Math.atan2(Math.sin(to - from), Math.cos(to - from));
export default function Navigation({
  mode,
  api,
  report,
  onReady,
  onInteract,
  reducedMotion,
  paused,
}: Props) {
  const { camera, gl, scene } = useThree();
  const player = useRef({
    ...START,
    targetYaw: START.yaw,
    targetPitch: START.pitch,
    progress: 0,
    targetProgress: 0,
  });
  const guided = useRef({ detour: false, returning: false });
  const keys = useRef(new Set<string>());
  const tween = useRef<gsap.core.Timeline | null>(null);
  const marker = useRef<THREE.Mesh>(null),
    destination = useRef<Point | null>(null),
    elapsed = useRef(0);
  const modeRef = useRef(mode),
    pausedRef = useRef(paused);
  const controls = useRef<{ join: (target?: number) => void } | null>(null);
  const drag = useRef({
    down: false,
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
    touchAxis: "",
  });
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster()),
    intersection = useRef(new THREE.Vector3());

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute(
      "aria-label",
      "Interactive museum. Drag to look. Scroll to explore the hall and every gallery.",
    );
    const readyFrame = requestAnimationFrame(onReady);
    const stop = () => {
      tween.current?.kill();
      tween.current = null;
      destination.current = null;
    };
    function animateTo(
      end: Point,
      finalYaw: number | undefined,
      done?: () => void,
    ) {
      const p = player.current,
        route = findPath(p, end);
      if (!route.length) return false;
      stop();
      const tl = gsap.timeline({
        onComplete: () => {
          destination.current = null;
          if (finalYaw !== undefined) p.targetYaw = shortest(p.yaw, finalYaw);
          done?.();
        },
      });
      let from: Point = { x: p.x, z: p.z };
      for (const [i, next] of route.entries()) {
        const dx = next.x - from.x,
          dz = next.z - from.z,
          distance = Math.hypot(dx, dz);
        tl.to(p, {
          x: next.x,
          z: next.z,
          duration: reducedMotion ? 0 : Math.max(0.18, distance / 4.3),
          ease:
            route.length === 1
              ? "power2.inOut"
              : i === route.length - 1
                ? "power1.out"
                : "none",
          onStart: () => {
            if (distance > 0.05)
              p.targetYaw = shortest(p.yaw, Math.atan2(-dx, -dz));
            p.targetPitch = 0.015;
          },
        });
        from = next;
      }
      tween.current = tl;
      return true;
    }
    function join(target?: number) {
      const p = player.current,
        anchorProgress = guidedProgressAt(p, p.progress),
        anchor = guidedPoint(anchorProgress);
      p.progress = anchorProgress;
      p.targetProgress = target ?? anchorProgress;
      guided.current = { detour: true, returning: true };
      if (Math.hypot(p.x - anchor.x, p.z - anchor.z) < 0.03) {
        stop();
        p.x = anchor.x;
        p.z = anchor.z;
        guided.current = { detour: false, returning: false };
        p.targetYaw = shortest(p.yaw, guidedYaw(anchorProgress));
        return;
      }
      if (
        !animateTo(anchor, guidedYaw(anchorProgress), () => {
          guided.current = { detour: false, returning: false };
        })
      ) {
        guided.current.returning = false;
      }
    }
    controls.current = { join };
    const moveTo = (end: Point, yaw?: number, arrive?: () => void) => {
      if (!findPath(player.current, end).length) return;
      onInteract();
      guided.current = { detour: true, returning: false };
      animateTo(end, yaw, arrive);
      destination.current = end;
    };
    const scrollTo = (target: number) => {
      if (pausedRef.current) return;
      onInteract();
      if (guided.current.detour && !guided.current.returning) join();
      player.current.targetProgress = THREE.MathUtils.clamp(target, 0, 1);
    };
    const scrollBy = (amount: number) => {
      if (guided.current.detour && !guided.current.returning) join();
      scrollTo(player.current.targetProgress + amount);
    };
    api.current = {
      go: (id) => {
        const room = ROOMS[id];
        if (modeRef.current === "guided") {
          const progress = guidedRoomProgress(id);
          moveTo(guidedPoint(progress), room.yaw, () => {
            player.current.progress = progress;
            player.current.targetProgress = progress;
            guided.current = { detour: false, returning: false };
          });
        } else moveTo({ x: room.x, z: room.z }, room.yaw);
      },
      reset: () => {
        stop();
        keys.current.clear();
        guided.current = { detour: false, returning: false };
        Object.assign(player.current, {
          ...START,
          targetYaw: START.yaw,
          targetPitch: START.pitch,
          progress: 0,
          targetProgress: 0,
        });
      },
      scrub: scrollTo,
      hold: (key, down) => {
        if (down) {
          onInteract();
          stop();
          keys.current.add(key);
        } else keys.current.delete(key);
      },
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || pausedRef.current) return;
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(e.pointerId);
      drag.current = {
        down: true,
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
        touchAxis: "",
      };
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.down) return;
      const dx = e.clientX - d.lastX,
        dy = e.clientY - d.lastY;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) {
        d.moved = true;
        if (!d.touchAxis)
          d.touchAxis =
            Math.abs(e.clientY - d.y) > Math.abs(e.clientX - d.x)
              ? "vertical"
              : "horizontal";
      }
      if (d.moved) {
        onInteract();
        canvas.style.cursor = "grabbing";
        if (
          modeRef.current === "guided" &&
          e.pointerType === "touch" &&
          d.touchAxis === "vertical"
        )
          scrollBy(-dy * 0.00035);
        else {
          player.current.targetYaw -= dx * 0.003;
          player.current.targetPitch = THREE.MathUtils.clamp(
            player.current.targetPitch + dy * 0.002,
            -0.65,
            0.85,
          );
        }
      }
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.down) return;
      d.down = false;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      if (!d.moved && modeRef.current === "guided") {
        const bounds = canvas.getBoundingClientRect();
        raycaster.current.setFromCamera(
          new THREE.Vector2(
            ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
            (-(e.clientY - bounds.top) / bounds.height) * 2 + 1,
          ),
          camera,
        );
        if (
          raycaster.current.ray.intersectPlane(
            plane.current,
            intersection.current,
          )
        ) {
          const { x, z } = intersection.current,
            distance = raycaster.current.ray.origin.distanceTo(
              intersection.current,
            );
          const blocked = raycaster.current
            .intersectObjects(scene.children, true)
            .some(
              (hit) =>
                hit.object.userData.solid && hit.distance < distance - 0.05,
            );
          if (!blocked && walkable(x, z)) moveTo({ x, z });
        }
      }
    };
    const cancel = () => {
      drag.current.down = false;
      keys.current.clear();
      canvas.style.cursor = "grab";
    };
    const wheel = (e: WheelEvent) => {
      if (modeRef.current !== "guided" || pausedRef.current) return;
      e.preventDefault();
      const delta =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      scrollBy(delta * 0.000045);
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        pausedRef.current ||
        (e.target as HTMLElement).matches("input,textarea,select") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (
        modeRef.current === "guided" &&
        [
          "ArrowDown",
          "ArrowRight",
          "ArrowUp",
          "ArrowLeft",
          "PageDown",
          "PageUp",
          " ",
        ].includes(e.key)
      ) {
        if (e.key === " " && (e.target as HTMLElement).matches("button"))
          return;
        e.preventDefault();
        scrollBy(
          ["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key) ? -0.012 : 0.012,
        );
        return;
      }
      if (
        modeRef.current === "walk" &&
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "shift",
        ].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        onInteract();
        stop();
        keys.current.add(e.key.toLowerCase());
      }
    };
    const keyup = (e: KeyboardEvent) =>
      keys.current.delete(e.key.toLowerCase());
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("lostpointercapture", cancel);
    canvas.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", cancel);
    return () => {
      cancelAnimationFrame(readyFrame);
      stop();
      controls.current = null;
      api.current = null;
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
      canvas.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", cancel);
    };
  }, [api, camera, gl, scene, onReady, onInteract, reducedMotion]);
  useEffect(() => {
    modeRef.current = mode;
    tween.current?.kill();
    destination.current = null;
    keys.current.clear();
    if (mode === "guided") controls.current?.join();
    else guided.current = { detour: false, returning: false };
  }, [mode, reducedMotion]);
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      keys.current.clear();
      tween.current?.pause();
    } else tween.current?.resume();
  }, [paused]);
  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05),
      p = player.current;
    if (modeRef.current === "walk" && !pausedRef.current) {
      const k = keys.current,
        forward =
          Number(k.has("w") || k.has("arrowup")) -
          Number(k.has("s") || k.has("arrowdown")),
        side =
          Number(k.has("d") || k.has("arrowright")) -
          Number(k.has("a") || k.has("arrowleft"));
      const speed =
          ((k.has("shift") ? 5 : 2.8) * dt) / (Math.hypot(forward, side) || 1),
        dx = (-Math.sin(p.yaw) * forward + Math.cos(p.yaw) * side) * speed,
        dz = (-Math.cos(p.yaw) * forward - Math.sin(p.yaw) * side) * speed;
      if (walkable(p.x + dx, p.z)) p.x += dx;
      if (walkable(p.x, p.z + dz)) p.z += dz;
    }
    if (
      modeRef.current === "guided" &&
      !pausedRef.current &&
      !guided.current.detour
    ) {
      const previous = p.progress;
      p.progress = reducedMotion
        ? p.targetProgress
        : THREE.MathUtils.damp(p.progress, p.targetProgress, 4, dt);
      const point = guidedPoint(p.progress);
      p.x = point.x;
      p.z = point.z;
      if (Math.abs(previous - p.progress) > 0.000005) {
        p.targetYaw = shortest(p.yaw, guidedYaw(p.progress));
        p.targetPitch = START.pitch;
      }
    }
    p.yaw = reducedMotion
      ? p.targetYaw
      : THREE.MathUtils.damp(p.yaw, p.targetYaw, 7, dt);
    p.pitch = reducedMotion
      ? p.targetPitch
      : THREE.MathUtils.damp(p.pitch, p.targetPitch, 8, dt);
    camera.position.set(p.x, EYE, p.z);
    camera.rotation.order = "YXZ";
    camera.rotation.set(-p.pitch, p.yaw, 0);
    if (marker.current) {
      marker.current.visible = Boolean(destination.current);
      if (destination.current) {
        marker.current.position.set(
          destination.current.x,
          0.018,
          destination.current.z,
        );
        marker.current.scale.setScalar(
          0.9 + Math.sin(state.clock.elapsedTime * 3) * 0.08,
        );
      }
    }
    elapsed.current += dt;
    if (elapsed.current > 0.1) {
      elapsed.current = 0;
      report({
        x: p.x,
        z: p.z,
        yaw: p.yaw,
        room: roomAt(p.x, p.z),
        progress:
          modeRef.current === "guided"
            ? p.progress
            : guidedProgressAt(p, p.progress),
        detour: guided.current.detour,
        returning: guided.current.returning,
      });
    }
  });
  return (
    <mesh ref={marker} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.19, 0.23, 48]} />
      <meshBasicMaterial
        color="#2458e8"
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  );
}
