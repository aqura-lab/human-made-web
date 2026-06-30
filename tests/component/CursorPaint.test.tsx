/** @jest-environment jsdom */
import { render } from "@testing-library/react";
import { CursorPaint } from "@/components/craft/CursorPaint";

function mockEnv({ fine, reduce }: { fine: boolean; reduce: boolean }) {
  window.matchMedia = jest.fn().mockImplementation((q: string) => ({
    matches: q.includes("reduce") ? reduce : q.includes("pointer: fine") ? fine : false,
    media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn(),
  }));
  // jsdom has no canvas 2d context; supply a stub so activation can't throw.
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    setTransform: jest.fn(), clearRect: jest.fn(), beginPath: jest.fn(),
    moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(),
  } as unknown as CanvasRenderingContext2D);
  window.requestAnimationFrame = jest.fn().mockReturnValue(1);
  window.cancelAnimationFrame = jest.fn();
}

it("always renders an aria-hidden canvas overlay", () => {
  mockEnv({ fine: true, reduce: false });
  const { container } = render(<CursorPaint />);
  const canvas = container.querySelector("canvas.cursor-paint");
  expect(canvas).not.toBeNull();
  expect(canvas?.getAttribute("aria-hidden")).toBe("true");
});

it("does not start a frame loop when motion is reduced", () => {
  mockEnv({ fine: true, reduce: true });
  render(<CursorPaint />);
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
});

it("does not start a frame loop on a coarse pointer", () => {
  mockEnv({ fine: false, reduce: false });
  render(<CursorPaint />);
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
});

it("starts the frame loop on a fine pointer with motion allowed", () => {
  mockEnv({ fine: true, reduce: false });
  render(<CursorPaint />);
  expect(window.requestAnimationFrame).toHaveBeenCalled();
});
