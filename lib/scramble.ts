import gsap from 'gsap';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?';

// Animate `finalText` into `el` by filling the container with random chars and
// progressively locking each character in from left to right. Spaces and
// newlines are preserved to maintain layout.
export function scrambleReveal(
  el: HTMLElement,
  finalText: string,
  duration: number,
  delay: number = 0
) {
  const length = finalText.length;
  const progress = { value: 0 };
  const initial = Array.from({ length }, (_, i) => {
    const c = finalText[i];
    return c === ' ' || c === '\n' ? c : CHARS[Math.floor(Math.random() * CHARS.length)];
  }).join('');
  el.textContent = initial;

  gsap.to(progress, {
    value: 1,
    duration,
    delay,
    ease: 'power2.inOut',
    onUpdate: () => {
      const revealed = Math.floor(progress.value * length);
      let result = '';
      for (let i = 0; i < length; i++) {
        const c = finalText[i];
        if (c === ' ' || c === '\n') result += c;
        else if (i < revealed) result += c;
        else result += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = result;
    },
  });
}
