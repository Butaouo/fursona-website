import { useEffect, useRef } from 'react';
type DeviceNavigator = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
export function Background({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    const nav = navigator as DeviceNavigator;
    if (!canvas || !ctx || !enabled) return;
    const low = (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4 || nav.connection?.saveData;
    document.documentElement.dataset.quality = low ? 'low' : 'high';
    if (nav.connection?.saveData) return;
    let width = 0, height = 0, raf = 0, last = 0, samples = 0, slow = 0, visible = !document.hidden;
    const particles = Array.from({ length: low ? 8 : matchMedia('(pointer: coarse)').matches ? 12 : 28 }, (_, i) => ({
      x: (i * 0.61803398875) % 1, y: (i * 0.38196601125 + 0.15) % 1, r: 0.7 + (i % 3) * 0.45, speed: 0.006 + (i % 5) * 0.0015,
    }));
    const resize = () => {
      width = innerWidth; height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, low ? 1 : 1.5);
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (time: number) => {
      if (!visible) return;
      const delta = last ? Math.min((time - last) / 1000, 0.05) : 0;
      if (last && ++samples < 180 && time - last > 28) slow++;
      if (samples === 180 && slow > 65) { particles.length = Math.min(8, particles.length); document.documentElement.dataset.quality = 'low'; }
      last = time;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = document.documentElement.dataset.theme === 'dark' ? 'rgba(244,187,78,0.40)' : 'rgba(159,105,29,0.32)';
      for (const p of particles) {
        p.y -= p.speed * delta; if (p.y < -0.02) p.y = 1.02;
        const sway = Math.sin(time * 0.0002 + p.x * 6) * 13;
        ctx.beginPath(); ctx.arc(p.x * width + sway, p.y * height, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const onVisibility = () => {
      visible = !document.hidden; cancelAnimationFrame(raf); last = 0;
      document.documentElement.dataset.visibility = visible ? 'visible' : 'hidden';
      if (visible) raf = requestAnimationFrame(draw);
    };
    resize(); raf = requestAnimationFrame(draw);
    addEventListener('resize', resize); document.addEventListener('visibilitychange', onVisibility);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, width, height); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVisibility); };
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${(e.clientX / innerWidth - 0.5) * 18}px`);
        document.documentElement.style.setProperty('--pointer-y', `${(e.clientY / innerHeight - 0.5) * 12}px`);
      });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(raf); document.documentElement.style.setProperty('--pointer-x', '0px'); document.documentElement.style.setProperty('--pointer-y', '0px'); };
  }, [enabled]);
  return <div className="ambient" aria-hidden="true"><div className="ambient-orb orb-one" /><div className="ambient-orb orb-two" /><div className="ambient-orb orb-three" /><div className="ambient-grain" /><canvas ref={canvasRef} /></div>;
}
