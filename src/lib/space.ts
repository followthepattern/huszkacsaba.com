import { CatmullRomCurve3, Vector3 } from "three";

export type Point = { x: number; z: number };
export type Mode = "guided" | "walk";
export type Room = "hall" | "gallery1" | "gallery2" | "gallery3" | "gallery4";
export const DRAWING_ROOM: Room = "gallery1";
export const CV_ROOM: Room = "gallery4";
export type Solid = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  y?: number;
  color?: string;
};
export type RoomDefinition = Point & {
  name: string;
  subtitle: string;
  yaw: number;
  doorX: number;
  side: number;
  index: string;
};
export const EYE = 1.68;
export const HALL = { left: -30, right: 30, halfWidth: 4 };
export const RAIL = { start: -26, end: 26, yaw: -Math.PI / 2 };
export const START = { x: RAIL.start, z: 0, yaw: RAIL.yaw, pitch: -0.015 };
export const ROOMS: Record<Room, RoomDefinition> = {
  hall: {
    name: "The hall",
    subtitle: "A little further. A new perspective.",
    x: START.x,
    z: 0,
    yaw: RAIL.yaw,
    doorX: START.x,
    side: 0,
    index: "00",
  },
  gallery1: {
    name: "Drawing",
    subtitle: "What I draw · Why I draw",
    x: -14,
    z: -11,
    yaw: 0,
    doorX: -14,
    side: -1,
    index: "01",
  },
  gallery2: {
    name: "Gallery 02",
    subtitle: "Second doorway · south side",
    x: -14,
    z: 11,
    yaw: Math.PI,
    doorX: -14,
    side: 1,
    index: "02",
  },
  gallery3: {
    name: "Gallery 03",
    subtitle: "Third doorway · north side",
    x: 10,
    z: -11,
    yaw: 0,
    doorX: 10,
    side: -1,
    index: "03",
  },
  gallery4: {
    name: "CV / About",
    subtitle: "Csaba Huszka · Experience & leadership",
    x: 10,
    z: 11,
    yaw: Math.PI,
    doorX: 10,
    side: 1,
    index: "04",
  },
};
export const GALLERIES = (Object.keys(ROOMS) as Room[]).filter(
  (id) => id !== "hall",
);
const wallSpans = [
  [-30, -15.8],
  [-12.2, 8.2],
  [11.8, 30],
];
export const WALLS: Solid[] = [
  ...[-1, 1].flatMap((side) => [
    ...wallSpans.map(([a, b]) => ({
      x: (a + b) / 2,
      z: side * 4,
      w: b - a,
      d: 0.45,
      h: 7,
    })),
    ...[-14, 10].map((x) => ({
      x,
      z: side * 4,
      w: 3.6,
      d: 0.45,
      h: 2.8,
      y: 5.6,
    })),
  ]),
  { x: -30, z: 0, w: 0.45, d: 8.45, h: 7 },
  // A full-height window closes the far end of the corridor.
  ...[-1, 1].map((s) => ({ x: 30, z: s * 3.25, w: 0.45, d: 1.5, h: 7 })),
  { x: 30, z: 0, w: 0.45, d: 5, h: 1.1, y: 6.45 },
  { x: 30, z: 0, w: 0.45, d: 5, h: 0.5 },
  ...GALLERIES.flatMap((id) => {
    const r = ROOMS[id];
    return [
      { x: r.x, z: r.side * 18, w: 16.45, d: 0.45, h: 7 },
      ...[-1, 1].map((s) => ({
        x: r.x + s * 8,
        z: r.side * 11,
        w: 0.45,
        d: 14,
        h: 7,
      })),
    ];
  }),
];
export const BENCHES: Solid[] = [
  { x: -3, z: 2.8, w: 3.6, d: 0.85, h: 0.46, color: "#aab8cc" },
  { x: 23, z: -2.8, w: 3.6, d: 0.85, h: 0.46, color: "#aab8cc" },
  ...GALLERIES.map((id) => {
    const r = ROOMS[id];
    return {
      x: r.x + 4,
      z: r.side * 15.3,
      w: 3.6,
      d: 0.9,
      h: 0.46,
      color: "#aab8cc",
    };
  }),
];
export const COLUMNS: Solid[] = [];
export const VISITORS = [
  { id: "architecture-left", x: -14.9, z: -15.5, yaw: -0.12, scale: 1.04 },
  { id: "architecture-right", x: -13, z: -15.2, yaw: 2.7, scale: 0.96 },
  { id: "portrait", x: -19, z: -10.8, yaw: Math.PI / 2, scale: 1 },
] as const;
// Rounded-up GLB bounds; see public/models/gallery-visitor.json.
export const VISITOR_DIMENSIONS = { width: 0.694, height: 2.3, depth: 0.439 };
export const VISITOR_SOLIDS: Solid[] = VISITORS.map((visitor) => ({
  x: visitor.x,
  z: visitor.z,
  w:
    (Math.abs(Math.cos(visitor.yaw)) * VISITOR_DIMENSIONS.width +
      Math.abs(Math.sin(visitor.yaw)) * VISITOR_DIMENSIONS.depth +
      0.04) *
    visitor.scale,
  d:
    (Math.abs(Math.sin(visitor.yaw)) * VISITOR_DIMENSIONS.width +
      Math.abs(Math.cos(visitor.yaw)) * VISITOR_DIMENSIONS.depth +
      0.04) *
    visitor.scale,
  h: VISITOR_DIMENSIONS.height * visitor.scale,
}));
const OBSTACLES = [...WALLS.filter((w) => !w.y), ...BENCHES, ...VISITOR_SOLIDS];
export function walkable(x: number, z: number, radius = 0.34) {
  const inside =
    (x > HALL.left + radius && x < HALL.right - radius && Math.abs(z) < 4) ||
    GALLERIES.some((id) => {
      const r = ROOMS[id];
      return Math.abs(x - r.x) < 8 && z * r.side >= 4 && z * r.side < 18;
    });
  return (
    inside &&
    !OBSTACLES.some(
      (b) =>
        Math.abs(x - b.x) < b.w / 2 + radius &&
        Math.abs(z - b.z) < b.d / 2 + radius,
    )
  );
}
export function roomAt(x: number, z: number): Room {
  return (
    GALLERIES.find((id) => {
      const r = ROOMS[id];
      return z * r.side > 4 && Math.abs(x - r.x) < 8;
    }) ?? "hall"
  );
}
export function railPoint(progress: number): Point {
  return {
    x:
      RAIL.start + Math.max(0, Math.min(1, progress)) * (RAIL.end - RAIL.start),
    z: 0,
  };
}
export function progressAt(x: number) {
  return Math.max(0, Math.min(1, (x - RAIL.start) / (RAIL.end - RAIL.start)));
}
export function corridorAnchor(point: Point): Point {
  const room = roomAt(point.x, point.z);
  return {
    x: room === "hall" ? railPoint(progressAt(point.x)).x : ROOMS[room].doorX,
    z: 0,
  };
}

// A single exhibition route connects scrolling and room-menu destinations.
// Paired entry/exit lanes keep the camera moving around each room instead of
// arriving at a dead end and making an abrupt 180-degree turn.
const tourNodes: Point[] = [
  { x: START.x, z: 0 },
  { x: -20, z: 0 },
];
const roomNodeIndices = new Map<Room, number>([["hall", 0]]);
for (const id of GALLERIES) {
  const room = ROOMS[id],
    entry = room.side < 0 ? -1 : 1;
  if (id === "gallery3") tourNodes.push({ x: -6, z: 0 }, { x: 3, z: 0 });
  const add = (x: number, z: number) => {
    const point = { x: room.doorX + x, z: z * room.side };
    const previous = tourNodes[tourNodes.length - 1];
    if (Math.hypot(previous.x - point.x, previous.z - point.z) > 0.001)
      tourNodes.push(point);
  };
  add(entry * 0.7, 0);
  for (const z of [1.5, 3, 5.5]) add(entry * 0.7, z);
  add(entry * 2, 8);
  add(entry * 2, 10);
  add(0, 11);
  roomNodeIndices.set(id, tourNodes.length - 1);
  add(-entry * 2, 10);
  add(-entry * 2, 8);
  for (const z of [5.5, 3, 1.5, 0]) add(-entry * 0.7, z);
}
tourNodes.push({ x: 18, z: 0 }, { x: RAIL.end, z: 0 });
const tourCurve = new CatmullRomCurve3(
  tourNodes.map((p) => new Vector3(p.x, 0, p.z)),
  false,
  "centripetal",
);
tourCurve.arcLengthDivisions = 3000;
const tourLengths = tourCurve.getLengths();
export function guidedPoint(progress: number): Point {
  const point = tourCurve.getPointAt(Math.max(0, Math.min(1, progress)));
  return { x: point.x, z: point.z };
}
export function guidedYaw(progress: number) {
  const tangent = tourCurve.getTangentAt(Math.max(0, Math.min(1, progress)));
  return Math.atan2(-tangent.x, -tangent.z);
}
export function guidedRoomProgress(id: Room) {
  const t = (roomNodeIndices.get(id) ?? 0) / (tourNodes.length - 1);
  const index = t * (tourLengths.length - 1),
    low = Math.floor(index),
    high = Math.ceil(index);
  const distance =
    tourLengths[low] + (tourLengths[high] - tourLengths[low]) * (index - low);
  return distance / tourLengths[tourLengths.length - 1];
}
const tourSamples = Array.from({ length: 1201 }, (_, i) =>
  guidedPoint(i / 1200),
);
export function guidedProgressAt(point: Point, hint = 0) {
  let best = 0,
    bestDistance = Infinity;
  for (let i = 0; i < tourSamples.length - 1; i++) {
    const a = tourSamples[i],
      b = tourSamples[i + 1],
      dx = b.x - a.x,
      dz = b.z - a.z;
    const u = Math.max(
      0,
      Math.min(
        1,
        ((point.x - a.x) * dx + (point.z - a.z) * dz) /
          (dx * dx + dz * dz || 1),
      ),
    );
    const distance =
      (point.x - a.x - u * dx) ** 2 + (point.z - a.z - u * dz) ** 2;
    const progress = (i + u) / (tourSamples.length - 1);
    if (
      distance < bestDistance - 0.0025 ||
      (Math.abs(distance - bestDistance) <= 0.0025 &&
        Math.abs(progress - hint) < Math.abs(best - hint))
    ) {
      bestDistance = distance;
      best = progress;
    }
  }
  return best;
}
export function clearLine(a: Point, b: Point) {
  const steps = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 0.18));
  for (let i = 0; i <= steps; i++)
    if (
      !walkable(
        a.x + ((b.x - a.x) * i) / steps,
        a.z + ((b.z - a.z) * i) / steps,
      )
    )
      return false;
  return true;
}
// Visibility graph: the same doorways serve menu glides, floor clicks, and return-to-hall moves.
export function findPath(start: Point, end: Point): Point[] {
  if (!walkable(end.x, end.z)) return [];
  if (clearLine(start, end)) return [end];
  const nodes: Point[] = [
    start,
    end,
    ...GALLERIES.flatMap((id) => {
      const r = ROOMS[id];
      return [0, 3, 5, 8].map((z) => ({ x: r.doorX, z: z * r.side }));
    }),
    ...[...BENCHES, ...VISITOR_SOLIDS].flatMap((b) =>
      [-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => ({
          x: b.x + sx * (b.w / 2 + 0.7),
          z: b.z + sz * (b.d / 2 + 0.7),
        })),
      ),
    ),
  ];
  const dist = nodes.map(() => Infinity),
    prev = nodes.map(() => -1),
    visited = new Set<number>();
  dist[0] = 0;
  for (let k = 0; k < nodes.length; k++) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!visited.has(i) && (u === -1 || dist[i] < dist[u])) u = i;
    if (u === -1 || !Number.isFinite(dist[u])) break;
    if (u === 1) {
      const path: Point[] = [];
      for (let v = 1; v > 0; v = prev[v]) path.unshift(nodes[v]);
      return path;
    }
    visited.add(u);
    for (let v = 0; v < nodes.length; v++)
      if (!visited.has(v) && clearLine(nodes[u], nodes[v])) {
        const next =
          dist[u] +
          Math.hypot(nodes[u].x - nodes[v].x, nodes[u].z - nodes[v].z);
        if (next < dist[v]) {
          dist[v] = next;
          prev[v] = u;
        }
      }
  }
  return [];
}
