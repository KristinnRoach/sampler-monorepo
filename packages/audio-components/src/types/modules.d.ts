// Type declarations for module imports

// SVG raw imports
declare module '*.svg?raw' {
  const content: string;
  export default content;
}

// GSAP modules
declare module 'gsap/all' {
  export * from 'gsap';
  export const MotionPathPlugin: any;
  export const DrawSVGPlugin: any;
  export const MorphSVGPlugin: any;
  export const CustomEase: any;
}
