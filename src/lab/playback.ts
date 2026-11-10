import type { Chapter } from "./contracts.ts";

export function chapterAt(chapters: readonly Chapter[], time: number): number {
  return Math.max(
    0,
    chapters.findLastIndex((chapter) => chapter.at <= time),
  );
}

/** A clock-free transport: rendering, tests and seeking use the same timeline. */
export class Playback {
  readonly duration: number;
  private position = 0;
  private active = false;
  private speed = 1;
  loop = false;

  constructor(duration: number) {
    if (!Number.isFinite(duration) || duration <= 0)
      throw new Error("Invalid duration");
    this.duration = duration;
  }

  get time(): number {
    return this.position;
  }
  get playing(): boolean {
    return this.active;
  }
  get rate(): number {
    return this.speed;
  }

  play(): void {
    if (this.position >= this.duration) this.position = 0;
    this.active = true;
  }

  pause(): void {
    this.active = false;
  }
  reset(): void {
    this.pause();
    this.position = 0;
  }

  setRate(rate: number): void {
    if (![0.25, 0.5, 1, 2].includes(rate)) throw new Error("Invalid rate");
    this.speed = rate;
  }

  seek(time: number): void {
    if (!Number.isFinite(time)) throw new Error("Invalid time");
    this.position = Math.max(0, Math.min(this.duration, time));
  }

  advance(delta: number): void {
    if (!Number.isFinite(delta) || delta < 0) throw new Error("Invalid delta");
    if (!this.active) return;
    const next = this.position + delta * this.speed;
    if (this.loop) this.position = next % this.duration;
    else {
      this.position = Math.min(this.duration, next);
      if (next >= this.duration) this.pause();
    }
  }

  step(chapters: readonly Chapter[], direction: -1 | 1): void {
    this.pause();
    const index = chapterAt(chapters, this.position);
    this.seek(
      chapters[Math.max(0, Math.min(chapters.length - 1, index + direction))]
        .at,
    );
  }
}
