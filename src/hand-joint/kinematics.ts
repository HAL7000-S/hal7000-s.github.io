import type { Angles, Calibration, Point } from './types';
export const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export function signedAngle(u: Point, v: Point): number | null {
  if (![u.x, u.y, v.x, v.y].every(Number.isFinite) || Math.hypot(u.x, u.y) < 1e-6 || Math.hypot(v.x, v.y) < 1e-6) return null;
  return Math.atan2(u.x * v.y - u.y * v.x, u.x * v.x + u.y * v.y) * 180 / Math.PI;
}
export function wrapDegrees(value: number): number { return ((value + 180) % 360 + 360) % 360 - 180; }
export function rawAngles(landmarks: readonly Point[], width: number, height: number, forearm: Point): Angles | null {
  if (landmarks.length !== 21 || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || landmarks.some(p => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;
  const points = landmarks.map(p => ({ x: p.x * width, y: p.y * height }));
  const h = subtract(points[5], points[0]), a = subtract(points[6], points[5]), b = subtract(points[7], points[6]), c = subtract(points[8], points[7]);
  const values = [signedAngle(forearm, h), signedAngle(h, a), signedAngle(a, b), signedAngle(b, c)];
  if (values.some(v => v === null)) return null;
  return { wristAngle: values[0]!, mcpAngle: values[1]!, pipAngle: values[2]!, dipAngle: values[3]! };
}
export function calibratedAngles(raw: Angles, calibration: Calibration): Angles {
  return { wristAngle: wrapDegrees(raw.wristAngle - calibration.zero.wristAngle) * calibration.wristSign,
    mcpAngle: wrapDegrees(raw.mcpAngle - calibration.zero.mcpAngle) * calibration.fingerSign,
    pipAngle: wrapDegrees(raw.pipAngle - calibration.zero.pipAngle) * calibration.fingerSign,
    dipAngle: wrapDegrees(raw.dipAngle - calibration.zero.dipAngle) * calibration.fingerSign };
}
