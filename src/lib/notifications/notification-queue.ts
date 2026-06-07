type Job = () => Promise<void>;

const queue: Job[] = [];
let processing = false;

async function drain() {
  if (processing) return;
  processing = true;
  while (queue.length) {
    const job = queue.shift();
    if (!job) continue;
    try {
      await job();
    } catch (e) {
      console.error("[notification-queue]", e);
    }
  }
  processing = false;
}

/** Exécute un job en arrière-plan sans bloquer la requête HTTP. */
export function enqueueNotificationJob(job: Job) {
  queue.push(job);
  setImmediate(() => {
    void drain();
  });
}
