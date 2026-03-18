export class TimeControls {
  static BASE_TIME_SCALE = 0.4;

  constructor() {
    globalThis.gameSpeed = 1;
    this.day = 1;
    this.dayClock = 0;
  }

  get gameSpeed() {
    return globalThis.gameSpeed ?? 1;
  }

  set gameSpeed(speed) {
    globalThis.gameSpeed = speed;
  }

  get isPaused() {
    return this.gameSpeed === 0;
  }

  get speedMultiplier() {
    return this.gameSpeed;
  }

  setSpeed(speed) {
    globalThis.gameSpeed = [0, 1, 2, 3].includes(speed) ? speed : 1;
  }

  tick(realDt) {
    const simDt = realDt * TimeControls.BASE_TIME_SCALE * this.gameSpeed;
    this.dayClock += simDt;
    while (this.dayClock >= 75) {
      this.dayClock -= 75;
      this.day += 1;
    }
    return simDt;
  }

  label() {
    return this.isPaused ? 'Paused' : `${this.gameSpeed}x Speed`;
  }
}
