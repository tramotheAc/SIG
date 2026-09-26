/**
 * Animations d'interface (Anime.js) : courtes, sobres, désactivées si l'utilisateur a demandé
 * la réduction des animations dans son système (prefers-reduced-motion).
 */
import { animate, stagger, type JSAnimation } from 'animejs';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Durées de référence (ms). */
export const DUR = { fast: 180, base: 280, slow: 420 } as const;
export const EASE = 'outCubic';

function dur(ms: number) {
  return reducedMotion() ? 0 : ms;
}

/** Dépliage d'un bloc : hauteur 0 → naturelle, puis contenu en cascade. */
export function expand(el: HTMLElement, onDone?: () => void): JSAnimation {
  const h = el.scrollHeight;
  el.style.overflow = 'hidden';
  const a = animate(el, {
    height: [0, h],
    opacity: [0, 1],
    duration: dur(DUR.base),
    ease: EASE,
    onComplete: () => {
      el.style.height = '';
      el.style.overflow = '';
      onDone?.();
    },
  });
  const kids = [...el.children] as HTMLElement[];
  if (kids.length && !reducedMotion()) animate(kids, { opacity: [0, 1], translateY: [6, 0], duration: DUR.base, delay: stagger(25, { start: 60 }), ease: EASE });
  return a;
}

/** Repliage d'un bloc : hauteur naturelle → 0. */
export function collapse(el: HTMLElement, onDone?: () => void): JSAnimation {
  el.style.overflow = 'hidden';
  return animate(el, {
    height: [el.scrollHeight, 0],
    opacity: [1, 0],
    duration: dur(DUR.fast + 40),
    ease: 'inOutQuad',
    onComplete: () => onDone?.(),
  });
}

/** Apparition d'une fenêtre ou d'un panneau : fondu + léger zoom / glissement. */
export function popIn(el: HTMLElement, from: 'scale' | 'right' | 'up' = 'scale') {
  const params: Record<string, number[]> =
    from === 'scale' ? { opacity: [0, 1], scale: [0.97, 1] } : from === 'right' ? { opacity: [0, 1], translateX: [24, 0] } : { opacity: [0, 1], translateY: [12, 0] };
  return animate(el, { ...params, duration: dur(DUR.base), ease: EASE });
}

/** Cascade d'apparition d'éléments (listes, blocs d'une fiche). */
export function cascade(els: Element[] | NodeListOf<Element>, step = 22) {
  const list = [...els] as HTMLElement[];
  if (!list.length || reducedMotion()) return;
  animate(list, { opacity: [0, 1], translateY: [8, 0], duration: DUR.base, delay: stagger(step), ease: EASE });
}

/** Comptage animé d'un nombre (chiffres clés). */
export function countTo(from: number, to: number, onUpdate: (v: number) => void) {
  if (reducedMotion() || from === to) return onUpdate(to);
  const o = { v: from };
  return animate(o, { v: to, duration: DUR.slow + 180, ease: 'outExpo', onUpdate: () => onUpdate(Math.round(o.v)) });
}

/** Tween d'une valeur 0 → 1 (animations de la carte). */
export function tween(onUpdate: (t: number) => void, duration: number = DUR.slow, ease = EASE) {
  if (reducedMotion()) return onUpdate(1);
  const o = { t: 0 };
  return animate(o, { t: 1, duration, ease, onUpdate: () => onUpdate(o.t) });
}


/** Apparition animée d'un élément au montage. */
export function usePopIn<T extends HTMLElement>(ref: RefObject<T | null>, from: 'scale' | 'right' | 'up' = 'scale') {
  useLayoutEffect(() => {
    if (ref.current) popIn(ref.current, from);
  }, [ref, from]);
}

/** Nombre qui s'anime vers sa nouvelle valeur. */
export function useAnimatedNumber(value: number | undefined): number | undefined {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === undefined) return setShown(undefined);
    const from = prev.current ?? 0;
    prev.current = value;
    const a = countTo(from, value, setShown);
    return () => {
      a?.pause();
    };
  }, [value]);
  return shown;
}
