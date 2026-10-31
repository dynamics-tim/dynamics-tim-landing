/**
 * Playback control for components/PitchVideo.astro.
 * Respects prefers-reduced-motion and Save-Data, pauses off-screen, and never
 * restarts a video the visitor paused on purpose.
 */

interface NetworkInformationLike {
  saveData?: boolean;
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = Boolean(
  (navigator as Navigator & { connection?: NetworkInformationLike }).connection?.saveData
);
const mayAutoplay = !prefersReducedMotion && !saveData;

document.querySelectorAll<HTMLElement>('[data-pitch-video]').forEach((root) => {
  const video = root.querySelector<HTMLVideoElement>('[data-video]');
  const overlay = root.querySelector<HTMLButtonElement>('[data-play-overlay]');
  const playToggle = root.querySelector<HTMLButtonElement>('[data-toggle-play]');
  const soundToggle = root.querySelector<HTMLButtonElement>('[data-toggle-sound]');
  if (!video || !overlay || !playToggle || !soundToggle) return;

  const soundLabel = soundToggle.querySelector<HTMLElement>('[data-sound-label]');
  const iconOn = soundToggle.querySelector<HTMLElement>('[data-sound-icon-on]');
  const iconOff = soundToggle.querySelector<HTMLElement>('[data-sound-icon-off]');
  const pauseIcon = playToggle.querySelector<HTMLElement>('[data-icon-pause]');
  const playIcon = playToggle.querySelector<HTMLElement>('[data-icon-play]');

  let pausedByUser = !mayAutoplay;
  let visible = false;

  const render = () => {
    const playing = !video.paused && !video.ended;
    overlay.dataset.hidden = String(playing);
    playToggle.setAttribute('aria-label', playing ? 'Video pausieren' : 'Video abspielen');
    pauseIcon?.classList.toggle('hidden', !playing);
    playIcon?.classList.toggle('hidden', playing);
    soundToggle.setAttribute('aria-pressed', String(!video.muted));
    if (soundLabel) soundLabel.textContent = video.muted ? 'Ton an' : 'Ton aus';
    iconOn?.classList.toggle('hidden', video.muted);
    iconOff?.classList.toggle('hidden', !video.muted);
  };

  const play = () => {
    video.play().catch(() => {
      // Autoplay blocked (e.g. low-power mode) — show the play button instead
      pausedByUser = true;
      render();
    });
  };

  const userPlay = () => {
    pausedByUser = false;
    play();
  };

  overlay.addEventListener('click', userPlay);
  playToggle.addEventListener('click', () => {
    if (video.paused) userPlay();
    else {
      pausedByUser = true;
      video.pause();
    }
  });
  soundToggle.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted && video.paused) userPlay();
    render();
  });
  video.addEventListener('play', render);
  video.addEventListener('pause', render);
  video.addEventListener('volumechange', render);

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !pausedByUser) play();
      if (!visible && !video.paused) video.pause();
    },
    { threshold: 0.4 }
  ).observe(video);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (visible && !pausedByUser) play();
  });

  render();
});
