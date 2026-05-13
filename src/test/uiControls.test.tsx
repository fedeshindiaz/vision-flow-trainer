import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CastButton } from "../components/CastButton";
import { Stepper } from "../components/ui";

describe("CastButton", () => {
  it("uses a native button when Cast is available", () => {
    render(
      <CastButton
        statusLabel="Disponible"
        isConfigured
        sdkStatus="available"
        isConnected={false}
      />,
    );

    const button = screen.getByRole("button", { name: /Transmitir/i });

    expect(button.tagName).toBe("BUTTON");
    expect(button).toBeEnabled();
  });
});

describe("Stepper", () => {
  it("disables decrement and increment buttons at their limits", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Stepper label="Series" value={1} unit="" min={1} max={3} step={1} onChange={onChange} />,
    );

    let buttons = screen.getAllByRole("button");

    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeEnabled();

    rerender(<Stepper label="Series" value={3} unit="" min={1} max={3} step={1} onChange={onChange} />);
    buttons = screen.getAllByRole("button");

    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();
  });
});
