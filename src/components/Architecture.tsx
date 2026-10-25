"use client";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import {
  WALLS,
  BENCHES,
  CV_ROOM,
  DRAWING_ROOM,
  GALLERIES,
  ROOMS,
  type Solid,
} from "@/lib/space";
import PigmentWalls from "./PigmentWalls";
import CVRoom from "./CVRoom";
import DrawingRoom from "./DrawingRoom";
import Visitors from "./Visitors";
function Block({ x, z, w, d, h, y, color = "#f4f6f9" }: Solid) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={[x, y ?? h / 2, z]}
      userData={{ solid: true }}
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.87} />
    </mesh>
  );
}
function WallLabel({
  position,
  rotation = 0,
  title,
  detail,
}: {
  position: [number, number, number];
  rotation?: number;
  title: string;
  detail: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#30476b";
    ctx.font = "24px monospace";
    ctx.fillText("Csaba Huszka", 10, 70);
    ctx.font = "42px monospace";
    ctx.fillText(title, 10, 170);
    ctx.fillStyle = "#6a7f9d";
    ctx.font = "19px monospace";
    ctx.fillText(detail, 10, 245);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [title, detail]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <planeGeometry args={[2.1, 0.82]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
export default function Architecture({ onOpenCV }: { onOpenCV: () => void }) {
  return (
    <>
      <color attach="background" args={["#e6edf7"]} />
      <ambientLight intensity={1.1} color="#f4f6ff" />
      <hemisphereLight args={["#f0f4ff", "#cbd2df", 1.15]} />
      <directionalLight
        castShadow
        position={[-12, 22, 14]}
        intensity={3.8}
        color="#fffdfa"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-43}
        shadow-camera-right={43}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-camera-near={1}
        shadow-camera-far={85}
        shadow-bias={-0.00015}
        shadow-normalBias={0.03}
        shadow-radius={3}
      />
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.025, 0]}
      >
        <planeGeometry args={[100, 80]} />
        <meshStandardMaterial
          color="#dce2e9"
          roughness={0.6}
          metalness={0.035}
        />
      </mesh>
      {WALLS.map((wall, i) => (
        <Block key={`wall-${i}`} {...wall} />
      ))}
      <PigmentWalls />
      <DrawingRoom />
      <Visitors />
      <CVRoom onOpenCV={onOpenCV} />
      {/* Continuous roof light makes the corridor direction immediately legible. */}
      {[-3.15, 3.15].map((z) => (
        <Block key={`roof-${z}`} x={0} z={z} y={7.1} w={60} d={1.7} h={0.3} />
      ))}
      {[-2.3, 2.3].map((z) => (
        <Block
          key={`rail-${z}`}
          x={0}
          z={z}
          y={7.24}
          w={60}
          d={0.1}
          h={0.18}
          color="#d5deea"
        />
      ))}
      {Array.from({ length: 11 }, (_, i) => i * 6 - 30).map((x) => (
        <Block
          key={`cross-${x}`}
          x={x}
          z={0}
          y={7.25}
          w={0.13}
          d={4.6}
          h={0.18}
          color="#d5deea"
        />
      ))}
      {GALLERIES.map((id) => {
        const r = ROOMS[id];
        return (
          <group key={id}>
            {[-5.15, 5.15].map((dx) => (
              <Block
                key={dx}
                x={r.x + dx}
                z={r.side * 11}
                y={7.1}
                w={5.7}
                d={14}
                h={0.3}
              />
            ))}
            {[6, 11, 16].map((z) => (
              <Block
                key={z}
                x={r.x}
                z={r.side * z}
                y={7.25}
                w={4.6}
                d={0.12}
                h={0.18}
                color="#d5deea"
              />
            ))}
            {id !== CV_ROOM && (
              <WallLabel
                position={[r.x - 3.3, 1.35, r.side * 17.76]}
                rotation={r.side < 0 ? 0 : Math.PI}
                title={r.name}
                detail={
                  id === DRAWING_ROOM
                    ? "Drawings & stories / 01"
                    : `Pigment study / ${r.index}`
                }
              />
            )}
            <WallLabel
              position={[r.x - 3.35, 1.65, r.side * 3.76]}
              rotation={r.side < 0 ? 0 : Math.PI}
              title={r.name}
              detail={
                id === CV_ROOM
                  ? "Curriculum vitae"
                  : id === DRAWING_ROOM
                    ? "Drawings & stories"
                    : r.side < 0
                      ? "North side"
                      : "South side"
              }
            />
          </group>
        );
      })}
      {/* Daylight at the end of the hall is a quiet visual destination. */}
      <mesh
        position={[30, 3.2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        userData={{ solid: true }}
      >
        <planeGeometry args={[5, 5.4]} />
        <meshBasicMaterial color="#e2ecfa" />
      </mesh>
      <Block
        x={29.94}
        z={0}
        y={3.2}
        w={0.08}
        d={0.06}
        h={5.4}
        color="#b8c7dc"
      />
      <Block x={29.94} z={0} y={3.7} w={0.08} d={5} h={0.06} color="#b8c7dc" />
      {BENCHES.map((bench, i) => (
        <group key={`bench-${i}`}>
          <Block {...bench} h={0.16} y={bench.h - 0.08} />
          {[-1, 1].map((s) => (
            <Block
              key={s}
              x={bench.x + s * 1.2}
              z={bench.z}
              w={0.18}
              d={0.6}
              h={bench.h - 0.16}
              color="#344763"
            />
          ))}
        </group>
      ))}
      {Array.from({ length: 21 }, (_, i) => i * 3 - 30).map((x) => (
        <mesh
          key={`joint-x-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.002, 0]}
        >
          <planeGeometry args={[0.009, 36]} />
          <meshBasicMaterial
            color="#bac7d8"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      ))}
      {Array.from({ length: 13 }, (_, i) => i * 3 - 18).map((z) => (
        <mesh
          key={`joint-z-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.003, z]}
        >
          <planeGeometry args={[60, 0.009]} />
          <meshBasicMaterial
            color="#bac7d8"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      ))}
      <ContactShadows
        position={[0, 0.009, 0]}
        opacity={0.25}
        scale={76}
        blur={2.2}
        far={9}
        resolution={1024}
        frames={1}
        color="#63728b"
      />
    </>
  );
}
