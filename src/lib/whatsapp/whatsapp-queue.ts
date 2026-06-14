type QueueJob = () => Promise<void>;

const queue: QueueJob[] = [];
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
      console.error("[whatsapp-queue]", e);
    }
  }
  processing = false;
}

/** Queue non bloquante — ne doit jamais bloquer les opérations métier. */
export function enqueueWhatsAppJob(job: QueueJob) {
  queue.push(job);
  void drain();
}

export function scheduleWhatsAppRetry(job: QueueJob, delaySeconds: number) {
  setTimeout(() => enqueueWhatsAppJob(job), delaySeconds * 1000);
}
