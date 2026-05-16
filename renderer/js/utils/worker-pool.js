/**
 * WorkerPool
 * Purpose: Manages a pool of Web Workers to perform tasks concurrently.
 * Used for CPU-intensive tasks like image encoding.
 */
const WorkerPool = (() => {
  'use strict';

  const _workers = [];
  const _queue = [];
  const _activeTasks = new Map();
  let _maxConcurrency = 3;
  let _workerScript = '';
  let _taskIdCounter = 0;

  /**
   * Initialize the pool
   * @param {string} script - Path to the worker script
   * @param {number} concurrency - Max parallel workers
   */
  function init(script, concurrency = 3) {
    _workerScript = script;
    _maxConcurrency = concurrency;
  }

  /**
   * Run a task in the pool
   * @param {Object} data - Task data to send to worker
   * @returns {Promise<Object>} - Worker response
   */
  function runTask(data) {
    return new Promise((resolve, reject) => {
      const taskId = ++_taskIdCounter;
      const task = {
        id: taskId,
        data,
        resolve,
        reject
      };

      _queue.push(task);
      _processQueue();
    });
  }

  function _processQueue() {
    if (_queue.length === 0) return;
    if (_activeTasks.size >= _maxConcurrency) return;

    const task = _queue.shift();
    const worker = _getAvailableWorker();

    _activeTasks.set(task.id, { task, worker });

    const onMessage = (e) => {
      if (e.data.id === task.id) {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        _activeTasks.delete(task.id);
        
        if (e.data.success) {
          task.resolve(e.data);
        } else {
          task.reject(new Error(e.data.error || 'Worker task failed'));
        }
        
        _processQueue();
      }
    };

    const onError = (e) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      _activeTasks.delete(task.id);
      const errorMsg = e.message || 'Unknown worker error (possibly script load failure)';
      task.reject(new Error('Worker error: ' + errorMsg));
      _processQueue();
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);

    worker.postMessage({ ...task.data, id: task.id });
  }

  function _getAvailableWorker() {
    // For now, we create workers as needed up to maxConcurrency
    // and reuse them if they are not active.
    // However, since we use addEventListener for each task, 
    // any worker not currently handling an active task is "available".
    
    // Check for an idle worker
    const activeWorkerInstances = new Set(Array.from(_activeTasks.values()).map(t => t.worker));
    const idleWorker = _workers.find(w => !activeWorkerInstances.has(w));

    if (idleWorker) return idleWorker;

    // Create new if below limit
    if (_workers.length < _maxConcurrency) {
      // Create ESM worker
      const worker = new Worker(_workerScript, { type: 'module' });
      _workers.push(worker);
      return worker;
    }

    // This should theoretically not be reached due to _activeTasks.size check in _processQueue
    return _workers[0]; 
  }

  /**
   * Terminate all workers
   */
  function terminate() {
    _workers.forEach(w => w.terminate());
    _workers.length = 0;
    _activeTasks.clear();
    _queue.length = 0;
  }

  return {
    init,
    runTask,
    terminate
  };
})();

window.WorkerPool = WorkerPool;
