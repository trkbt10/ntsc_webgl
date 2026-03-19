/**
 * Compute a 1D Gaussian kernel for approximating cascaded IIR lowpass filters.
 *
 * The IIR-to-Gaussian equivalence: a 3-stage cascaded first-order IIR with
 * parameter alpha is well approximated by a Gaussian with
 *   sigma = sqrt(3) * (1 - alpha) / alpha
 */

/** Maximum kernel radius (half-width). Covers all cases at MAX_DIM=640. */
export const MAX_KERNEL_RADIUS = 24;

export interface GaussianKernel {
  /** Symmetric weights: weights[0] is center, weights[i] is offset +-i. */
  weights: Float32Array;
  /** Effective radius (number of taps on each side of center). */
  radius: number;
}

/**
 * Compute a normalized symmetric Gaussian kernel.
 *
 * @param sigma   Standard deviation in pixels. If <= 0, returns a delta kernel.
 * @param maxRadius  Maximum allowed radius (default MAX_KERNEL_RADIUS).
 */
export function computeGaussianKernel(
  sigma: number,
  maxRadius = MAX_KERNEL_RADIUS,
): GaussianKernel {
  if (sigma <= 0) {
    const weights = new Float32Array(maxRadius + 1);
    weights[0] = 1;
    return { weights, radius: 0 };
  }

  const radius = Math.min(Math.ceil(sigma * 3), maxRadius);
  const weights = new Float32Array(maxRadius + 1);
  const twoSigmaSq = 2 * sigma * sigma;

  let sum = 0;
  for (let i = 0; i <= radius; i++) {
    const w = Math.exp(-(i * i) / twoSigmaSq);
    weights[i] = w;
    sum += i === 0 ? w : 2 * w;
  }
  // Normalize
  for (let i = 0; i <= radius; i++) {
    weights[i] /= sum;
  }

  return { weights, radius };
}

/**
 * Compute sigma from IIR alpha parameter.
 * Three cascaded first-order IIR stages with alpha ≈ Gaussian with this sigma.
 */
export function iiAlphaToSigma(alpha: number): number {
  if (alpha <= 0 || alpha >= 1) return 0;
  return Math.sqrt(3) * (1 - alpha) / alpha;
}

/**
 * Compute IIR alpha from cutoff frequency and sample rate.
 */
export function cutoffToAlpha(cutoffHz: number, sampleRateHz: number): number {
  return 1 - Math.exp((-2 * Math.PI * cutoffHz) / sampleRateHz);
}

// ---- Preset sigma values at reference width 640 ----

const REF_WIDTH = 640;

/** I channel input lowpass (1.3 MHz bandwidth) */
const SIGMA_I_IN = 5;
/** Q channel input lowpass (600 kHz bandwidth) */
const SIGMA_Q_IN = 11;
/** Output chroma lowpass (2.6 MHz bandwidth) */
const SIGMA_CHROMA_OUT = 2;
/** VHS luma lowpass (2.4 MHz SP) */
const SIGMA_VHS_LUMA = 2.5;
/** VHS chroma lowpass */
const SIGMA_VHS_CHROMA = 4;

function scaledSigma(baseSigma: number, width: number): number {
  return baseSigma * width / REF_WIDTH;
}

export function getInputLowpassKernels(width: number) {
  return {
    kernelI: computeGaussianKernel(scaledSigma(SIGMA_I_IN, width)),
    kernelQ: computeGaussianKernel(scaledSigma(SIGMA_Q_IN, width)),
  };
}

export function getOutputChromaKernel(width: number) {
  return computeGaussianKernel(scaledSigma(SIGMA_CHROMA_OUT, width));
}

export function getVhsLumaKernel(width: number) {
  return computeGaussianKernel(scaledSigma(SIGMA_VHS_LUMA, width));
}

export function getVhsChromaKernel(width: number) {
  return computeGaussianKernel(scaledSigma(SIGMA_VHS_CHROMA, width));
}
