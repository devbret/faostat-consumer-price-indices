export function createPlayback({
  getPlaylist,
  getCurrent,
  apply,
  onStateChange,
}) {
  let timer = null;
  let delay = 1200;
  let playing = false;

  function step(direction) {
    const list = getPlaylist();
    if (!list.length) return;
    const i = list.indexOf(getCurrent());
    const next = i === -1 ? 0 : (i + direction + list.length) % list.length;
    apply(list[next]);
  }

  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      step(1);
      schedule();
    }, delay);
  }

  return {
    toggle() {
      playing = !playing;
      if (playing) step(1);
      schedule();
      onStateChange(playing);
    },
    stop() {
      playing = false;
      clearTimeout(timer);
      onStateChange(playing);
      const list = getPlaylist();
      if (list.length && getCurrent() !== list[0]) apply(list[0]);
    },
    next() {
      step(1);
      schedule();
    },
    prev() {
      step(-1);
      schedule();
    },
    setDelay(ms) {
      delay = ms;
      schedule();
    },
    isPlaying() {
      return playing;
    },
  };
}
