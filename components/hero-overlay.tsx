'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { WorkLink } from './work-preview';
import { ExperimentsLink } from './experiments-preview';

interface HeroOverlayProps {
  accentColor: string;
  toolbarColor?: string;
}

function JoyLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 763 481" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M444.073 10.4057L443.475 10.3897C445.43 16.001 448.693 21.9 453.265 28.0869C457.85 33.7687 463.487 39.4787 470.176 45.217C476.358 51.0326 485.223 58.4153 496.772 67.365C498.652 68.8218 500.602 70.3201 502.624 71.8599C517.594 82.8737 525.855 88.9067 527.406 89.959C520.331 93.9935 513.09 98.2687 505.684 102.785C491.824 111.235 477.382 120.529 462.359 130.665C446.736 141.463 515.136 151.464 532.049 160.669C535.599 162.601 536.881 164.498 534.642 166.36L460.875 168.301C458.009 169.279 530.417 171.689 527.612 172.93L479.646 210.263L417.878 258.339C475.604 264.94 520.056 285.587 551.236 320.282C582.955 354.486 592.904 395.686 581.085 443.884L671.821 446.316L762.331 74.2733L676.633 60.6056L608.529 333.188C604.526 305.792 594.642 281.775 578.877 261.138C563.652 240.011 543.308 223.294 517.845 210.988C526.451 204.144 535.845 197.321 546.029 190.519C556.226 183.212 583.526 166.256 627.929 139.652C609.534 118.944 593.527 97.543 579.907 75.4476C566.826 52.8613 558.169 32.1623 553.936 13.3506L444.073 10.4057Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M532.861 344.824C522.099 333.923 509.091 328.268 493.836 327.859C479.108 327.464 465.816 332.414 453.959 342.709C442.629 353.018 436.768 365.494 436.375 380.139C435.982 394.784 441.167 407.557 451.929 418.458C462.691 429.359 475.699 435.014 490.953 435.423C506.207 435.832 519.5 430.882 530.83 420.573C542.16 410.264 548.022 397.787 548.415 383.142C548.807 368.498 543.622 355.725 532.861 344.824Z" fill="currentColor"/>
      <path d="M367.485 451.618C374.348 470.5 383.565 480.097 395.138 480.407C401.976 480.59 408.619 478.241 415.066 473.361C422.026 468.999 426.922 463.066 429.755 455.561C423.12 447.803 418.097 438.825 414.686 428.626C411.288 417.923 409.765 406.006 410.117 392.876C411.363 346.417 424.436 300.527 449.338 255.207C458.856 237.703 468.958 222.722 479.646 210.263C494.504 192.943 510.492 180.499 527.612 172.93L527.549 172.404C529.803 170.432 532.167 168.418 534.642 166.36L532.049 160.669L505.684 102.785L496.772 67.365L495.875 63.8009C462.359 83.3009 430.567 81.6197 404.565 69.8049C379.088 58.0042 359.406 36.2516 345.517 4.54719L175.879 -2.17982e-05C154.851 18.6398 138.509 39.174 126.853 61.6026C115.724 84.0453 109.821 107.892 109.144 133.141C108.264 165.966 118.782 195.811 140.696 222.677C163.136 249.557 187.507 263.35 213.807 264.054C232.217 264.548 247.546 262.179 259.793 256.949C272.58 251.227 285.198 241.964 297.648 229.158C303.136 240.423 304.106 253.336 300.558 267.896C297.023 281.951 289.597 293.881 278.28 303.684C269.121 311.525 257.643 317.534 243.845 321.712C230.586 325.4 215.541 327.018 198.709 326.567C152.946 325.34 117.327 308.972 91.8528 277.462C66.3781 245.953 54.3718 202.928 55.8337 148.389C56.1722 135.764 57.023 123.658 58.3864 112.072C60.2893 99.9942 62.9812 87.9378 66.4621 75.9026C61.351 70.2066 56.4622 66.0327 51.7958 63.3809C47.1294 60.729 41.6402 59.3185 35.3281 59.1493C24.2819 58.8532 15.7711 62.1625 9.79548 69.0773C3.81989 75.9921 0.64935 86.2669 0.283861 99.9018C-2.38285 199.385 13.6798 277.641 48.4717 334.668C83.2636 391.695 134.324 421.111 201.653 422.916C244.26 424.058 278.378 408.043 304.007 374.871C330.162 341.713 343.944 298.875 345.351 246.356C346.015 221.611 342.193 197.251 333.888 173.277C326.108 149.317 314.834 128.042 300.067 109.454C286.821 132.345 269.757 150.333 248.877 163.418C228.524 176.517 208.879 182.813 189.942 182.305C180.474 182.051 173.434 179.589 168.822 174.917C164.21 170.245 162.032 163.111 162.289 153.517C162.831 133.317 175.774 111.934 201.119 89.3666C227.004 66.3087 259.888 47.2286 299.771 32.1263C310.936 67.2951 327.778 96.8046 350.3 120.655C373.348 144.519 398.73 159.855 426.445 166.662C405.268 190.857 388.932 220.993 377.437 257.07C366.482 292.657 360.381 333.68 359.136 380.139C358.351 409.429 361.134 433.255 367.485 451.618Z" fill="currentColor"/>
      <path d="M532.049 160.669C535.599 162.601 536.881 164.498 534.642 166.36L532.049 160.669Z" fill="currentColor"/>
      <path d="M527.612 172.93L479.646 210.263C494.504 192.943 510.492 180.499 527.612 172.93Z" fill="currentColor"/>
      <path d="M527.406 89.959C525.855 88.9067 517.594 82.8737 502.624 71.8599C500.602 70.3201 498.652 68.8218 496.772 67.365L505.684 102.785C513.09 98.2687 520.331 93.9935 527.406 89.959Z" fill="currentColor"/>
    </svg>
  );
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?';

function scrambleReveal(el: HTMLElement, finalText: string, duration: number, delay: number) {
  const length = finalText.length;
  const progress = { value: 0 };
  // Start with random chars
  el.textContent = Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

  gsap.to(progress, {
    value: 1,
    duration,
    delay,
    ease: 'power2.inOut',
    onUpdate: () => {
      const revealed = Math.floor(progress.value * length);
      let result = '';
      for (let i = 0; i < length; i++) {
        if (finalText[i] === ' ') {
          result += ' ';
        } else if (i < revealed) {
          result += finalText[i];
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      el.textContent = result;
    },
  });
}

const GREETINGS = [
  'h3Ll0 w0rLd',
  'l1v3 l0ng',
  'stay fr0sty',
  'w4ke up ne0',
  'g00d hunt1ng',
  'op3n th3 p0d',
  'i am gr00t',
  'h3llo th3re',
  'b3am m3 up',
  'n3ver m0re',
  'do 0r d0nt',
  't0 1nfinity',
  'r3s1st4nce',
  'trust n0 0ne',
  'g0 b3y0nd',
];

const HERO_LINES = ['th1s i5', 'j0y', 'pr0duct', 'd3signer'];

export function HeroOverlay({ accentColor, toolbarColor }: HeroOverlayProps) {
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const picked = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setGreeting(picked);

    const allLines = [picked, ...HERO_LINES];
    lineRefs.current.forEach((el, i) => {
      if (el) {
        scrambleReveal(el, allLines[i], 1.2, i * 0.3);
      }
    });
  }, []);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-1000 ease-in-out"
          style={{ backgroundColor: toolbarColor || 'rgba(15, 15, 18, 0.9)' }}
        >
          <JoyLogo
            className="w-9 h-9 transition-colors duration-1000 ease-in-out"
            style={{ color: accentColor } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Hero Text */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative text-center">
          {/* Accent Bar */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 rounded-full transition-colors duration-1000 ease-in-out"
            style={{
              backgroundColor: accentColor,
              height: '110%',
              opacity: 0.85,
            }}
          />

          {/* Text — each line scrambles in on load */}
          <div className="relative z-10 font-heading text-white space-y-1">
            {[greeting, ...HERO_LINES].map((line, i) => (
              <p
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className="text-3xl md:text-7xl lg:text-8xl font-light tracking-wide"
                suppressHydrationWarning
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Text — hidden on mobile (shown below fold instead) */}
      <div className="hidden md:flex px-8 pb-4 gap-12 max-w-4xl pointer-events-auto">
        <p className="text-base font-sans text-white/60 leading-relaxed">
          A dry, observant, tool-pilled in a practical way, and just self-aware enough to admit he&apos;s become the sort of product designer who tells people what&apos;s wrong with their apps on dinner party.
        </p>
        <span className="text-base font-sans text-white/60 leading-relaxed block">
          This site is perpetually half-built — no case studies, no past-work gallery, mostly because things are moving faster than any of us can keep up with, and he&apos;s made peace with being the sort of designer who&apos;s always a quarter behind her own work. Some of it lives <WorkLink /> and some experiments are <ExperimentsLink />.
        </span>
      </div>

      {/* Footer — desktop */}
      <div className="hidden md:block px-8 pb-6 text-center pointer-events-none" style={{ textWrap: 'balance' } as React.CSSProperties}>
        <p className="text-xs font-sans text-white/20 leading-relaxed">
          Folio of Joy is always work in progress because learning and building never stops. Joydeep Sengupta &copy; 2077. K&oslash;benhavn, Danmark.
        </p>
      </div>
    </div>
  );
}
