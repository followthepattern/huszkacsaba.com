import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshoptSimplifier } from "meshoptimizer";

const sourcePath = "assets/source/superhot_enemy_stl.fbx";
const outputPath = "public/models/gallery-visitor.glb";
const targetHeight = 2.3;
const targetTriangles = 6000;
const errorLimit = 0.00075;

// The Three.js exporter uses the browser FileReader interface for GLB buffers.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
};

const bytes = await fs.readFile(sourcePath);
const source = new FBXLoader().parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  "",
);
source.updateMatrixWorld(true);
let raw;
source.traverse((object) => {
  if (!object.isMesh) return;
  if (raw) throw new Error("Source changed: expected a single static mesh.");
  raw = object.geometry.clone().applyMatrix4(object.matrixWorld);
});
if (!raw) throw new Error("Source contains no mesh.");
const originalTriangles =
  (raw.index?.count ?? raw.attributes.position.count) / 3;
raw.deleteAttribute("normal");
const welded = mergeVertices(raw, 0.0001);
const positions = welded.attributes.position;
const indices = welded.index.array;

// Locate disconnected components to remove only the six remote debris faces.
// Keep all meaningful components, including the source's separate small parts.
const parents = Array.from({ length: positions.count }, (_, index) => index);
function root(index) {
  while (parents[index] !== index) {
    parents[index] = parents[parents[index]];
    index = parents[index];
  }
  return index;
}
function join(a, b) {
  a = root(a);
  b = root(b);
  if (a !== b) parents[a] = b;
}
for (let i = 0; i < indices.length; i += 3) {
  join(indices[i], indices[i + 1]);
  join(indices[i], indices[i + 2]);
}
const counts = new Map();
for (let i = 0; i < indices.length; i += 3) {
  const key = root(indices[i]);
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
const cleanIndices = [];
for (let i = 0; i < indices.length; i += 3)
  if (counts.get(root(indices[i])) >= 10)
    cleanIndices.push(indices[i], indices[i + 1], indices[i + 2]);

const clean = new BufferGeometry();
clean.setAttribute("position", positions.clone());
clean.setIndex(cleanIndices);
clean.rotateZ(Math.PI / 2);
// Rebuild bounds from referenced vertices, excluding the discarded debris.
const bounds = new Box3();
for (const index of cleanIndices)
  bounds.expandByPoint(
    new Vector3().fromBufferAttribute(clean.attributes.position, index),
  );
const center = bounds.getCenter(new Vector3());
const size = bounds.getSize(new Vector3());
clean.translate(-center.x, -bounds.min.y, -center.z);
clean.scale(
  targetHeight / size.y,
  targetHeight / size.y,
  targetHeight / size.y,
);

// The print mesh's whole body leans forward. Align its head-to-ankle axis
// vertically, blending the correction above the soles so the feet stay planted.
const activeVertices = [...new Set(cleanIndices)];
const cleanPositions = clean.attributes.position;
function centerOfBand(low, high) {
  const box = new Box3();
  for (const index of activeVertices) {
    const point = new Vector3().fromBufferAttribute(cleanPositions, index);
    if (point.y >= low && point.y <= high) box.expandByPoint(point);
  }
  if (box.isEmpty()) throw new Error("Standing-pose landmark band is empty.");
  return box.getCenter(new Vector3());
}
const ankleAnchor = centerOfBand(0.12, 0.22);
const headAnchor = centerOfBand(2.15, 2.27);
const correction = new Quaternion().setFromUnitVectors(
  headAnchor.clone().sub(ankleAnchor).normalize(),
  new Vector3(0, 1, 0),
);
const poseCorrectionDegrees =
  (correction.angleTo(new Quaternion()) * 180) / Math.PI;
for (const index of activeVertices) {
  const point = new Vector3().fromBufferAttribute(cleanPositions, index);
  const straight = point
    .clone()
    .sub(ankleAnchor)
    .applyQuaternion(correction)
    .add(ankleAnchor);
  const t = Math.max(0, Math.min(1, (point.y - 0.08) / 0.27));
  point.lerp(straight, t * t * (3 - 2 * t));
  cleanPositions.setXYZ(index, point.x, point.y, point.z);
}
const standingBounds = new Box3();
for (const index of activeVertices)
  standingBounds.expandByPoint(
    new Vector3().fromBufferAttribute(cleanPositions, index),
  );
const standingCenter = standingBounds.getCenter(new Vector3());
clean.translate(-standingCenter.x, -standingBounds.min.y, -standingCenter.z);
const standingScale = targetHeight / standingBounds.getSize(new Vector3()).y;
clean.scale(standingScale, standingScale, standingScale);

await MeshoptSimplifier.ready;
const sourcePositions = clean.attributes.position.array;
const [simplified, error] = MeshoptSimplifier.simplify(
  new Uint32Array(cleanIndices),
  sourcePositions,
  3,
  Math.min(cleanIndices.length, targetTriangles * 3),
  errorLimit,
  ["LockBorder"],
);
const [remap, vertexCount] = MeshoptSimplifier.compactMesh(simplified);
const compact = new Float32Array(vertexCount * 3);
for (let old = 0; old < remap.length; old++)
  if (remap[old] !== 0xffffffff)
    compact.set(sourcePositions.subarray(old * 3, old * 3 + 3), remap[old] * 3);
const geometry = new BufferGeometry();
geometry.setAttribute("position", new Float32BufferAttribute(compact, 3));
geometry.setIndex(Array.from(simplified));
geometry.computeVertexNormals();
geometry.computeBoundingBox();
const model = new Mesh(
  geometry,
  new MeshStandardMaterial({
    color: "#cf1427",
    roughness: 0.48,
    metalness: 0.04,
  }),
);
model.name = "GalleryVisitor";
const group = new Group();
group.add(model);
const glb = await new GLTFExporter().parseAsync(group, { binary: true });
await fs.mkdir("public/models", { recursive: true });
await fs.writeFile(outputPath, Buffer.from(glb));
const report = {
  source: sourcePath,
  sourceSha256: createHash("sha256").update(bytes).digest("hex"),
  originalTriangles,
  discardedDebrisTriangles: originalTriangles - cleanIndices.length / 3,
  optimizedTriangles: simplified.length / 3,
  vertices: vertexCount,
  relativeError: error,
  poseCorrectionDegrees,
  errorLimit,
  dimensions: geometry.boundingBox.getSize(new Vector3()).toArray(),
  output: outputPath,
  outputBytes: glb.byteLength,
};
await fs.writeFile(
  "public/models/gallery-visitor.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
