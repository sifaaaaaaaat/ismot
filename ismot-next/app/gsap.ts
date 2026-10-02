import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Register all plugins in one place so they survive tree-shaking
 * (see https://gsap.com/docs/v3/Installation/ — FAQ: registerPlugin).
 *
 * Import gsap / ScrollTrigger / useGSAP from this file everywhere else:
 *
 *   import { gsap, ScrollTrigger, useGSAP } from "@/app/gsap";
 */
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
