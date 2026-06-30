/** @jest-environment jsdom */
import { render, screen, act } from "@testing-library/react";
import { Typewriter } from "@/components/craft/Typewriter";

function mockMatchMedia(reduce: boolean) {
  window.matchMedia = jest.fn().mockImplementation((q: string) => ({
    matches: q.includes("reduce") ? reduce : false,
    media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn(),
  }));
}

it("exposes the final phrase as accessible text", () => {
  mockMatchMedia(false);
  render(<Typewriter />);
  expect(screen.getByLabelText("human made")).toBeInTheDocument();
});

it("renders the final phrase immediately under reduced motion", () => {
  mockMatchMedia(true);
  const { container } = render(<Typewriter />);
  expect(container.textContent).toContain("human made");
});

it("animates to the final phrase when motion is allowed", () => {
  jest.useFakeTimers();
  mockMatchMedia(false);
  const { container } = render(<Typewriter />);
  act(() => { jest.advanceTimersByTime(8000); });
  expect(container.textContent).toContain("human made");
  jest.useRealTimers();
});
