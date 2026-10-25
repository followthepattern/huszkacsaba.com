import test from "node:test";
import assert from "node:assert/strict";
import {
  START,
  RAIL,
  ROOMS,
  GALLERIES,
  BENCHES,
  VISITOR_SOLIDS,
  railPoint,
  progressAt,
  corridorAnchor,
  findPath,
  clearLine,
  walkable,
  roomAt,
} from "../src/lib/space.ts";

test("the main corridor axis progresses left to right without walls", () => {
  let previous = START;
  for (let i = 0; i <= 100; i++) {
    const p = railPoint(i / 100);
    assert.ok(p.x >= previous.x);
    assert.equal(p.z, 0);
    assert.ok(clearLine(previous, p));
    previous = p;
  }
  assert.equal(previous.x, RAIL.end);
  assert.equal(START.yaw, -Math.PI / 2);
});
test("all room menu destinations are reachable through clear doorways", () => {
  for (const [fromId, from] of Object.entries(ROOMS))
    for (const [toId, to] of Object.entries(ROOMS)) {
      const path = findPath(from, to);
      assert.ok(path.length, `${fromId} -> ${toId}`);
      let previous = from;
      for (const p of path) {
        assert.ok(
          clearLine(previous, p),
          `${fromId} -> ${toId} crosses a solid`,
        );
        previous = p;
      }
      assert.deepEqual({ x: previous.x, z: previous.z }, { x: to.x, z: to.z });
    }
});
test("off-route walking can reach the hall through each gallery doorway", () => {
  for (const id of GALLERIES) {
    const room = ROOMS[id],
      anchor = corridorAnchor(room);
    assert.deepEqual(anchor, { x: room.doorX, z: 0 });
    assert.ok(findPath(room, anchor).length);
    assert.equal(railPoint(progressAt(anchor.x)).x, anchor.x);
    assert.equal(roomAt(room.x, room.z), id);
  }
});
test("walking respects corridor walls, gallery walls, and benches", () => {
  for (const p of [
    { x: -25, z: 5 },
    { x: 0, z: -5 },
    { x: 31, z: 0 },
    { x: -14, z: -19 },
    ...BENCHES,
  ])
    assert.equal(walkable(p.x, p.z), false);
  for (const p of [
    { x: -14, z: -4 },
    { x: -14, z: 4 },
    { x: 10, z: -4 },
    { x: 10, z: 4 },
  ])
    assert.equal(walkable(p.x, p.z), true);
});

test("visitors block walking while floor navigation can route around them", () => {
  for (const visitor of VISITOR_SOLIDS) {
    assert.equal(walkable(visitor.x, visitor.z), false);
    const start = { x: visitor.x, z: visitor.z - 1.4 };
    const end = { x: visitor.x, z: visitor.z + 1.4 };
    assert.equal(clearLine(start, end), false);
    const path = findPath(start, end);
    assert.ok(path.length > 1, "a route must go around the visitor");
    let previous = start;
    for (const point of path) {
      assert.ok(clearLine(previous, point));
      previous = point;
    }
    assert.deepEqual(previous, end);
  }
});

// This catches the original hall-only route: scrolling must physically enter rooms.
test("a complete guided scroll visits every gallery in order without crossing walls", async () => {
  const space = await import("../src/lib/space.ts");
  const pointAt = space.guidedPoint;
  let previous = pointAt(0),
    rooms = [];
  for (let i = 1; i <= 2400; i++) {
    const point = pointAt(i / 2400);
    assert.ok(
      clearLine(previous, point),
      `guided route crosses a solid at ${i}/2400`,
    );
    const room = roomAt(point.x, point.z);
    if (room !== "hall" && rooms.at(-1) !== room) rooms.push(room);
    previous = point;
  }
  assert.deepEqual(
    rooms,
    ["gallery1", "gallery2", "gallery3", "gallery4"],
    "scrolling must enter all four rooms, in exhibition order",
  );
  assert.deepEqual(pointAt(0), { x: START.x, z: START.z });
  assert.deepEqual(pointAt(1), { x: RAIL.end, z: 0 });
});
test("each room menu lands on its own place in the scrolling route", async () => {
  const space = await import("../src/lib/space.ts");
  assert.equal(typeof space.guidedRoomProgress, "function");
  let previous = 0;
  for (const id of GALLERIES) {
    const progress = space.guidedRoomProgress(id),
      point = space.guidedPoint(progress);
    assert.ok(progress > previous && progress < 1);
    assert.equal(roomAt(point.x, point.z), id);
    assert.ok(Math.hypot(point.x - ROOMS[id].x, point.z - ROOMS[id].z) < 0.2);
    previous = progress;
  }
});
