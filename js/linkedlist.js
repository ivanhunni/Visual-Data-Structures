/**
 * LinkedListDS — Singly Linked List with step-sequence generation.
 *
 * Internal representation: plain array of values (this.items).
 * Each operation produces step objects describing nodes + pointers
 * so the renderer can draw the classic [Data|Next] → … → NULL diagram.
 *
 * Step shape:
 *   {
 *     nodes:           [{ value, state }],   // state: default|highlight|active|removing|traversing
 *     headIndex:       number,               // which node is head (-1 if empty)
 *     traverseIndex:   number,               // which node is currently being visited (-1 = none)
 *     floatingNode:    { value, label } | null,
 *     explanation:     string,
 *     pseudocode:      string[],
 *     pseudocodeLine:  number,
 *     bigO:            string,
 *     error:           boolean | undefined,
 *   }
 */

var LL_PSEUDOCODE = {
  insert: [
    'function insert(index, value):',
    '  newNode = Node(value)',
    '  if index == 0:',
    '    newNode.next = head',
    '    head = newNode',
    '  else:',
    '    curr = head',
    '    for i = 0 to index-2:',
    '      curr = curr.next',
    '    newNode.next = curr.next',
    '    curr.next = newNode',
  ],
  delete: [
    'function delete(index):',
    '  if index == 0:',
    '    value = head.data',
    '    head = head.next',
    '  else:',
    '    curr = head',
    '    for i = 0 to index-2:',
    '      curr = curr.next',
    '    value = curr.next.data',
    '    curr.next = curr.next.next',
    '  return value',
  ],
  traverse: [
    'function traverse():',
    '  curr = head',
    '  while curr != null:',
    '    visit(curr.data)',
    '    curr = curr.next',
  ],
};

function _llSnapshot(items, overrides) {
  return items.map(function (v, i) {
    return { value: v, state: (overrides && overrides[i]) || 'default' };
  });
}

class LinkedListDS {
  constructor() {
    this.items = [];
  }

  /* ============================
     INSERT at index
     ============================ */
  generateInsertSteps(index, value) {
    var steps = [];
    var pc = LL_PSEUDOCODE.insert;

    if (index < 0) index = 0;
    if (index > this.items.length) index = this.items.length;

    var before = this.items.slice();
    var isHead = index === 0;

    // Step 1 — current list
    steps.push({
      nodes: _llSnapshot(before),
      headIndex: before.length > 0 ? 0 : -1,
      traverseIndex: -1,
      floatingNode: null,
      explanation: before.length === 0
        ? 'Linked list is empty. We will insert ' + value + '.'
        : 'Current list has ' + before.length + ' node(s). We will insert ' + value + ' at position ' + index + '.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: isHead ? 'O(1)' : 'O(n)',
    });

    // Step 2 — create new node (floating)
    steps.push({
      nodes: _llSnapshot(before),
      headIndex: before.length > 0 ? 0 : -1,
      traverseIndex: -1,
      floatingNode: { value: value, label: 'NEW' },
      explanation: 'Create new node with data = ' + value + '.',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: isHead ? 'O(1)' : 'O(n)',
    });

    if (isHead) {
      // Step 3 — point new node's next to old head
      steps.push({
        nodes: _llSnapshot(before),
        headIndex: before.length > 0 ? 0 : -1,
        traverseIndex: -1,
        floatingNode: { value: value, label: 'NEW → head' },
        explanation: before.length > 0
          ? 'Set newNode.next = head (node ' + before[0] + ').'
          : 'Set newNode.next = null (list was empty).',
        pseudocode: pc,
        pseudocodeLine: 3,
        bigO: 'O(1)',
      });
    } else {
      // Traverse to node at index-1
      for (var t = 0; t < index; t++) {
        var hi = {};
        hi[t] = 'traversing';
        steps.push({
          nodes: _llSnapshot(before, hi),
          headIndex: 0,
          traverseIndex: t,
          floatingNode: { value: value, label: 'NEW' },
          explanation: t < index - 1
            ? 'Traverse: visiting node ' + before[t] + ' (index ' + t + '). Move to next.'
            : 'Found insertion point: after node ' + before[t] + ' (index ' + t + ').',
          pseudocode: pc,
          pseudocodeLine: t < index - 1 ? 7 : 8,
          bigO: 'O(n)',
        });
      }

      // Reconnect pointers
      var hiPrev = {};
      hiPrev[index - 1] = 'active';
      steps.push({
        nodes: _llSnapshot(before, hiPrev),
        headIndex: 0,
        traverseIndex: index - 1,
        floatingNode: { value: value, label: 'LINKING' },
        explanation: 'Reconnect pointers: newNode.next = curr.next, then curr.next = newNode.',
        pseudocode: pc,
        pseudocodeLine: 10,
        bigO: 'O(n)',
      });
    }

    // Actually mutate
    this.items.splice(index, 0, value);

    // Final — show result with highlight
    var hiF = {};
    hiF[index] = 'highlight';
    steps.push({
      nodes: _llSnapshot(this.items, hiF),
      headIndex: 0,
      traverseIndex: -1,
      floatingNode: null,
      explanation: 'Node ' + value + ' inserted at position ' + index + '. List size: ' + this.items.length + '.',
      pseudocode: pc,
      pseudocodeLine: -1,
      bigO: isHead ? 'O(1)' : 'O(n)',
    });

    return steps;
  }

  /* ============================
     DELETE at index
     ============================ */
  generateDeleteSteps(index) {
    var steps = [];
    var pc = LL_PSEUDOCODE.delete;

    if (this.items.length === 0) {
      steps.push({
        nodes: [],
        headIndex: -1,
        traverseIndex: -1,
        floatingNode: null,
        explanation: 'Linked list is empty! Nothing to delete.',
        pseudocode: pc,
        pseudocodeLine: 0,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    if (index < 0 || index >= this.items.length) {
      steps.push({
        nodes: _llSnapshot(this.items),
        headIndex: 0,
        traverseIndex: -1,
        floatingNode: null,
        explanation: 'Index ' + index + ' is out of bounds! Valid: 0..' + (this.items.length - 1) + '.',
        pseudocode: pc,
        pseudocodeLine: 0,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    var before = this.items.slice();
    var removedVal = before[index];
    var isHead = index === 0;

    // Step 1 — show current list
    steps.push({
      nodes: _llSnapshot(before),
      headIndex: 0,
      traverseIndex: -1,
      floatingNode: null,
      explanation: 'Current list has ' + before.length + ' node(s). We will delete node at position ' + index + '.',
      pseudocode: pc,
      pseudocodeLine: 0,
      bigO: isHead ? 'O(1)' : 'O(n)',
    });

    if (isHead) {
      // Highlight head
      var hiH = {};
      hiH[0] = 'removing';
      steps.push({
        nodes: _llSnapshot(before, hiH),
        headIndex: 0,
        traverseIndex: -1,
        floatingNode: null,
        explanation: 'Deleting head node: value = ' + removedVal + '. Set head = head.next.',
        pseudocode: pc,
        pseudocodeLine: 3,
        bigO: 'O(1)',
      });
    } else {
      // Traverse to node before deletion point
      for (var t = 0; t <= index; t++) {
        var hi = {};
        hi[t] = t < index ? 'traversing' : 'removing';
        steps.push({
          nodes: _llSnapshot(before, hi),
          headIndex: 0,
          traverseIndex: t,
          floatingNode: null,
          explanation: t < index
            ? 'Traverse: visiting node ' + before[t] + ' (index ' + t + ').'
            : 'Found target node: ' + before[t] + ' at index ' + t + '. Mark for removal.',
          pseudocode: pc,
          pseudocodeLine: t < index ? 6 : 8,
          bigO: 'O(n)',
        });
      }

      // Reconnect
      var hiR = {};
      hiR[index] = 'removing';
      if (index > 0) hiR[index - 1] = 'active';
      steps.push({
        nodes: _llSnapshot(before, hiR),
        headIndex: 0,
        traverseIndex: -1,
        floatingNode: null,
        explanation: 'Reconnect: node ' + before[index - 1] + '.next = ' +
          (index + 1 < before.length ? 'node ' + before[index + 1] : 'null') + '. Bypass node ' + removedVal + '.',
        pseudocode: pc,
        pseudocodeLine: 9,
        bigO: 'O(n)',
      });
    }

    // Actually mutate
    this.items.splice(index, 1);

    // Show removed floating away
    steps.push({
      nodes: _llSnapshot(this.items),
      headIndex: this.items.length > 0 ? 0 : -1,
      traverseIndex: -1,
      floatingNode: { value: removedVal, label: 'REMOVED' },
      explanation: 'Node ' + removedVal + ' removed. List size: ' + this.items.length + '.',
      pseudocode: pc,
      pseudocodeLine: 10,
      bigO: isHead ? 'O(1)' : 'O(n)',
    });

    // Final clean
    steps.push({
      nodes: _llSnapshot(this.items),
      headIndex: this.items.length > 0 ? 0 : -1,
      traverseIndex: -1,
      floatingNode: null,
      explanation: 'Delete complete. Returned value: ' + removedVal + '.',
      pseudocode: pc,
      pseudocodeLine: -1,
      bigO: isHead ? 'O(1)' : 'O(n)',
    });

    return steps;
  }

  /* ============================
     TRAVERSE
     ============================ */
  generateTraverseSteps() {
    var steps = [];
    var pc = LL_PSEUDOCODE.traverse;

    if (this.items.length === 0) {
      steps.push({
        nodes: [],
        headIndex: -1,
        traverseIndex: -1,
        floatingNode: null,
        explanation: 'Linked list is empty! Nothing to traverse.',
        pseudocode: pc,
        pseudocodeLine: 0,
        bigO: 'O(1)',
        error: true,
      });
      return steps;
    }

    // Step 1 — start
    steps.push({
      nodes: _llSnapshot(this.items),
      headIndex: 0,
      traverseIndex: -1,
      floatingNode: null,
      explanation: 'Begin traversal from head. List has ' + this.items.length + ' node(s).',
      pseudocode: pc,
      pseudocodeLine: 1,
      bigO: 'O(n)',
    });

    // Visit each node
    for (var i = 0; i < this.items.length; i++) {
      var hi = {};
      hi[i] = 'traversing';
      // Also highlight all previously visited
      for (var p = 0; p < i; p++) {
        hi[p] = 'highlight';
      }
      steps.push({
        nodes: _llSnapshot(this.items, hi),
        headIndex: 0,
        traverseIndex: i,
        floatingNode: null,
        explanation: 'Visit node: data = ' + this.items[i] + ' (index ' + i + ').' +
          (i < this.items.length - 1 ? ' Move to next.' : ' This is the last node.'),
        pseudocode: pc,
        pseudocodeLine: 3,
        bigO: 'O(n)',
      });
    }

    // Reach NULL
    var hiAll = {};
    for (var a = 0; a < this.items.length; a++) hiAll[a] = 'highlight';
    steps.push({
      nodes: _llSnapshot(this.items, hiAll),
      headIndex: 0,
      traverseIndex: -1,
      floatingNode: null,
      explanation: 'Reached NULL. Traversal complete! Visited ' + this.items.length + ' node(s).',
      pseudocode: pc,
      pseudocodeLine: 4,
      bigO: 'O(n)',
    });

    return steps;
  }

  clear() {
    this.items = [];
  }
}
