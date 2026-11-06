import { AsyncLocalStorage } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';

export const requestTiming = new AsyncLocalStorage();

// Labels are fixed in source; never pass user input or query contents here.
export const recordTimingState = (name, value) => {
  const context = requestTiming.getStore();
  if (context) context.states[name] = value;
};

export async function measureRequestStep(name, work) {
  const context = requestTiming.getStore();
  if (!context) return work();
  const start = performance.now();
  try {
    return await work();
  } finally {
    const entry = context.steps[name] ?? { count: 0, totalMs: 0 };
    entry.count += 1;
    entry.totalMs =
      Math.round((entry.totalMs + performance.now() - start) * 100) / 100;
    context.steps[name] = entry;
  }
}
