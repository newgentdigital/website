import {
  defaultObjectSizing,
  defaultPatternSizing,
  ditheringFragmentShader,
  DitheringShapes,
  DitheringTypes,
  getShaderColorFromString,
  getShaderNoiseTexture,
  godRaysFragmentShader,
  liquidMetalFragmentShader,
  LiquidMetalShapes,
  ShaderFitOptions,
  ShaderMount,
  type DitheringParams,
  type GodRaysParams,
  type LiquidMetalParams,
  type ShaderMountUniforms,
  type ShaderSizingParams,
} from "@paper-design/shaders";

import type { ShaderName } from "./ShaderCanvas.types";

type Sizing = Required<ShaderSizingParams>;
type Motion = { speed: number; frame: number };
type Resolved<T> = Required<Omit<T, keyof ShaderSizingParams | keyof Motion>> &
  Sizing &
  Motion;

const ditheringDefaults: Resolved<DitheringParams> = {
  ...defaultPatternSizing,
  scale: 0.6,
  speed: 1,
  frame: 0,
  colorBack: "#000000",
  colorFront: "#00b2ff",
  shape: "sphere",
  type: "4x4",
  size: 2,
};

const godRaysDefaults: Resolved<GodRaysParams> = {
  ...defaultObjectSizing,
  speed: 0.75,
  frame: 0,
  offsetX: 0,
  offsetY: -0.55,
  colorBack: "#000000",
  colorBloom: "#0000ff",
  colors: ["#a600ff6e", "#6200fff0", "#ffffff", "#33fff5"],
  density: 0.3,
  spotty: 0.3,
  midIntensity: 0.4,
  midSize: 0.2,
  intensity: 0.8,
  bloom: 0.4,
};

const liquidMetalDefaults: Resolved<LiquidMetalParams> = {
  ...defaultObjectSizing,
  scale: 0.6,
  speed: 1,
  frame: 0,
  colorBack: "#AAAAAC",
  colorTint: "#ffffff",
  distortion: 0.07,
  repetition: 2,
  shiftRed: 0.3,
  shiftBlue: 0.3,
  contour: 0.4,
  softness: 0.1,
  angle: 70,
  shape: "diamond",
  image: "",
};

function sizingUniforms(p: Sizing) {
  return {
    u_fit: ShaderFitOptions[p.fit],
    u_scale: p.scale,
    u_rotation: p.rotation,
    u_offsetX: p.offsetX,
    u_offsetY: p.offsetY,
    u_originX: p.originX,
    u_originY: p.originY,
    u_worldWidth: p.worldWidth,
    u_worldHeight: p.worldHeight,
  };
}

/**
 * The JSON is produced by ShaderCanvas.astro from a typed `params` prop, so the
 * shape is guaranteed by the component boundary rather than by validation
 * here.
 */
function overrides<T>(raw: string): Partial<T> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return JSON.parse(raw) as Partial<T>;
}

/**
 * `getShaderNoiseTexture()` hands back a brand new `Image` whose data-URL
 * source has not decoded yet, and ShaderMount throws if it binds an incomplete
 * image. The React bindings re-rendered once it loaded; here we await the
 * decode and memoise the result so every God Rays canvas shares one texture.
 */
let noiseTexture: Promise<HTMLImageElement | undefined> | undefined;

function getNoiseTexture() {
  noiseTexture ??= (async () => {
    const image = getShaderNoiseTexture();
    if (!image) return undefined;
    if (!image.complete) await image.decode();
    return image;
  })();
  return noiseTexture;
}

async function build(
  name: ShaderName,
  raw: string,
): Promise<{ fragmentShader: string; uniforms: ShaderMountUniforms } & Motion> {
  switch (name) {
    case "dithering": {
      const p = { ...ditheringDefaults, ...overrides<DitheringParams>(raw) };
      return {
        fragmentShader: ditheringFragmentShader,
        speed: p.speed,
        frame: p.frame,
        uniforms: {
          u_colorBack: getShaderColorFromString(p.colorBack),
          u_colorFront: getShaderColorFromString(p.colorFront),
          u_shape: DitheringShapes[p.shape],
          u_type: DitheringTypes[p.type],
          u_pxSize: p.size,
          ...sizingUniforms(p),
        },
      };
    }
    case "godRays": {
      const p = { ...godRaysDefaults, ...overrides<GodRaysParams>(raw) };
      return {
        fragmentShader: godRaysFragmentShader,
        speed: p.speed,
        frame: p.frame,
        uniforms: {
          u_colorBloom: getShaderColorFromString(p.colorBloom),
          u_colorBack: getShaderColorFromString(p.colorBack),
          u_colors: p.colors.map((color) => getShaderColorFromString(color)),
          u_colorsCount: p.colors.length,
          u_density: p.density,
          u_spotty: p.spotty,
          u_midIntensity: p.midIntensity,
          u_midSize: p.midSize,
          u_intensity: p.intensity,
          u_bloom: p.bloom,
          u_noiseTexture: await getNoiseTexture(),
          ...sizingUniforms(p),
        },
      };
    }
    case "liquidMetal": {
      const p = {
        ...liquidMetalDefaults,
        ...overrides<LiquidMetalParams>(raw),
      };
      return {
        fragmentShader: liquidMetalFragmentShader,
        speed: p.speed,
        frame: p.frame,
        uniforms: {
          u_colorBack: getShaderColorFromString(p.colorBack),
          u_colorTint: getShaderColorFromString(p.colorTint),
          // The image-driven mode is unused, and the shader only samples
          // u_image inside `u_isImage == true` branches. Leaving the uniform
          // unset means ShaderMount skips binding a texture entirely.
          u_isImage: false,
          u_contour: p.contour,
          u_distortion: p.distortion,
          u_softness: p.softness,
          u_repetition: p.repetition,
          u_shiftRed: p.shiftRed,
          u_shiftBlue: p.shiftBlue,
          u_angle: p.angle,
          u_shape: LiquidMetalShapes[p.shape],
          ...sizingUniforms(p),
        },
      };
    }
    default:
      throw new Error(`Unknown shader: ${String(name)}`);
  }
}

const mounted = new WeakSet<HTMLElement>();

async function mountShader(element: HTMLElement) {
  const name = element.dataset.shader;
  const raw = element.dataset.shaderParams;
  if (mounted.has(element) || !raw) return;
  if (name !== "dithering" && name !== "godRays" && name !== "liquidMetal") {
    return;
  }

  mounted.add(element);

  const { fragmentShader, uniforms, speed, frame } = await build(name, raw);

  // These backgrounds are purely decorative, so honour a reduced-motion
  // preference by rendering a single static frame instead of animating.
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ShaderMount attaches itself to the element and drives its own render loop,
  // so the instance is not needed after construction.
  void new ShaderMount(
    element,
    fragmentShader,
    uniforms,
    undefined,
    prefersReducedMotion ? 0 : speed,
    frame,
  );
}

function mountAll() {
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-shader]",
  )) {
    void mountShader(element);
  }
}

mountAll();
document.addEventListener("astro:page-load", mountAll);
