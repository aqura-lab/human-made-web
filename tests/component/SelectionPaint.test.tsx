/** @jest-environment jsdom */
import { render } from "@testing-library/react";
import { SelectionPaint } from "@/components/craft/SelectionPaint";
import { SELECTION_INKS } from "@/lib/craft/paint";

function mockMatchMedia(reduce: boolean) {
  window.matchMedia = jest.fn().mockImplementation((q: string) => ({
    matches: q.includes("reduce") ? reduce : false,
    media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn(),
  }));
}

function mockSelection(text: string) {
  // @ts-expect-error partial Selection is enough for the component
  document.getSelection = () => ({ isCollapsed: text.length === 0, toString: () => text });
}

afterEach(() => {
  document.documentElement.style.removeProperty("--paint-selection");
});

it("paints a contrast-safe selection ink on a new selection", () => {
  mockMatchMedia(false);
  mockSelection("hello");
  render(<SelectionPaint />);
  document.dispatchEvent(new Event("selectionchange"));
  const value = document.documentElement.style.getPropertyValue("--paint-selection");
  expect(SELECTION_INKS as readonly string[]).toContain(value);
});

it("does nothing under reduced motion", () => {
  mockMatchMedia(true);
  mockSelection("hello");
  render(<SelectionPaint />);
  document.dispatchEvent(new Event("selectionchange"));
  expect(document.documentElement.style.getPropertyValue("--paint-selection")).toBe("");
});
