export class TimeControls {
  constructor() {
    this.state = 'play';
    this.day = 1;
    this.dayClock = 0;
  }

  get speedMultiplier() {
    if (this.state === 'pause') return 0;
    if (this.state === 'fast') return 2.4;
    return 1;
  }

  setState(state) {
    this.state = state;
  }

  tick(realDt) {
    const simDt = realDt * this.speedMultiplier;
    this.dayClock += simDt;
    while (this.dayClock >= 60) {
      this.dayClock -= 60;
      this.day += 1;
    }
    return simDt;
  }

  label() {
    if (this.state === 'pause') return 'Paused';
    if (this.state === 'fast') return 'Fast Forward';
    return 'Normal Speed';
  }
}
