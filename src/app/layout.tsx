import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Csaba Huszka — Ideas, in space",
  description:
    "An interactive space for software, design, and creative exploration. Follow a skylit hall, explore four galleries, and find your own way through the space.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
