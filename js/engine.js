/**
 * AnimationEngine — manages a sequence of step-states and provides
 * controls for navigating through them (play, pause, step, reset).
 *
 * Each "step" is a plain object describing one snapshot of the
 * data structure.  The engine never interprets the step contents;
 * it simply stores them and calls the onStateChange callback
 * whenever the active step changes.
 *
 * Usage:
 *   const engine = new AnimationEngine(renderCallback);
 *   engine.loadSteps(stepsArray);
 *   engine.play();
 */
class AnimationEngine {
  /**
   * @param {function} onStateChange — called with
   *   { step, index, total, isPlaying } on every change.
   */
  constructor(onStateChange) {
    this.steps = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this._timer = null;
    this.speed = 800;          // milliseconds between auto-steps
    this.onStateChange = onStateChange;
  }

  /* ---- Public API ---- */

  /** Replace the current step sequence and jump to step 0. */
  loadSteps(steps) {
    this.pause();
    this.steps = steps;
    this.currentIndex = 0;
    this._notify();
  }

  /** Advance one step forward. Returns true if successful. */
  stepForward() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this._notify();
      return true;
    }
    return false;
  }

  /** Go one step backward. Returns true if successful. */
  stepBackward() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._notify();
      return true;
    }
    return false;
  }

  /** Start auto-playing through steps. */
  play() {
    if (this.isPlaying || this.steps.length === 0) return;
    this.isPlaying = true;
    this._notify();
    this._scheduleNext();
  }

  /** Pause auto-play. */
  pause() {
    this.isPlaying = false;
    clearTimeout(this._timer);
    this._notify();
  }

  /** Pause and jump back to step 0. */
  stop() {
    this.pause();
    this.currentIndex = 0;
    if (this.steps.length > 0) this._notify();
  }

  /** Clear all steps entirely. */
  reset() {
    this.pause();
    this.steps = [];
    this.currentIndex = 0;
    this._notify();
  }

  /** Update the delay between auto-play steps. */
  setSpeed(ms) {
    this.speed = ms;
    if (this.isPlaying) {
      clearTimeout(this._timer);
      this._scheduleNext();
    }
  }

  /** Convenience getter for the current step object (or null). */
  get currentStep() {
    return this.steps[this.currentIndex] || null;
  }

  /* ---- Internals ---- */

  _scheduleNext() {
    this._timer = setTimeout(function () {
      if (this.stepForward()) {
        this._scheduleNext();
      } else {
        this.isPlaying = false;
        this._notify();
      }
    }.bind(this), this.speed);
  }

  _notify() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange({
        step: this.steps[this.currentIndex] || null,
        index: this.currentIndex,
        total: this.steps.length,
        isPlaying: this.isPlaying,
      });
    }
  }
}
