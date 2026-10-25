"use client";

import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { DRAWINGS, type Drawing } from "@/content/drawings";

function Caption({ drawing }: { drawing: Drawing }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 180;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#132442";
    ctx.font = "42px monospace";
    ctx.fillText(drawing.title, 0, 60);
    ctx.fillStyle = "#65748b";
    ctx.font = "25px monospace";
    ctx.fillText(drawing.caption, 0, 115);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [drawing]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, -drawing.height / 2 - 0.36, 0.095]}>
      <planeGeometry args={[2.5, 0.44]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function FramedDrawing({
  drawing,
  texture,
}: {
  drawing: Drawing;
  texture: Texture;
}) {
  const { width, height } = drawing;
  const mat = 0.13;
  const edge = 0.035;
  const outerWidth = width + mat * 2;
  const outerHeight = height + mat * 2;

  return (
    <group
      name={`drawing-${drawing.id}`}
      position={drawing.position}
      rotation={[0, drawing.rotation, 0]}
    >
      <mesh position={[0, 0, 0.035]} castShadow>
        <boxGeometry args={[outerWidth, outerHeight, 0.065]} />
        <meshStandardMaterial color="#f8f7f3" roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * (outerWidth / 2 + edge / 2), 0, 0.04]}
            castShadow
          >
            <boxGeometry args={[edge, outerHeight + edge * 2, 0.09]} />
            <meshStandardMaterial
              color="#26364c"
              roughness={0.7}
              metalness={0.15}
            />
          </mesh>
          <mesh
            position={[0, side * (outerHeight / 2 + edge / 2), 0.04]}
            castShadow
          >
            <boxGeometry args={[outerWidth, edge, 0.09]} />
            <meshStandardMaterial
              color="#26364c"
              roughness={0.7}
              metalness={0.15}
            />
          </mesh>
        </group>
      ))}
      <Caption drawing={drawing} />
    </group>
  );
}

export default function DrawingRoom() {
  const textures = useTexture(
    DRAWINGS.map((drawing) => drawing.image),
    (loaded) => {
      for (const texture of loaded as Texture[]) {
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 4;
      }
    },
  );

  return (
    <group name="drawing-gallery">
      {DRAWINGS.map((drawing, index) => (
        <FramedDrawing
          key={drawing.id}
          drawing={drawing}
          texture={textures[index]}
        />
      ))}
    </group>
  );
}
