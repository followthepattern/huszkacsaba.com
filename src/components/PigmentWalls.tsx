"use client";

import { useTexture } from "@react-three/drei";
import { DoubleSide, SRGBColorSpace } from "three";
import { CV_ROOM, DRAWING_ROOM, GALLERIES, ROOMS } from "@/lib/space";

type Paint = {
  position: [number, number, number];
  rotation?: number;
  width: number;
  height: number;
  tilt?: number;
  flip?: boolean;
};

const HALL_PAINT: Paint[] = [
  { position: [-22.7, 3.5, -3.766], width: 7.2, height: 4.3, tilt: 0.04 },
  {
    position: [-23, 3.6, 3.766],
    rotation: Math.PI,
    width: 6.1,
    height: 3.6,
    flip: true,
    tilt: -0.06,
  },
  {
    position: [-4.5, 3.7, -3.766],
    width: 10.5,
    height: 4.2,
    flip: true,
    tilt: -0.025,
  },
  {
    position: [0.7, 3.8, 3.766],
    rotation: Math.PI,
    width: 10.4,
    height: 4.3,
    tilt: 0.035,
  },
  {
    position: [23, 3.7, 3.766],
    rotation: Math.PI,
    width: 7,
    height: 3.7,
    flip: true,
  },
];

export default function PigmentWalls() {
  const texture = useTexture("/textures/pigment-study.webp", (map) => {
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 4;
  });
  const paintings: Paint[] = [
    ...HALL_PAINT,
    ...GALLERIES.filter((id) => id !== CV_ROOM && id !== DRAWING_ROOM).map(
      (id) => {
        const room = ROOMS[id];
        const i = GALLERIES.indexOf(id);
        return {
          position: [room.x, 4.1, room.side * 17.766] as [
            number,
            number,
            number,
          ],
          rotation: room.side < 0 ? 0 : Math.PI,
          width: 12.4,
          height: 4.2,
          tilt: i % 2 ? -0.025 : 0.025,
          flip: i % 2 === 1,
        };
      },
    ),
  ];

  return (
    <group name="pigment-wall-studies">
      {paintings.map(
        ({ position, rotation = 0, width, height, tilt = 0, flip }, i) => (
          <group key={i} position={position} rotation={[0, rotation, 0]}>
            <mesh
              rotation={[0, 0, tilt]}
              scale={[flip ? -1 : 1, 1, 1]}
              receiveShadow
              renderOrder={1}
            >
              <planeGeometry args={[width, height]} />
              <meshStandardMaterial
                map={texture}
                transparent
                alphaTest={0.012}
                depthWrite={false}
                roughness={1}
                metalness={0}
                side={DoubleSide}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}
