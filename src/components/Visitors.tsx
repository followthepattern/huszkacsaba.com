"use client";

import { useGLTF } from "@react-three/drei";
import type { Mesh } from "three";
import { VISITORS } from "@/lib/space";

const MODEL = "/models/gallery-visitor.glb?v=standing-1";

export default function Visitors() {
  const { nodes } = useGLTF(MODEL);
  const geometry = (nodes.GalleryVisitor as Mesh).geometry;

  // The single optimized geometry is cached and shared by all three visitors.
  return (
    <group name="gallery-visitors" dispose={null}>
      {VISITORS.map((visitor) => (
        <mesh
          key={visitor.id}
          name={`visitor-${visitor.id}`}
          geometry={geometry}
          position={[visitor.x, 0, visitor.z]}
          rotation={[0, visitor.yaw, 0]}
          scale={visitor.scale}
          castShadow
          receiveShadow
          userData={{ solid: true }}
        >
          <meshStandardMaterial
            color="#cf1427"
            flatShading
            roughness={0.48}
            metalness={0.04}
          />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload(MODEL);
