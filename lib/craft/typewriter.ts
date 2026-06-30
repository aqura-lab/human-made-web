// Pure timeline for the hero typewriter. Produces the ordered display frames to
// animate between a sequence of target strings: backspace to the common prefix
// with the next target, then type up to it. One character changes per frame.

export function buildFrames(script: string[]): string[] {
  const frames: string[] = [];
  const push = (s: string) => {
    if (frames.length === 0 || frames[frames.length - 1] !== s) frames.push(s);
  };

  let current = "";
  push(current);

  for (const target of script) {
    let common = 0;
    while (
      common < current.length &&
      common < target.length &&
      current[common] === target[common]
    ) {
      common++;
    }
    for (let len = current.length - 1; len >= common; len--) push(current.slice(0, len));
    for (let len = common + 1; len <= target.length; len++) push(target.slice(0, len));
    current = target;
  }

  return frames;
}
