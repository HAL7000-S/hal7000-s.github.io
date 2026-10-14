import type { Angles, Calibration, Point } from './types';
import { signedAngle, subtract } from './kinematics';
export const emptyZero = (): Angles => ({ wristAngle: 0, mcpAngle: 0, pipAngle: 0, dipAngle: 0 });
export function forearmAxis(elbow: Point, wrist: Point): Point | null {
  const axis = subtract(wrist, elbow);
  return Math.hypot(axis.x, axis.y) >= 15 && signedAngle(axis, axis) !== null ? axis : null;
}
export const createCalibration = (): Calibration => ({ forearm: { x: 0, y: 0 }, zero: emptyZero(), wristSign: 1, fingerSign: 1 });
