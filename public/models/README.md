# Gallery visitor

`gallery-visitor.glb` comes from the user-supplied `superhot-enemy-stl.zip`. Despite the archive's name, it contains a single static FBX, `source/superhot_enemy_stl.fbx`, without a rig, animations, textures, or license metadata. The original FBX is preserved in `assets/source/`.

Run `node scripts/prepare-visitor-model.mjs` to regenerate the runtime asset and `gallery-visitor.json` report.

Processing: bake transforms, weld duplicate positions, remove six disconnected remote debris triangles, rotate 90 degrees around Z to stand upright, center horizontally, place the feet on the floor, and uniformly normalize to 2.3 m tall. Correct the source's 10.84-degree forward lean by aligning the head-to-ankle axis vertically; blend the correction above the soles to keep the feet planted. Meshoptimizer simplifies the mesh with locked boundaries and a maximum relative error of 0.00075. Vertex data is compacted before GLB export. The source anatomy and proportions are preserved.

- Source: 35,987 triangles; 2,146,828 bytes.
- Runtime: 12,059 triangles; 5,887 vertices; 214,884 bytes.
- One cached geometry is shared across three visitors.
- Runtime flat shading preserves the faceted red appearance.
- Per-visitor collision bounds account for the mesh dimensions, scale, and rotation.

The conversion report records the source SHA-256, output dimensions, simplification error, and file size.
