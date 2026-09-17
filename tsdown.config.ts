import { type UserConfig } from "tsdown";

export const config: UserConfig = {
	entry: ["./src/index.ts"],
	outDir: "./dist",
	clean: true,

	format: "esm",
	target: "es2024",
	platform: "node",

	minify: false,
	sourcemap: true,
	dts: true,
	shims: true,

	unbundle: false,
	deps: { neverBundle: true },
};
