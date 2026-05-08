import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "../components/AppHeader";

const baseProps = {
  version: "0.0.0",
  castStatusLabel: "Sin receptor compatible",
  castIsConfigured: true,
  castSdkStatus: "unavailable",
  castIsConnected: false,
  onSafety: vi.fn(),
  onFocusMode: vi.fn(),
};

describe("AppHeader", () => {
  it("shows Cast controls outside Apple environments", () => {
    render(<AppHeader {...baseProps} isAppleEnvironment={false} />);

    expect(screen.getByRole("button", { name: /Transmitir/i })).toBeInTheDocument();
  });

  it("hides Cast controls in Apple environments", () => {
    render(<AppHeader {...baseProps} isAppleEnvironment />);

    expect(screen.queryByRole("button", { name: /Transmitir/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seguridad/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Modo pantalla/i })).toBeInTheDocument();
  });
});
