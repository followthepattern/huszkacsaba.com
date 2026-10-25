"use client";
import dynamic from "next/dynamic";
const Museum = dynamic(() => import("@/components/Museum"), {
  ssr: false,
  loading: () => (
    <main className="loading-screen">
      <p>
        Opening the space<span className="loading-dot">.</span>
      </p>
    </main>
  ),
});
export default function Page() {
  return <Museum />;
}
