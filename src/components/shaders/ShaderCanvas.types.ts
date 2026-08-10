import type {
  DitheringParams,
  GodRaysParams,
  LiquidMetalParams,
} from "@paper-design/shaders";

export type ShaderName = "dithering" | "godRays" | "liquidMetal";

export type ShaderCanvasParams =
  | DitheringParams
  | GodRaysParams
  | LiquidMetalParams;
