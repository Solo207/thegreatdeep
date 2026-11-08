const TTL_MS = 5 * 60_000; // a fetched list is reused for up to 5 minutes
const MIN_AGE_MS = 30_000; // opening the page again within 30 s doesn't ask n8n again
const CONCURRENCY = 3; // how many subjects are asked at the same time
const MAX_SUBJECTS = 40;

const clone = (v) => JSON.parse(JSON.stringify(v));

export function makeCachedLoader(load) {
  const cache = new Map(); // subject -> { at, promise }

  const fetchNow = (subject) => {
    const entry = { at: Date.now(), promise: load(subject) };
    cache.set(subject, entry);
    entry.promise.catch(() => {
      if (cache.get(subject) === entry) cache.delete(subject); // a failure is never kept
    });
    return entry.promise;
  };

  return {
    /** What the slide-in page calls: instant when it was already fetched. */
    get(subject) {
      const e = cache.get(subject);
      const promise = e && Date.now() - e.at < TTL_MS ? e.promise : fetchNow(subject);
      return promise.then(clone);
    },
    /** Warm-up: asks n8n unless it was asked a moment ago. */
    prefetch(subject) {
      const e = cache.get(subject);
      return e && Date.now() - e.at < MIN_AGE_MS ? e.promise : fetchNow(subject);
    },
    clear: () => cache.clear(),
  };
}

/** Asks for every subject's questions in the background, the opened subject first. */
export async function prefetchAll(loader, subjects, first, shouldStop = () => false) {
  const order = (first ? [first, ...subjects.filter((s) => s !== first)] : subjects).slice(0, MAX_SUBJECTS);
  let next = 0;
  const worker = async () => {
    while (next < order.length && !shouldStop()) {
      await loader.prefetch(order[next++]).catch(() => {});
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}