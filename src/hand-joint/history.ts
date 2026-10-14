import type { Angles, Sample } from './types';
export class History {
  samples: Sample[] = [];
  segment = 0;
  revision = 0;
  constructor(readonly limit = 6000) {}
  gap(): void { this.segment++; }
  clear(): void { this.samples = []; this.gap(); this.revision++; }
  add(angles: Angles, timestamp: number): void {
    if (![timestamp, ...Object.values(angles)].every(Number.isFinite)) { this.gap(); return; }
    this.samples.push({ ...angles, timestamp, segment: this.segment });
    if (this.samples.length > this.limit) this.samples.splice(0, this.samples.length - this.limit);
    this.revision++;
  }
}
