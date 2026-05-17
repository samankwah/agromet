import translationService from './translationService';

const DEBOUNCE_MS = 25;
const MAX_CONCURRENT = 6;

class TranslationBatchQueue {
  constructor() {
    this.pending = new Map();
    this.flushTimer = null;
  }

  enqueue(text, targetLang, sourceLang = 'en') {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (!text || targetLang === sourceLang) {
      return Promise.resolve(text);
    }

    if (
      typeof translationService.shouldTranslateText === 'function'
      && !translationService.shouldTranslateText(text, targetLang, sourceLang)
    ) {
      return Promise.resolve(text);
    }

    const key = `${text}_${sourceLang}_${targetLang}`;

    // Check cache synchronously first
    if (translationService.cache.has(key)) {
      const cached = translationService.cache.get(key);
      if (cached && cached !== text) {
        return Promise.resolve(cached);
      }
      translationService.cache.delete(key);
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

    const groupedItems = new Map();
    items.forEach((item) => {
      const groupKey = `${item.sourceLang}->${item.targetLang}`;
      if (!groupedItems.has(groupKey)) {
        groupedItems.set(groupKey, []);
      }
      groupedItems.get(groupKey).push(item);
    });

    const processGroup = async (groupItems) => {
      const { targetLang, sourceLang } = groupItems[0];
      try {
        const translatedMap = await translationService.translateMany(
          groupItems.map((item) => item.text),
          targetLang,
          sourceLang
        );

        groupItems.forEach((item) => {
          const result = translatedMap.get(item.text);
          const shouldTranslate =
            typeof translationService.shouldTranslateText !== 'function'
            || translationService.shouldTranslateText(
              item.text,
              item.targetLang,
              item.sourceLang
            );

          if (result && (result !== item.text || !shouldTranslate)) {
            item.callbacks.forEach((cb) => cb.resolve(result));
          } else {
            item.callbacks.forEach((cb) => cb.reject(new Error('No usable translation')));
          }
        });
      } catch {
        await Promise.allSettled(
          groupItems.map(async (item) => {
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
          })
        );
      }
    };

    const groups = [...groupedItems.values()];
    let i = 0;
    const next = async () => {
      while (i < groups.length) {
        const group = groups[i++];
        await processGroup(group);
      }
    };

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT, groups.length) },
      () => next()
    );
    await Promise.allSettled(workers);
  }
}

export default new TranslationBatchQueue();
