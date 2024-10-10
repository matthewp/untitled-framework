type SchedulerCallback = () => void;

interface ScheduledWork {
  id: number;
  callback: SchedulerCallback;
}

const scheduler = (function() {
  let callbacks: ScheduledWork[] = [];
  let nextWorkId = 1;
  let pending = false;

  function postMessage(): void {
    window.postMessage('__reactScheduler', '*');
  }

  function messageHandler(event: MessageEvent): void {
    if (event.source === window && event.data === '__reactScheduler') {
      event.stopPropagation();
      if (callbacks.length > 0) {
        const currentCallback = callbacks.shift();
        currentCallback?.callback();
      }
      if (callbacks.length > 0) {
        postMessage();
      } else {
        pending = false;
      }
    }
  }

  window.addEventListener('message', messageHandler);

  return {
    scheduleWork(callback: SchedulerCallback): number {
      const id = nextWorkId++;
      callbacks.push({ id, callback });
      if (!pending) {
        pending = true;
        postMessage();
      }
      return id;
    },

    cancelWork(id: number): void {
      callbacks = callbacks.filter(work => work.id !== id);
      if (callbacks.length === 0) {
        pending = false;
      }
    },

    cancelAllWork(): void {
      callbacks = [];
      pending = false;
    },

    isPending() {
      return pending;
    }
  };
})();

// Usage
export const scheduleWork = scheduler.scheduleWork;
export const cancelWork = scheduler.cancelWork;
export const cancelAllWork = scheduler.cancelAllWork;
export const workPending = scheduler.isPending;
