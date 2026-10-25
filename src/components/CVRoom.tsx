"use client";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace } from "three";
import { PROFILE } from "@/content/profile";

const INK = "#132442",
  MUTED = "#607491",
  BLUE = "#2458e8";
function lines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
) {
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else line = next;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lineHeight;
}
function font(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight = 400,
  mono = false,
) {
  ctx.font = `${weight} ${size}px "${mono ? "IBM Plex Mono" : "Space Grotesk"}", ${mono ? "monospace" : "sans-serif"}`;
}
function drawCompany(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = MUTED;
  font(ctx, 30, 400, true);
  ctx.fillText("04 / CV & About", 140, 120);
  ctx.fillText(PROFILE.name, 1880, 120);
  ctx.textAlign = "center";
  ctx.fillStyle = BLUE;
  ctx.fillRect(1168, 435, 64, 7);
  ctx.fillStyle = INK;
  font(ctx, 59, 500);
  ctx.fillText(PROFILE.currentRole, 1200, 570);
  let size = 104;
  font(ctx, size, 600);
  while (ctx.measureText("THEPATTERN").width > 620) {
    size -= 2;
    font(ctx, size, 600);
  }
  ctx.fillText("FOLLOW", 1200, 700);
  ctx.fillText("THEPATTERN", 1200, 830);
  ctx.fillStyle = MUTED;
  font(ctx, 28, 400, true);
  ctx.fillText("Kft.", 1200, 886);
  ctx.fillStyle = INK;
  font(ctx, 32);
  ctx.fillText("Building software.", 1200, 955);
  ctx.fillText("Turning ideas into products.", 1200, 998);
  ctx.fillStyle = BLUE;
  font(ctx, 35, 500);
  ctx.fillText("Let’s build something", 1200, 1110);
  ctx.fillRect(990, 1127, 420, 2);
  ctx.fillStyle = MUTED;
  font(ctx, 20, 400, true);
  ctx.fillText("followthepattern.net/contact", 1200, 1170);
  ctx.textAlign = "left";
}
function drawCareer(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = MUTED;
  font(ctx, 27, 400, true);
  ctx.fillText("Curriculum vitae / Selected experience", 125, 105);
  ctx.fillStyle = INK;
  font(ctx, 100, 500);
  ctx.fillText("A career in making.", 125, 235);
  ctx.strokeStyle = "#cbd6e6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(520, 330);
  ctx.lineTo(520, 1190);
  ctx.stroke();
  PROFILE.experience.forEach((job, i) => {
    const y = 355 + i * 116;
    ctx.fillStyle = i === 0 ? BLUE : MUTED;
    font(ctx, 25, 400, true);
    ctx.fillText(job.period, 125, y);
    ctx.beginPath();
    ctx.arc(520, y - 9, i === 0 ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i === 0 ? BLUE : INK;
    font(ctx, 49, 500);
    ctx.fillText(job.company, 570, y);
    ctx.fillStyle = MUTED;
    font(ctx, 25, 400, true);
    ctx.fillText(job.role, 570, y + 42);
    ctx.fillStyle = INK;
    font(ctx, 30);
    lines(ctx, job.summary, 1430, y - 5, 1080, 41);
  });
}
function drawProfile(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BLUE;
  font(ctx, 27, 400, true);
  ctx.fillText("Csaba Zsolt Huszka / Profile", 120, 100);
  ctx.fillStyle = INK;
  font(ctx, 104, 500);
  ctx.fillText("Software engineer.", 120, 245);
  ctx.fillText("Founder. Educator.", 120, 365);
  font(ctx, 37);
  lines(ctx, PROFILE.summary, 120, 480, 1640, 57);
  ctx.fillStyle = BLUE;
  font(ctx, 27, 400, true);
  ctx.fillText("Tools of the trade", 120, 735);
  ctx.fillStyle = INK;
  font(ctx, 37);
  lines(ctx, PROFILE.skills.join(" / "), 120, 803, 1640, 57);
  ctx.fillStyle = BLUE;
  font(ctx, 27, 400, true);
  ctx.fillText("Education", 120, 1010);
  ctx.fillStyle = INK;
  font(ctx, 42, 500);
  ctx.fillText(PROFILE.education.degree, 120, 1080);
  ctx.fillStyle = MUTED;
  font(ctx, 30);
  ctx.fillText("Budapest University of Technology and Economics", 120, 1135);
  ctx.fillText(PROFILE.education.period, 120, 1185);
}
function useWallTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext("2d")!);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    return { canvas, texture };
  }, [width, height, draw]);
  useEffect(() => {
    let active = true;
    Promise.all([
      document.fonts.load('500 48px "Space Grotesk"'),
      document.fonts.load('400 28px "IBM Plex Mono"'),
    ]).then(() => {
      if (!active) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, width, height);
      draw(ctx);
      texture.needsUpdate = true;
    });
    return () => {
      active = false;
      texture.dispose();
    };
  }, [canvas, texture, width, height, draw]);
  return texture;
}
export default function CVRoom({ onOpenCV }: { onOpenCV: () => void }) {
  const { gl } = useThree();
  const company = useWallTexture(2400, 1200, drawCompany),
    career = useWallTexture(2700, 1320, drawCareer),
    profile = useWallTexture(1900, 1280, drawProfile);
  return (
    <group name="cv-and-about-room">
      <group position={[10, 3.65, 17.762]} rotation={[0, Math.PI, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onOpenCV();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            gl.domElement.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = "grab";
          }}
        >
          <planeGeometry args={[12.4, 6.2]} />
          <meshBasicMaterial
            map={company}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh
          position={[0, -2.6, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            window.open(PROFILE.contactUrl, "_blank", "noopener,noreferrer");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            gl.domElement.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = "grab";
          }}
        >
          <planeGeometry args={[3.35, 0.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      <mesh
        position={[2.238, 3.6, 10.7]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenCV();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "grab";
        }}
      >
        <planeGeometry args={[11.6, 5.67]} />
        <meshBasicMaterial
          map={career}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[17.762, 3.6, 10.7]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenCV();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "grab";
        }}
      >
        <planeGeometry args={[8.4, 5.66]} />
        <meshBasicMaterial
          map={profile}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
