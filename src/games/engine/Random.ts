export class Random {
  private value: number;
  constructor(seed: number) { this.value = seed >>> 0; }
  next(): number {
    this.value += 0x6D2B79F5;
    let t = this.value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  pick<T>(items: readonly T[]): T { return items[Math.floor(this.next() * items.length)]; }
}
