import translationService from './translationService';

const DEBOUNCE_MS = 50;
const MAX_CONCURRENT = 2;

class TranslationBatchQueue {
  constructor() {
    this.pending = new Map();
    this.flushTimer = null;
  }

  enqueue(text, targetLang, sourceLang = 'en') {
    const key = `${text}_${sourceLang}_${targetLang}`;

    // Check cache synchronously first
    if (translationService.cache.has(key)) {
      return Promise.resolve(translationService.cache.get(key));
    }

    return new Promise((resolve, reject) => {
      if (!this.pending.has(key)) {
        this.pending.set(key, { text, targetLang, sourceLang, callbacks: [] });
      }
      this.pending.get(key).callbacks.push({ resolve, reject });
      this._scheduleFlush();
    });
  }

  _scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this._flush();
    }, DEBOUNCE_MS);
  }

  async _flush() {
    const items = [...this.pending.values()];
    this.pending.clear();

    if (items.length === 0) return;

    // Process with concurrency limit
    let i = 0;
    const next = async () => {
      while (i < items.length) {
        const item = items[i++];
        try {
          const result = await translationService.translate(
            item.text,
            item.targetLang,
            item.sourceLang
          );
          item.callbacks.forEach((cb) => cb.resolve(result));
        } catch (err) {
          item.callbacks.forEach((cb) => cb.reject(err));
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT, items.length) },
      () => next()
    );
    await Promise.allSettled(workers);
  }
}

export default new TranslationBatchQueue();
