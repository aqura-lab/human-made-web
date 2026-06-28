import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Default to node env for unit + API-route tests. Component tests opt into
  // jsdom with a per-file `@jest-environment jsdom` docblock.
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  clearMocks: true,
};

// next/jest hard-codes transformIgnorePatterns and ignores a plain override, so
// we resolve its config and adjust it: @noble/ed25519 is ESM-only and must be
// transformed by SWC rather than ignored.
const buildConfig = async () => {
  const resolved = await createJestConfig(config)();
  // A file is left untransformed if it matches ANY pattern, so every
  // node_modules pattern must exempt @noble/ed25519. Replace next/jest's
  // node_modules patterns (we use npm, not pnpm) with one combined exemption.
  resolved.transformIgnorePatterns = [
    "/node_modules/(?!(@noble/ed25519|nanoid|jose|geist|next/dist/client|next/dist/shared/lib)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return resolved;
};

export default buildConfig;
