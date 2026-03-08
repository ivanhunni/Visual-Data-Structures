/**
 * StackDS — Stack data structure with step-sequence generation.
 *
 * Every public operation (push, pop, peek) returns an array of
 * "step" objects that describe the state of the stack at each
 * stage of the operation.  The actual internal array is mutated
 * only once per operation, but the steps capture before/during/after
 * snapshots so the UI can animate through them.
 *
 * Step shape:
 *   {
 *     items:           [{ value, state }],  // "default"|"highlight"|"active"|"removing"
 *     floatingElement:  { value, label } | null,
 *     explanation:      string,
 *     pseudocode:       string[],
 *     pseudocodeLine:   number (-1 = none),
 *     bigO:             string,
 *     error:            boolean | undefined,
 *   }
 */

/* ---- Pseudocode templates ---- */
var STACK_PSEUDOCODE = {
  push: [
    'function push(value):',
    '  top = top + 1',
    '  stack[top] = value',
  ],
  pop: [
    'function pop():',
    '  if top == -1:',
    '    throw "Stack Underflow"',
    '  value = stack[top]',
    '  top = top - 1',
    '  return value',
  ],
  peek: [
    'function peek():',
    '  if top == -1:',
    '    throw "Stack Empty"',
    '  return stack[top]',
  ],
};

/* ---- Helper: shallow-copy items with a given state ---- */
function _snapshot(items, overrides) {
  // overrides is an object mapping index → state string
  return items.map(function (v, i) {
    return { value: v, state: (overrides && overrides[i]) || 'default' };
  });
}

/* ---- Stack Class ---- */
class StackDS {
  constructor() {
    this.items = [];
  }

  /* ============================
     PUSH
     ============================ */
  generatePushSteps(value) {
    var steps = [];
    var before = this.items.slice();
    var pc = STACK_PSEUDOCODE.push;

    // Step 1 — show current state
    steps.push({
      items: _snapshot(before),
      floatingElement: null,
      explanation:
        before.length === 0
          ? 'Stack is empty. We will push ' + value + ' onto it.'
          : 'Current stack has ' + before.length + ' element(s). Top is ' + before[before.length - 1] + '.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: 'O(1)',
    });

    // Step 2 — new element floating above stack
    steps.push({
      items: _snapshot(before),
      floatingElement: { value: value, label: 'NEW' },
      explanation: 'New element ' + value + ' created. It will be placed on top of the stack.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: 'O(1)',
    });

    // Step 3 — increment top pointer
    steps.push({
      items: _snapshot(before),
      floatingElement: { value: value, label: 'NEW' },
      explanation: 'Increment top pointer: top = ' + (before.length - 1) + ' \u2192 ' + before.length + '.',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: 'O(1)',
    });

    // Actually mutate
    this.items.push(value);

    // Step 4 — element placed, highlighted
    var hi = {};
    hi[this.items.length - 1] = 'highlight';
    steps.push({
      items: _snapshot(this.items, hi),
      floatingElement: null,
      explanation: 'Element ' + value + ' placed at stack[' + (this.items.length - 1) + ']. Push complete!',
      pseudocode: pc,
      pseudocodeLine: 2,
      bigO: 'O(1)',
    });

    return steps;
  }

  /* ============================
     POP
     ============================ */
  generatePopSteps() {
    var steps = [];
    var pc = STACK_PSEUDOCODE.pop;

    // Edge case — empty
    if (this.items.length === 0) {
      steps.push({
        items: [],
        floatingElement: null,
        explanation: 'Stack is empty! Cannot pop \u2014 Stack Underflow error.',
        pseudocode: pc,
        pseudocodeLine: 2,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    var before = this.items.slice();
    var topVal = before[before.length - 1];
    var topIdx = before.length - 1;

    // Step 1 — current state
    steps.push({
      items: _snapshot(before),
      floatingElement: null,
      explanation: 'Current stack has ' + before.length + ' element(s). We will pop the top element.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: 'O(1)',
    });

    // Step 2 — check non-empty
    steps.push({
      items: _snapshot(before),
      floatingElement: null,
      explanation: 'Check: is the stack empty? No (top = ' + topIdx + '). Proceed.',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: 'O(1)',
    });

    // Step 3 — identify top element
    var hi3 = {};
    hi3[topIdx] = 'active';
    steps.push({
      items: _snapshot(before, hi3),
      floatingElement: null,
      explanation: 'Read top element: value = stack[' + topIdx + '] = ' + topVal + '.',
      pseudocode: pc,
      pseudocodeLine: 3,
      bigO: 'O(1)',
    });

    // Step 4 — mark as removing
    var hi4 = {};
    hi4[topIdx] = 'removing';
    steps.push({
      items: _snapshot(before, hi4),
      floatingElement: null,
      explanation: 'Decrement top pointer: top = ' + topIdx + ' \u2192 ' + (topIdx - 1) + '.',
      pseudocode: pc,
      pseudocodeLine: 4,
      bigO: 'O(1)',
    });

    // Actually mutate
    this.items.pop();

    // Step 5 — show removed element floating away
    steps.push({
      items: _snapshot(this.items),
      floatingElement: { value: topVal, label: 'REMOVED' },
      explanation: 'Element ' + topVal + ' removed from stack. Returning ' + topVal + '.',
      pseudocode: pc,
      pseudocodeLine: 5,
      bigO: 'O(1)',
    });

    // Step 6 — final
    steps.push({
      items: _snapshot(this.items),
      floatingElement: null,
      explanation:
        this.items.length === 0
          ? 'Pop complete! Stack is now empty.'
          : 'Pop complete! Stack size is now ' + this.items.length + '. New top is ' + this.items[this.items.length - 1] + '.',
      pseudocode: pc,
      pseudocodeLine: -1,
      bigO: 'O(1)',
    });

    return steps;
  }

  /* ============================
     PEEK
     ============================ */
  generatePeekSteps() {
    var steps = [];
    var pc = STACK_PSEUDOCODE.peek;

    // Edge case — empty
    if (this.items.length === 0) {
      steps.push({
        items: [],
        floatingElement: null,
        explanation: 'Stack is empty! Cannot peek \u2014 Stack Empty error.',
        pseudocode: pc,
        pseudocodeLine: 2,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    var topVal = this.items[this.items.length - 1];
    var topIdx = this.items.length - 1;

    // Step 1 — show current state
    steps.push({
      items: _snapshot(this.items),
      floatingElement: null,
      explanation: 'Peek operation: look at the top element without removing it.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: 'O(1)',
    });

    // Step 2 — check non-empty
    steps.push({
      items: _snapshot(this.items),
      floatingElement: null,
      explanation: 'Check: is the stack empty? No (top = ' + topIdx + '). Proceed.',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: 'O(1)',
    });

    // Step 3 — highlight top element
    var hi = {};
    hi[topIdx] = 'highlight';
    steps.push({
      items: _snapshot(this.items, hi),
      floatingElement: null,
      explanation: 'Top element is stack[' + topIdx + '] = ' + topVal + '. The stack is not modified.',
      pseudocode: pc,
      pseudocodeLine: 3,
      bigO: 'O(1)',
    });

    return steps;
  }

  /** Reset the stack to empty. */
  clear() {
    this.items = [];
  }
}
