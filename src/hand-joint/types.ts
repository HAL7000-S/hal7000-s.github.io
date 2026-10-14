export interface Point { x: number; y: number }
export interface Angles { wristAngle: number; mcpAngle: number; pipAngle: number; dipAngle: number }
export interface Calibration { forearm: Point; zero: Angles; wristSign: number; fingerSign: number }
export interface Sample extends Angles { timestamp: number; segment: number }
export type Joint = 'mcpAngle' | 'pipAngle';
