import { useEffect, useRef } from 'react';

// Browser-Back support for single-route, multi-step wizards (Onboarding, Signup,
// Child/Parent setup). Each time the wizard ADVANCES it pushes one history frame;
// a browser Back press is then converted into a single in-app step-back
// (preserving all component state — selections, fields, PIN values). On the FIRST
// step, Back is allowed to fall through to the previous route naturally.
//
// It never calls pushState inside the popstate handler, so history can only
// shrink on Back — the user can never be trapped.
//
//   step      — current step value
//   firstStep — the lowest step (Back falls through to the previous route here)
//   goBack    — the component's own "go to previous step" handler (state-safe)
export function useStepHistory(step, firstStep, goBack) {
  const stepRef = useRef(step);
  const firstRef = useRef(firstStep);
  const backRef = useRef(goBack);
  const prevRef = useRef(step);
  stepRef.current = step;
  firstRef.current = firstStep;
  backRef.current = goBack;

  // Push a frame whenever we move forward, so a Back has something to consume.
  useEffect(() => {
    if (step > prevRef.current) window.history.pushState({ agStep: step }, '');
    prevRef.current = step;
  }, [step]);

  // Convert Back into a step-back until we're on the first step.
  useEffect(() => {
    const onPop = () => { if (stepRef.current > firstRef.current) backRef.current(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
