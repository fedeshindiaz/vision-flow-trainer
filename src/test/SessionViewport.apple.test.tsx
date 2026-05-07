import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { protocols } from "../config/protocols";
import { SessionViewport } from "../components/session/SessionViewport";

vi.mock("../components/canvas/VisualCanvas", () => ({
  VisualCanvas: () => <div data-testid="visual-canvas" />,
}));

const protocol = protocols[0];

function renderViewport(overrides: Partial<ComponentProps<typeof SessionViewport>> = {}) {
  const props: ComponentProps<typeof SessionViewport> = {
    focusHostRef: createRef<HTMLDivElement>(),
    focusMode: true,
    selectedProtocol: protocol,
    background: protocol.background,
    objective: protocol.objective,
    frequencyHz: protocol.frequencyHz,
    amplitude: 42,
    targetSize: 38,
    density: 96,
    stripeSize: 48,
    resetKey: 0,
    visualRunning: true,
    tempoStartedAtMs: null,
    tempoAccumulatedElapsedMs: 0,
    onExitFocusMode: vi.fn(),
    isAppleEnvironment: true,
    isAppleTouchEnvironment: true,
    running: true,
    playLabel: "Pausar",
    onPlayPause: vi.fn(),
    onReset: vi.fn(),
    onAppleSafeExit: vi.fn(),
    ...overrides,
  };

  return { ...render(<SessionViewport {...props} />), props };
}

describe("SessionViewport Apple Safe Session", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render Apple exit controls for non-Apple focus mode", () => {
    renderViewport({ isAppleEnvironment: false, isAppleTouchEnvironment: false });

    expect(screen.queryByRole("button", { name: /salir/i })).not.toBeInTheDocument();
  });

  it("keeps Salir visible and exits through the Apple-safe callback", () => {
    const onAppleSafeExit = vi.fn();

    renderViewport({ onAppleSafeExit });
    fireEvent.click(screen.getAllByRole("button", { name: /salir/i })[0]);

    expect(onAppleSafeExit).toHaveBeenCalledTimes(1);
  });

  it("reveals pause/reset controls on tap after minimal UI mode", () => {
    vi.useFakeTimers();
    const { container } = renderViewport();
    const viewport = container.querySelector(".viewport");

    expect(viewport).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(3900);
    });

    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();

    fireEvent.pointerDown(viewport as Element, { pointerType: "touch" });

    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("opens an exit confirmation after long press on Apple touch", () => {
    vi.useFakeTimers();
    const { container } = renderViewport();
    const viewport = container.querySelector(".viewport");

    fireEvent.pointerDown(viewport as Element, { pointerType: "touch" });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("dialog", { name: /salida de emergencia/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pausar y salir/i })).toBeInTheDocument();
  });
});
