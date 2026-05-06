import { describe, expect, it } from "vitest";
import { protocolCategories } from "../constants/modules";
import { protocols } from "../config/protocols";

describe("protocol catalog", () => {
  it("keeps a single RVO x1 protocol", () => {
    const rvoX1 = protocols.filter((protocol) => protocol.category === "RVO x1");

    expect(rvoX1).toHaveLength(1);
    expect(rvoX1[0].name).toBe("RVO x1");
    expect(rvoX1[0].objective.direction).toBe("horizontal");
  });

  it("removes RVO x2 Fast and smooth pursuit protocols", () => {
    expect(protocols.some((protocol) => protocol.name.includes("RVO x2 Fast"))).toBe(false);
    expect(protocols.some((protocol) => protocol.category === "Seguimiento suave")).toBe(false);
    expect(protocolCategories.includes("Seguimiento suave" as never)).toBe(false);
  });

  it("adds center-return corrective saccades", () => {
    const protocol = protocols.find((item) => item.id === "saccade-76");

    expect(protocol?.category).toBe("Sacadas correctivas");
    expect(protocol?.objective.direction).toBe("center-cardinal");
  });

  it("uses guided as a zeroed custom template", () => {
    const custom = protocols.find((protocol) => protocol.id === "guided-custom");

    expect(custom?.background.enabled).toBe(false);
    expect(custom?.objective.enabled).toBe(false);
    expect(custom?.frequencyHz).toBe(0.1);
    expect(custom?.metronome).toBe(false);
    expect(custom?.defaults).toMatchObject({
      amplitude: 0,
      targetSize: 0,
      density: 0,
      stripeSize: 0,
      duration: 0,
      sets: 0,
      rest: 0,
    });
  });
});
