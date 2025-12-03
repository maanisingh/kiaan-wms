/**
 * Simple job queue processor for background tasks
 * In production, consider using Bull, BullMQ, or AWS SQS
 */
class JobQueueProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.handlers = new Map();
  }

  /**
   * Register a job handler
   * @param {string} jobType - Type of job
   * @param {Function} handler - Handler function
   */
  registerHandler(jobType, handler) {
    this.handlers.set(jobType, handler);
  }

  /**
   * Add job to queue
   * @param {string} jobType - Type of job
   * @param {Object} data - Job data
   * @param {Object} options - Job options (delay, priority, etc.)
   * @returns {string} - Job ID
   */
  async addJob(jobType, data, options = {}) {
    const job = {
      id: this.generateJobId(),
      type: jobType,
      data: data,
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      priority: options.priority || 5,
      createdAt: new Date(),
      scheduledFor: options.delay ? new Date(Date.now() + options.delay) : new Date()
    };

    this.queue.push(job);
    this.queue.sort((a, b) => {
      // Sort by priority (lower number = higher priority) and scheduled time
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.scheduledFor - b.scheduledFor;
    });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return job.id;
  }

  /**
   * Process jobs in queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue[0];

      // Check if job is scheduled for future
      if (job.scheduledFor > new Date()) {
        // Wait for scheduled time
        const delay = job.scheduledFor - new Date();
        if (delay > 0) {
          await this.sleep(Math.min(delay, 5000)); // Check every 5 seconds max
          continue;
        }
      }

      // Remove job from queue
      this.queue.shift();

      // Process job
      await this.processJob(job);
    }

    this.processing = false;
  }

  /**
   * Process a single job
   * @param {Object} job - Job to process
   */
  async processJob(job) {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      console.error(`No handler registered for job type: ${job.type}`);
      return;
    }

    job.status = 'processing';
    job.attempts++;
    job.startedAt = new Date();

    try {
      const result = await handler(job.data);
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      console.log(`Job ${job.id} (${job.type}) completed successfully`);
    } catch (error) {
      console.error(`Job ${job.id} (${job.type}) failed:`, error);
      job.error = error.message;

      if (job.attempts < job.maxAttempts) {
        // Retry job with exponential backoff
        job.status = 'pending';
        job.scheduledFor = new Date(Date.now() + Math.pow(2, job.attempts) * 1000);
        this.queue.push(job);
        console.log(`Job ${job.id} will retry in ${Math.pow(2, job.attempts)} seconds`);
      } else {
        job.status = 'failed';
        job.failedAt = new Date();
        console.error(`Job ${job.id} failed after ${job.attempts} attempts`);
      }
    }
  }

  /**
   * Generate unique job ID
   * @returns {string}
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   * @returns {Object}
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      pendingJobs: this.queue.filter(j => j.status === 'pending').length,
      processingJobs: this.queue.filter(j => j.status === 'processing').length
    };
  }

  /**
   * Clear all jobs from queue
   */
  clearQueue() {
    this.queue = [];
  }
}

module.exports = new JobQueueProcessor();
