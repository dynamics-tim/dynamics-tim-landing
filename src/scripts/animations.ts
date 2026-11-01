/**
 * Site-wide scroll effects (loaded by BaseLayout):
 *  - `.animate-on-scroll` / `.animate-scale-up` → adds `.animate-in` when visible
 *  - `[data-counter]` → counts numbers up when visible ("10+", "Ø 3", "4,5")
 *  - thin scroll progress bar at the top of the page
 *
 * The `[data-reveal]` fade-ins are handled separately by public/assets/js/reveal.js.
 */

const COUNTER_DURATION_MS = 1200;
const isMobile = window.innerWidth < 768;

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    },
    {
      threshold: isMobile ? 0.01 : 0.12,
      rootMargin: isMobile ? '0px 0px -10px 0px' : '0px 0px -40px 0px',
    }
  );
  document
    .querySelectorAll('.animate-on-scroll, .animate-scale-up')
    .forEach((el) => observer.observe(el));
}

/** Animate e.g. "Ø 3" from "Ø 0" to "Ø 3"; keeps prefix/suffix and German decimal comma. */
function animateCounter(el: HTMLElement, target: string) {
  const targetNum = parseFloat(target.replace(/[^\d.,]/g, '').replace(',', '.'));
  if (isNaN(targetNum) || targetNum === 0) {
    el.textContent = target;
    return;
  }
  const isDecimal = target.includes(',') || target.includes('.');
  const prefix = target.match(/^[^\d]*/)?.[0] || '';
  const suffix = target.match(/[\d.,][^\d.,]*$/)?.[0]?.replace(/[\d.,]/g, '') || '';
  const start = performance.now();

  const update = (now: number) => {
    const progress = Math.min((now - start) / COUNTER_DURATION_MS, 1);
    const current = targetNum * (1 - Math.pow(1 - progress, 3)); // ease-out cubic
    const formatted = isDecimal
      ? current.toFixed(1).replace('.', ',')
      : String(Math.round(current));
    el.textContent = prefix + formatted + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        animateCounter(el, el.dataset.counterTarget || el.textContent || '0');
        counterObserver.unobserve(el);
      }
    },
    { threshold: isMobile ? 0.1 : 0.5 }
  );
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    el.dataset.counterTarget = el.textContent || '';
    counterObserver.observe(el);
  });
}

function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const updateProgress = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${docHeight > 0 ? window.scrollY / docHeight : 0})`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

initScrollAnimations();
initCounters();
initScrollProgress();
