"use client";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FileText,
  Check,
  ChevronDown,
  Footprints,
  Info,
  Map,
  Maximize,
  Minimize,
  MousePointer2,
  RotateCcw,
  X,
  ChevronRight,
  MoveVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { ACESFilmicToneMapping } from "three";
import Architecture from "./Architecture";
import CVDialog from "./CVDialog";
import Navigation, { type NavigationAPI, type Position } from "./Navigation";
import {
  ROOMS,
  START,
  CV_ROOM,
  GALLERIES,
  type Mode,
  type Room,
} from "@/lib/space";

const MODES: {
  id: Mode;
  name: string;
  icon: typeof MousePointer2;
  description: string;
}[] = [
  {
    id: "guided",
    name: "Guided",
    icon: MoveVertical,
    description:
      "Scroll to explore every room. Drag to look. Click a room to skip ahead.",
  },
  {
    id: "walk",
    name: "Free walk",
    icon: Footprints,
    description:
      "WASD or arrow keys to walk. Drag to look. Shift to move faster.",
  },
];
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.error ? (
      <div className="scene-error">
        <h1>The space needs WebGL.</h1>
        <p>
          Try a browser with hardware acceleration enabled, then reload to step
          inside.
        </p>
        <button onClick={() => location.reload()}>
          Reload the space <RotateCcw size={14} />
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function FloorPlan({
  position,
  onGo,
}: {
  position: Position;
  onGo: (room: Room) => void;
}) {
  const px = position.x * 3 + 105,
    pz = position.z * 3 + 71;
  return (
    <svg
      viewBox="0 0 210 142"
      className="floorplan"
      aria-label={`Gallery floor plan. You are in ${ROOMS[position.room].name.toLowerCase()}.`}
    >
      <defs>
        <radialGradient id="view-cone">
          <stop stopColor="#2458e8" stopOpacity=".24" />
          <stop offset="1" stopColor="#2458e8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="15" y="59" width="180" height="24" fill="#edf2f9" />
      <rect x="15" y="65" width="180" height="12" fill="#fff" opacity=".65" />
      {GALLERIES.map((id) => {
        const r = ROOMS[id],
          x = r.x * 3 + 81,
          y = r.side < 0 ? 17 : 83;
        return (
          <g
            key={id}
            role="button"
            tabIndex={0}
            aria-label={`Go to ${r.name}`}
            className="map-room"
            onClick={() => onGo(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onGo(id);
              }
            }}
          >
            <rect
              x={x}
              y={y}
              width="48"
              height="42"
              fill={position.room === id ? "#dce7ff" : "#edf2f9"}
            />
            <path
              d={
                r.side < 0
                  ? `M${x} 59V17H${x + 48}V59`
                  : `M${x} 83V125H${x + 48}V83`
              }
              fill="none"
              stroke="#aebdd2"
              strokeWidth="1"
            />
            <text
              x={x + 24}
              y={y + 24}
              textAnchor="middle"
              fill="#647b9d"
              fontSize="7"
              pointerEvents="none"
            >
              {id === CV_ROOM ? "CV" : r.index}
            </text>
            <title>{r.name}</title>
          </g>
        );
      })}
      <path
        d="M15 59H57.6M68.4 59H129.6M140.4 59H195V83H140.4M129.6 83H68.4M57.6 83H15V59"
        fill="none"
        stroke="#aebdd2"
        strokeWidth="1"
      />
      <g
        role="button"
        tabIndex={0}
        aria-label="Return to the hall entrance"
        className="map-room"
        onClick={() => onGo("hall")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onGo("hall");
          }
        }}
      >
        <rect x="16" y="60" width="22" height="22" fill="transparent" />
        <path
          d="M22 71H31M25 68L22 71L25 74"
          fill="none"
          stroke="#647b9d"
          strokeWidth=".8"
          pointerEvents="none"
        />
      </g>
      <g
        transform={`translate(${px},${pz}) rotate(${(-position.yaw * 180) / Math.PI})`}
        pointerEvents="none"
      >
        <path d="M0 0L-13 -22Q0 -28 13 -22Z" fill="url(#view-cone)" />
        <circle r="3.4" fill="#2458e8" stroke="white" strokeWidth="1.4" />
        <path d="M0 -6L-2 -9H2Z" fill="#2458e8" />
      </g>
    </svg>
  );
}
function DirectionPad({ api }: { api: React.RefObject<NavigationAPI | null> }) {
  return (
    <div className="direction-pad" aria-label="Movement controls">
      {[
        { key: "w", label: "Move forward", Icon: ArrowUp },
        { key: "a", label: "Move left", Icon: ArrowLeft },
        { key: "s", label: "Move backward", Icon: ArrowDown },
        { key: "d", label: "Move right", Icon: ArrowRight },
      ].map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`direction direction-${key}`}
          aria-label={label}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            api.current?.hold(key, true);
          }}
          onPointerUp={() => api.current?.hold(key, false)}
          onPointerCancel={() => api.current?.hold(key, false)}
          onLostPointerCapture={() => api.current?.hold(key, false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              api.current?.hold(key, true);
            }
          }}
          onKeyUp={() => api.current?.hold(key, false)}
          onBlur={() => api.current?.hold(key, false)}
        >
          <Icon size={17} />
        </button>
      ))}
    </div>
  );
}
export default function Museum() {
  const [mode, setMode] = useState<Mode>("guided");
  const [position, setPosition] = useState<Position>({
    ...START,
    room: "hall",
    detour: false,
    returning: false,
    progress: 0,
  });
  const [ready, setReady] = useState(false),
    [explored, setExplored] = useState(false),
    [mapOpen, setMapOpen] = useState(true),
    [panel, setPanel] = useState<"info" | "cv" | null>(null),
    [hidden, setHidden] = useState(false),
    [fullscreen, setFullscreen] = useState(false),
    [reducedMotion, setReducedMotion] = useState(false);
  const info = panel === "info",
    cvOpen = panel === "cv",
    modalOpen = panel !== null;
  const panelOpener = useRef<HTMLElement | null>(null);
  const openPanel = useCallback((kind: "info" | "cv") => {
    panelOpener.current = document.activeElement as HTMLElement;
    setPanel(kind);
  }, []);
  const openCV = useCallback(() => openPanel("cv"), [openPanel]);
  const api = useRef<NavigationAPI | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousRoom = useRef<Room>("hall");
  const outsideMapOpen = useRef(true);
  useEffect(() => {
    if (position.room === CV_ROOM && previousRoom.current !== CV_ROOM) {
      setMapOpen((current) => {
        outsideMapOpen.current = current;
        return false;
      });
    } else if (position.room !== CV_ROOM && previousRoom.current === CV_ROOM) {
      setMapOpen(outsideMapOpen.current);
    }
    previousRoom.current = position.room;
  }, [position.room]);
  const onReady = useCallback(() => setReady(true), []);
  const onInteract = useCallback(() => setExplored(true), []);
  const report = useCallback((p: Position) => setPosition(p), []);
  const go = useCallback((room: Room) => {
    setExplored(true);
    api.current?.go(room);
  }, []);
  const reset = useCallback(() => {
    api.current?.reset();
    setExplored(false);
  }, []);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(m.matches);
    change();
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (modalOpen) {
        if (e.key === "Escape") setPanel(null);
        return;
      }
      if (
        (e.target as HTMLElement).matches("input,textarea,select") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.key === "1") setMode("guided");
      if (e.key === "2") setMode("walk");
      if (e.key.toLowerCase() === "r") reset();
      if (e.key.toLowerCase() === "m") setMapOpen((v) => !v);
      if (e.key.toLowerCase() === "h") setHidden((v) => !v);
      if (e.key === "Escape") {
        setPanel(null);
        setHidden(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [reset, modalOpen]);
  useEffect(() => {
    if (!modalOpen) return;
    const previous = panelOpener.current;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!buttons?.length) return;
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modalOpen]);
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* Browser may restrict fullscreen in an embedded preview. */
    }
  };
  const active = MODES.find((m) => m.id === mode)!;
  return (
    <main
      className={`museum ${ready ? "is-ready" : ""} ${hidden ? "ui-hidden" : ""}`}
    >
      <div className="scene">
        <SceneBoundary onError={onReady}>
          <Canvas
            shadows
            dpr={[1, 1.75]}
            camera={{
              position: [START.x, 1.68, START.z],
              fov: 65,
              near: 0.08,
              far: 150,
            }}
            gl={{
              antialias: true,
              powerPreference: "high-performance",
              toneMapping: ACESFilmicToneMapping,
              toneMappingExposure: 1,
            }}
          >
            <Suspense fallback={null}>
              <Architecture onOpenCV={openCV} />
              <Navigation
                mode={mode}
                api={api}
                report={report}
                onReady={onReady}
                onInteract={onInteract}
                reducedMotion={reducedMotion}
                paused={modalOpen}
              />
            </Suspense>
          </Canvas>
        </SceneBoundary>
      </div>
      {!ready && (
        <div className="loading-screen">
          <p>
            Letting the light in<span className="loading-dot">.</span>
          </p>
        </div>
      )}
      <div className="top-shade" />
      <header className="topbar ui-element">
        <a
          href="/"
          className="identity"
          aria-label="Csaba Huszka, return to the hall entrance"
          onClick={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <span className="identity-text">Csaba Huszka</span>
        </a>
        <nav className="room-nav" aria-label="Gallery rooms">
          {(Object.keys(ROOMS) as Room[]).map((room) => (
            <button
              key={room}
              aria-current={position.room === room ? "location" : undefined}
              onClick={() => go(room)}
            >
              <span className="room-dot" />
              {ROOMS[room].name}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button
            className="icon-button"
            onClick={() => openPanel("info")}
            aria-label="About this spatial study"
          >
            <Info size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>
      <div
        className={`intro ui-element ${explored ? "intro-away" : ""}`}
        aria-hidden={explored}
      >
        <h1>
          Ideas,
          <br />
          in space.
        </h1>
        <p className="intro-copy">
          Software, sketches, and things in between.
          <br />
          Follow your curiosity.
        </p>
        <div className="intro-caption">
          <span className="live-dot" />
          An evolving creative space
        </div>
      </div>
      <aside
        className={`location ui-element ${explored ? "location-visible" : ""}`}
        aria-live="polite"
        aria-hidden={!explored}
      >
        <span className="location-index">
          {position.room === "hall"
            ? "The promenade"
            : `Room ${ROOMS[position.room].index} / 04`}
        </span>
        <h2>{ROOMS[position.room].name}</h2>
        <p>{ROOMS[position.room].subtitle}</p>
        {position.room === CV_ROOM && (
          <button className="cv-room-button" onClick={openCV}>
            <FileText size={15} strokeWidth={1.5} />
            Read CV
          </button>
        )}
      </aside>
      <aside className="map-wrap ui-element">
        <button
          className="map-heading"
          onClick={() => setMapOpen((v) => !v)}
          aria-expanded={mapOpen}
        >
          <Map size={14} strokeWidth={1.5} />
          <span>The space</span>
          <ChevronDown size={13} className={mapOpen ? "expanded" : ""} />
        </button>
        {mapOpen && (
          <div className="map-content">
            <FloorPlan position={position} onGo={go} />
            <div className="map-footer">
              <span className="map-dot" />
              You are here<span>60 × 36 m</span>
            </div>
          </div>
        )}
      </aside>
      {mode === "walk" && (
        <div className="walk-controls ui-element">
          <DirectionPad api={api} />
        </div>
      )}
      <footer className="bottom-bar ui-element">
        <div className="bottom-note">
          <span className="live-dot" />
          <span>Built for wandering.</span>
        </div>
        <div className="controller">
          <div
            className="mode-switch"
            role="group"
            aria-label="Choose how to move"
          >
            {MODES.map(({ id, name, icon: Icon }, i) => (
              <button
                key={id}
                className={mode === id ? "active" : ""}
                onClick={() => setMode(id)}
                aria-pressed={mode === id}
                title={`${name} (${i + 1})`}
              >
                <Icon size={16} strokeWidth={1.6} />
                <span>{name}</span>
                <span className="mode-key">{i + 1}</span>
              </button>
            ))}
          </div>
          <div className="controller-hint" aria-live="polite">
            {mode === "guided" && position.returning
              ? "Rejoining the guided route. Then onwards."
              : mode === "guided" && position.detour
                ? "Scroll to continue the tour. Or choose another room."
                : active.description}
          </div>
          {mode === "guided" && (
            <div className="tour-progress">
              <span>Entrance</span>
              <input
                type="range"
                aria-label="Guided tour progress"
                min="0"
                max="1000"
                value={Math.round(position.progress * 1000)}
                onChange={(e) =>
                  api.current?.scrub(Number(e.target.value) / 1000)
                }
              />
              <span>{Math.round(position.progress * 100)}%</span>
            </div>
          )}
        </div>
        <div className="view-actions">
          <button
            className="icon-button"
            onClick={reset}
            aria-label="Reset view"
            title="Reset view (R)"
          >
            <RotateCcw size={17} strokeWidth={1.5} />
          </button>
          <button
            className="icon-button"
            onClick={() => setHidden(true)}
            aria-label="Hide interface"
            title="Hide interface (H)"
          >
            <EyeOff size={18} strokeWidth={1.5} />
          </button>
          <button
            className="icon-button fullscreen-button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? (
              <Minimize size={17} strokeWidth={1.5} />
            ) : (
              <Maximize size={17} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </footer>
      {hidden && (
        <button
          className="restore-ui icon-button"
          onClick={() => setHidden(false)}
          aria-label="Show interface"
          title="Show interface (H)"
        >
          <Eye size={18} />
        </button>
      )}
      <span className="scene-sr" aria-live="off">
        You are exploring {ROOMS[position.room].name.toLowerCase()} using{" "}
        {active.name.toLowerCase()} controls.
      </span>
      {cvOpen && (
        <CVDialog onClose={() => setPanel(null)} dialogRef={dialogRef} />
      )}
      {info && (
        <div className="modal-backdrop" onClick={() => setPanel(null)}>
          <section
            ref={dialogRef}
            className="info-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button close-button"
              autoFocus
              onClick={() => setPanel(null)}
              aria-label="Close study information"
            >
              <X size={20} />
            </button>
            <span className="info-kicker">Space, color, curiosity.</span>
            <h2 id="study-title">
              Before anything
              <br />
              fills the space.
            </h2>
            <p>
              This is a study of an interactive creative space: a long skylit
              hall, four galleries, and daylight. Abstract pigment marks the
              walls. For now, the space itself is the exhibit.
            </p>
            <p>
              Scroll to travel along the hall and through all four galleries.
              Each room is part of the route. Scroll back to retrace your steps,
              or click a room to go straight there and continue from that point.
              Free walking is always one switch away.
            </p>
            <div className="info-modes">
              {MODES.map(({ id, name, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMode(id);
                    setPanel(null);
                  }}
                >
                  <Icon size={20} />
                  <span>
                    <strong>{name}</strong>
                    <small>{description}</small>
                  </span>
                  {mode === id ? (
                    <Check size={17} />
                  ) : (
                    <ChevronRight size={17} />
                  )}
                </button>
              ))}
            </div>
            <div className="shortcuts">
              <span>
                <kbd>1</kbd>
                <kbd>2</kbd>
                Change controls
              </span>
              <span>
                <kbd>R</kbd> Reset
              </span>
              <span>
                <kbd>M</kbd> Map
              </span>
              <span>
                <kbd>H</kbd> Interface
              </span>
            </div>
            <p className="study-footnote">
              Spatial prototype · October 2026
              <br />
              Architecture and pigment, before the exhibits.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
