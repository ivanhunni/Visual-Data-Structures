/**
 * ArrayDS — Array data structure with step-sequence generation.
 *
 * Operations: insert (at index), delete (at index), access (by index).
 * Each returns an array of step objects for the animation engine.
 *
 * Step shape:
 *   {
 *     items:           [{ value, state }],  // "default"|"highlight"|"active"|"removing"|"shifting"
 *     highlightIndex:  number | -1,
 *     floatingElement: { value, label } | null,
 *     explanation:     string,
 *     pseudocode:      string[],
 *     pseudocodeLine:  number,
 *     bigO:            string,
 *     error:           boolean | undefined,
 *   }
 */

var ARRAY_PSEUDOCODE = {
  insert: [
    'function insert(index, value):',
    '  for i = length down to index+1:',
    '    arr[i] = arr[i-1]   // shift right',
    '  arr[index] = value',
    '  length = length + 1',
  ],
  delete: [
    'function delete(index):',
    '  value = arr[index]',
    '  for i = index to length-2:',
    '    arr[i] = arr[i+1]   // shift left',
    '  length = length - 1',
    '  return value',
  ],
  access: [
    'function access(index):',
    '  if index < 0 or index >= length:',
    '    throw "Index out of bounds"',
    '  return arr[index]',
  ],
};

function _arrSnapshot(items, overrides) {
  return items.map(function (v, i) {
    return { value: v, state: (overrides && overrides[i]) || 'default' };
  });
}

class ArrayDS {
  constructor() {
    this.items = [];
  }

  /* ============================
     INSERT at index
     ============================ */
  generateInsertSteps(index, value) {
    var steps = [];
    var pc = ARRAY_PSEUDOCODE.insert;

    // Clamp
    if (index < 0) index = 0;
    if (index > this.items.length) index = this.items.length;

    var before = this.items.slice();

    // Step 1 — show current state
    steps.push({
      items: _arrSnapshot(before),
      highlightIndex: -1,
      floatingElement: null,
      explanation: before.length === 0
        ? 'Array is empty. We will insert ' + value + ' at index ' + index + '.'
        : 'Current array has ' + before.length + ' element(s). We will insert ' + value + ' at index ' + index + '.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: index === before.length ? 'O(1)' : 'O(n)',
    });

    // Step 2 — new element floating
    steps.push({
      items: _arrSnapshot(before),
      highlightIndex: index,
      floatingElement: { value: value, label: 'NEW' },
      explanation: 'New element ' + value + ' created. It will be placed at index ' + index + '.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: index === before.length ? 'O(1)' : 'O(n)',
    });

    // Steps 3..N — shift elements right one by one (from end toward index)
    if (index < before.length) {
      for (var i = before.length - 1; i >= index; i--) {
        var hi = {};
        hi[i] = 'shifting';
        // Show the array with current shifts in progress
        var shifted = before.slice();
        // The elements from i..end have been "moved" one position to the right conceptually
        steps.push({
          items: _arrSnapshot(before, hi),
          highlightIndex: -1,
          floatingElement: { value: value, label: 'NEW' },
          explanation: 'Shift arr[' + i + '] = ' + before[i] + ' one position to the right → arr[' + (i + 1) + '].',
          pseudocode: pc,
          pseudocodeLine: 2,
          bigO: 'O(n)',
        });
      }
    }

    // Actually mutate
    this.items.splice(index, 0, value);

    // Final step — element placed
    var hiF = {};
    hiF[index] = 'highlight';
    steps.push({
      items: _arrSnapshot(this.items, hiF),
      highlightIndex: index,
      floatingElement: null,
      explanation: 'Element ' + value + ' inserted at index ' + index + '. Array size is now ' + this.items.length + '.',
      pseudocode: pc,
      pseudocodeLine: 3,
      bigO: index === this.items.length - 1 ? 'O(1)' : 'O(n)',
    });

    return steps;
  }

  /* ============================
     DELETE at index
     ============================ */
  generateDeleteSteps(index) {
    var steps = [];
    var pc = ARRAY_PSEUDOCODE.delete;

    if (this.items.length === 0) {
      steps.push({
        items: [],
        highlightIndex: -1,
        floatingElement: null,
        explanation: 'Array is empty! Nothing to delete.',
        pseudocode: pc,
        pseudocodeLine: 0,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    if (index < 0 || index >= this.items.length) {
      steps.push({
        items: _arrSnapshot(this.items),
        highlightIndex: -1,
        floatingElement: null,
        explanation: 'Index ' + index + ' is out of bounds! Valid range: 0..' + (this.items.length - 1) + '.',
        pseudocode: pc,
        pseudocodeLine: 0,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    var before = this.items.slice();
    var removedVal = before[index];

    // Step 1 — show current state
    steps.push({
      items: _arrSnapshot(before),
      highlightIndex: -1,
      floatingElement: null,
      explanation: 'Current array has ' + before.length + ' element(s). We will delete element at index ' + index + '.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: index === before.length - 1 ? 'O(1)' : 'O(n)',
    });

    // Step 2 — highlight the element to remove
    var hi2 = {};
    hi2[index] = 'removing';
    steps.push({
      items: _arrSnapshot(before, hi2),
      highlightIndex: index,
      floatingElement: null,
      explanation: 'Identify element to remove: arr[' + index + '] = ' + removedVal + '.',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: index === before.length - 1 ? 'O(1)' : 'O(n)',
    });

    // Steps — shift elements left one by one
    if (index < before.length - 1) {
      for (var i = index; i < before.length - 1; i++) {
        var hi = {};
        hi[i + 1] = 'shifting';
        steps.push({
          items: _arrSnapshot(before, hi),
          highlightIndex: -1,
          floatingElement: { value: removedVal, label: 'REMOVED' },
          explanation: 'Shift arr[' + (i + 1) + '] = ' + before[i + 1] + ' one position to the left → arr[' + i + '].',
          pseudocode: pc,
          pseudocodeLine: 3,
          bigO: 'O(n)',
        });
      }
    }

    // Actually mutate
    this.items.splice(index, 1);

    // Final — show result
    steps.push({
      items: _arrSnapshot(this.items),
      highlightIndex: -1,
      floatingElement: { value: removedVal, label: 'REMOVED' },
      explanation: 'Element ' + removedVal + ' removed. Array size is now ' + this.items.length + '.',
      pseudocode: pc,
      pseudocodeLine: 4,
      bigO: index === before.length - 1 ? 'O(1)' : 'O(n)',
    });

    // Final clean
    steps.push({
      items: _arrSnapshot(this.items),
      highlightIndex: -1,
      floatingElement: null,
      explanation: 'Delete complete. Returned value: ' + removedVal + '.',
      pseudocode: pc,
      pseudocodeLine: 5,
      bigO: index === before.length - 1 ? 'O(1)' : 'O(n)',
    });

    return steps;
  }

  /* ============================
     ACCESS by index
     ============================ */
  generateAccessSteps(index) {
    var steps = [];
    var pc = ARRAY_PSEUDOCODE.access;

    if (index < 0 || index >= this.items.length) {
      steps.push({
        items: _arrSnapshot(this.items),
        highlightIndex: -1,
        floatingElement: null,
        explanation: this.items.length === 0
          ? 'Array is empty! Cannot access any index.'
          : 'Index ' + index + ' is out of bounds! Valid range: 0..' + (this.items.length - 1) + '.',
        pseudocode: pc,
        pseudocodeLine: 2,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    // Step 1 — show array
    steps.push({
      items: _arrSnapshot(this.items),
      highlightIndex: -1,
      floatingElement: null,
      explanation: 'Access element at index ' + index + '. Arrays support direct access by index.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: 'O(1)',
    });

    // Step 2 — check bounds
    steps.push({
      items: _arrSnapshot(this.items),
      highlightIndex: -1,
      floatingElement: null,
      explanation: 'Check: is index ' + index + ' valid? Yes (0 ≤ ' + index + ' < ' + this.items.length + ').',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: 'O(1)',
    });

    // Step 3 — highlight accessed element
    var hi = {};
    hi[index] = 'highlight';
    steps.push({
      items: _arrSnapshot(this.items, hi),
      highlightIndex: index,
      floatingElement: null,
      explanation: 'Direct access: arr[' + index + '] = ' + this.items[index] + '. No iteration needed!',
      pseudocode: pc,
      pseudocodeLine: 3,
      bigO: 'O(1)',
    });

    return steps;
  }

  clear() {
    this.items = [];
  }
}
