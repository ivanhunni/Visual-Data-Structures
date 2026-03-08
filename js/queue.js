/**
 * QueueDS — Queue data structure with step-sequence generation.
 *
 * Operations: enqueue (add to rear), dequeue (remove from front).
 * Each returns an array of step objects for the animation engine.
 *
 * Step shape matches the common format used by all DS modules.
 */

var QUEUE_PSEUDOCODE = {
  enqueue: [
    'function enqueue(value):',
    '  rear = rear + 1',
    '  queue[rear] = value',
  ],
  dequeue: [
    'function dequeue():',
    '  if front > rear:',
    '    throw "Queue Underflow"',
    '  value = queue[front]',
    '  front = front + 1',
    '  return value',
  ],
};

function _qSnapshot(items, overrides) {
  return items.map(function (v, i) {
    return { value: v, state: (overrides && overrides[i]) || 'default' };
  });
}

class QueueDS {
  constructor() {
    this.items = [];
  }

  /* ============================
     ENQUEUE — add to rear
     ============================ */
  generateEnqueueSteps(value) {
    var steps = [];
    var pc = QUEUE_PSEUDOCODE.enqueue;
    var before = this.items.slice();

    // Step 1 — current state
    steps.push({
      items: _qSnapshot(before),
      floatingElement: null,
      floatSide: null,
      explanation: before.length === 0
        ? 'Queue is empty. We will enqueue ' + value + '.'
        : 'Current queue has ' + before.length + ' element(s). Front = ' + before[0] + ', Rear = ' + before[before.length - 1] + '.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: 'O(1)',
    });

    // Step 2 — new element floating at rear
    steps.push({
      items: _qSnapshot(before),
      floatingElement: { value: value, label: 'NEW' },
      floatSide: 'rear',
      explanation: 'New element ' + value + ' created. It will join at the rear of the queue.',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: 'O(1)',
    });

    // Actually mutate
    this.items.push(value);

    // Step 3 — element placed, highlighted
    var hi = {};
    hi[this.items.length - 1] = 'highlight';
    steps.push({
      items: _qSnapshot(this.items, hi),
      floatingElement: null,
      floatSide: null,
      explanation: 'Element ' + value + ' placed at rear (index ' + (this.items.length - 1) + '). Enqueue complete!',
      pseudocode: pc,
      pseudocodeLine: 2,
      bigO: 'O(1)',
    });

    return steps;
  }

  /* ============================
     DEQUEUE — remove from front
     ============================ */
  generateDequeueSteps() {
    var steps = [];
    var pc = QUEUE_PSEUDOCODE.dequeue;

    // Empty check
    if (this.items.length === 0) {
      steps.push({
        items: [],
        floatingElement: null,
        floatSide: null,
        explanation: 'Queue is empty! Cannot dequeue — Queue Underflow error.',
        pseudocode: pc,
        pseudocodeLine: 2,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    var before = this.items.slice();
    var frontVal = before[0];

    // Step 1 — current state
    steps.push({
      items: _qSnapshot(before),
      floatingElement: null,
      floatSide: null,
      explanation: 'Current queue has ' + before.length + ' element(s). We will dequeue the front element.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: 'O(1)',
    });

    // Step 2 — check non-empty
    steps.push({
      items: _qSnapshot(before),
      floatingElement: null,
      floatSide: null,
      explanation: 'Check: is the queue empty? No. Proceed.',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: 'O(1)',
    });

    // Step 3 — highlight front element
    var hi3 = {};
    hi3[0] = 'active';
    steps.push({
      items: _qSnapshot(before, hi3),
      floatingElement: null,
      floatSide: null,
      explanation: 'Identify front element: queue[front] = ' + frontVal + '.',
      pseudocode: pc,
      pseudocodeLine: 3,
      bigO: 'O(1)',
    });

    // Step 4 — mark removing
    var hi4 = {};
    hi4[0] = 'removing';
    steps.push({
      items: _qSnapshot(before, hi4),
      floatingElement: null,
      floatSide: null,
      explanation: 'Remove element ' + frontVal + ' from the front of the queue.',
      pseudocode: pc,
      pseudocodeLine: 4,
      bigO: 'O(1)',
    });

    // Actually mutate
    this.items.shift();

    // Step 5 — element floats away from front side
    steps.push({
      items: _qSnapshot(this.items),
      floatingElement: { value: frontVal, label: 'REMOVED' },
      floatSide: 'front',
      explanation: 'Element ' + frontVal + ' removed from front. Returning ' + frontVal + '.',
      pseudocode: pc,
      pseudocodeLine: 5,
      bigO: 'O(1)',
    });

    // Step 6 — final
    steps.push({
      items: _qSnapshot(this.items),
      floatingElement: null,
      floatSide: null,
      explanation: this.items.length === 0
        ? 'Dequeue complete! Queue is now empty.'
        : 'Dequeue complete! Front is now ' + this.items[0] + '. Queue size: ' + this.items.length + '.',
      pseudocode: pc,
      pseudocodeLine: -1,
      bigO: 'O(1)',
    });

    return steps;
  }

  clear() {
    this.items = [];
  }
}
