import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VISITORS, VISITOR_SOLIDS } from "../src/lib/space.ts";

const bytes = readFileSync(
  new URL("../public/models/gallery-visitor.glb", import.meta.url),
);
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(4), 2);
assert.equal(bytes.readUInt32LE(8), bytes.length);
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
const binaryStart = 20 + jsonLength + 8;
const primitive = gltf.meshes[0].primitives[0];
const accessor = gltf.accessors[primitive.attributes.POSITION];
const view = gltf.bufferViews[accessor.bufferView];
assert.equal(accessor.componentType, 5126);
const positions = Array.from({ length: accessor.count }, (_, index) => {
  const offset =
    binaryStart +
    (view.byteOffset ?? 0) +
    (accessor.byteOffset ?? 0) +
    index * (view.byteStride ?? 12);
  return [
    bytes.readFloatLE(offset),
    bytes.readFloatLE(offset + 4),
    bytes.readFloatLE(offset + 8),
  ];
});

test("the imported visitor is upright, grounded, and has full 3D depth", () => {
  assert.ok(positions.flat().every(Number.isFinite));
  const minimum = [0, 1, 2].map((axis) =>
    Math.min(...positions.map((point) => point[axis])),
  );
  const maximum = [0, 1, 2].map((axis) =>
    Math.max(...positions.map((point) => point[axis])),
  );
  assert.ok(Math.abs(minimum[1]) < 0.001, "feet must touch the floor");
  assert.ok(Math.abs(maximum[1] - minimum[1] - 2.3) < 0.001);
  assert.ok(
    maximum[0] - minimum[0] > 0.5,
    "shoulders and arms need real width",
  );
  assert.ok(
    maximum[2] - minimum[2] > 0.3,
    "the model must retain its side profile",
  );
});

test("the runtime visitor stays compact and self-contained", () => {
  assert.ok(bytes.length < 300_000);
  assert.equal(gltf.meshes.length, 1);
  assert.ok(gltf.accessors[primitive.indices].count / 3 < 15_000);
  assert.ok(gltf.buffers.every((buffer) => !buffer.uri));
  assert.equal(gltf.images?.length ?? 0, 0);
});

test("the standing visitor's head is aligned above its ankles", () => {
  const centerOfBand = (low, high) => {
    const band = positions.filter(([, y]) => y >= low && y <= high);
    assert.ok(band.length);
    return [0, 2].map(
      (axis) =>
        (Math.min(...band.map((point) => point[axis])) +
          Math.max(...band.map((point) => point[axis]))) /
        2,
    );
  };
  const ankles = centerOfBand(0.12, 0.22);
  const head = centerOfBand(2.15, 2.27);
  assert.ok(
    Math.hypot(head[0] - ankles[0], head[1] - ankles[1]) < 0.06,
    "the figure must stand vertically rather than leaning forward or sideways",
  );
});

test("every rotated visitor fits inside its walking collision bounds", () => {
  for (const [index, visitor] of VISITORS.entries()) {
    const solid = VISITOR_SOLIDS[index];
    for (const [x, y, z] of positions) {
      const worldX =
        visitor.x +
        (x * Math.cos(visitor.yaw) + z * Math.sin(visitor.yaw)) * visitor.scale;
      const worldZ =
        visitor.z +
        (-x * Math.sin(visitor.yaw) + z * Math.cos(visitor.yaw)) *
          visitor.scale;
      assert.ok(Math.abs(worldX - solid.x) <= solid.w / 2 + 0.001);
      assert.ok(Math.abs(worldZ - solid.z) <= solid.d / 2 + 0.001);
      assert.ok(y * visitor.scale <= solid.h + 0.001);
    }
  }
});
