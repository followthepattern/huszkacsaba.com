export type Drawing = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: number;
  caption: string;
};

// Temporary examples. Replace the image, title, and caption with the owner's work.
// Width / height match each image's aspect ratio so drawings are never stretched.
export const DRAWINGS: Drawing[] = [
  {
    id: "architecture",
    title: "Space & structure",
    image: "/drawings/sample-architecture.webp",
    width: 4.2,
    height: 2.8,
    position: [-14, 2.95, -17.73],
    rotation: 0,
    caption: "AI-generated sample artwork",
  },
  {
    id: "portrait",
    title: "Portrait study",
    image: "/drawings/sample-portrait.webp",
    width: 2.4,
    height: 3.6,
    position: [-21.73, 3.2, -10.5],
    rotation: Math.PI / 2,
    caption: "AI-generated sample artwork",
  },
  {
    id: "botanical",
    title: "Magnolia study",
    image: "/drawings/sample-botanical.webp",
    width: 2.4,
    height: 3.6,
    position: [-6.27, 3.2, -11.5],
    rotation: -Math.PI / 2,
    caption: "AI-generated sample artwork",
  },
];
