/**
 * Renderer — pure rendering functions that translate step objects
 * into DOM.  Each function takes a step and a target container
 * and fills it.  Functions are stateless and can be reused by
 * any data-structure visualizer.
 */
var Renderer = {

  /* ================================================
     STACK VISUALIZATION
     ================================================ */

  /**
   * Render a stack state inside the given container.
   * Items are displayed bottom-to-top (index 0 at bottom).
   *
   * @param {object|null} step — current step object
   * @param {HTMLElement}  container
   */
  renderStack: function (step, container) {
    container.innerHTML = '';

    if (!step) {
      container.innerHTML =
        '<p class="canvas-placeholder">Perform an operation to see the visualization</p>';
      return;
    }

    var items = step.items;
    var floating = step.floatingElement;

    // Empty stack and no floating element
    if (items.length === 0 && !floating) {
      container.innerHTML = '<div class="canvas-placeholder">Stack is empty</div>';
      return;
    }

    // Root wrapper
    var scene = document.createElement('div');
    scene.className = 'stack-scene';

    // ---- Float area (above the tube) ----
    var floatArea = document.createElement('div');
    floatArea.className = 'stack-float-area';

    if (floating) {
      var isPush = floating.label === 'NEW';

      // Label text (Push / Pop)
      var label = document.createElement('div');
      label.className = 'stack-float-label ' +
        (isPush ? 'stack-float-label--push' : 'stack-float-label--pop');
      label.textContent = isPush ? 'Push' : 'Pop';
      floatArea.appendChild(label);

      // Floating node box
      var fNode = document.createElement('div');
      fNode.className = 'stack-floating-node ' +
        (isPush ? 'stack-floating-node--new' : 'stack-floating-node--removed');
      fNode.textContent = floating.value;
      floatArea.appendChild(fNode);

      // Arrow (↓ for push, ↑ for pop)
      var arrow = document.createElement('div');
      arrow.className = 'stack-arrow ' +
        (isPush ? 'stack-arrow--down' : 'stack-arrow--up');
      arrow.textContent = isPush ? '\u2B07' : '\u2B06';
      floatArea.appendChild(arrow);
    }

    scene.appendChild(floatArea);

    // ---- The tube ----
    var tube = document.createElement('div');
    tube.className = 'stack-tube';

    // Render items top-to-bottom (highest index = top of stack = first visually)
    for (var i = items.length - 1; i >= 0; i--) {
      var node = document.createElement('div');
      node.className = 'node';
      if (items[i].state && items[i].state !== 'default') {
        node.classList.add('node--' + items[i].state);
      }

      var val = document.createElement('span');
      val.className = 'node-value';
      val.textContent = items[i].value;
      node.appendChild(val);

      // Small index label on the right outside
      var idx = document.createElement('span');
      idx.className = 'node-index';
      idx.textContent = '[' + i + ']';
      node.appendChild(idx);

      tube.appendChild(node);
    }

    // If items exist, add "Top →" pointer to the top element
    if (items.length > 0) {
      var pointer = document.createElement('div');
      pointer.className = 'stack-top-pointer';
      pointer.textContent = 'Top \u2192';
      pointer.style.top = '0px';
      tube.appendChild(pointer);
    }

    scene.appendChild(tube);
    container.appendChild(scene);
  },

  /* ================================================
     ARRAY VISUALIZATION
     ================================================ */

  /**
   * Render an array state inside the given container.
   * Displayed as a vertical column of cells (like the classic index table).
   *
   * @param {object|null} step
   * @param {HTMLElement}  container
   */
  renderArray: function (step, container) {
    container.innerHTML = '';

    if (!step) {
      container.innerHTML =
        '<p class="canvas-placeholder">Perform an operation to see the visualization</p>';
      return;
    }

    var items = step.items;
    var floating = step.floatingElement;

    if (items.length === 0 && !floating) {
      container.innerHTML = '<div class="canvas-placeholder">Array is empty</div>';
      return;
    }

    var scene = document.createElement('div');
    scene.className = 'array-scene';

    // ---- Floating element (above the table) ----
    if (floating) {
      var isNew = floating.label === 'NEW';
      var floatBox = document.createElement('div');
      floatBox.className = 'array-float-area';

      var label = document.createElement('div');
      label.className = 'array-float-label ' +
        (isNew ? 'array-float-label--insert' : 'array-float-label--remove');
      label.textContent = isNew ? 'Insert' : 'Removed';
      floatBox.appendChild(label);

      var fCell = document.createElement('div');
      fCell.className = 'array-floating-cell ' +
        (isNew ? 'array-floating-cell--new' : 'array-floating-cell--removed');
      fCell.textContent = floating.value;
      floatBox.appendChild(fCell);

      var arrow = document.createElement('div');
      arrow.className = 'stack-arrow ' +
        (isNew ? 'stack-arrow--down' : 'stack-arrow--up');
      arrow.textContent = isNew ? '\u2B07' : '\u2B06';
      floatBox.appendChild(arrow);

      scene.appendChild(floatBox);
    }

    // ---- Array table: header row + data row ----
    var table = document.createElement('div');
    table.className = 'array-table';

    // Header label
    var headerLabel = document.createElement('div');
    headerLabel.className = 'array-header-label';
    headerLabel.textContent = 'Array';
    table.appendChild(headerLabel);

    // Index header row
    var indexRow = document.createElement('div');
    indexRow.className = 'array-row array-row--index';
    for (var h = 0; h < items.length; h++) {
      var idxCell = document.createElement('div');
      idxCell.className = 'array-index-cell';
      idxCell.textContent = h;
      indexRow.appendChild(idxCell);
    }
    table.appendChild(indexRow);

    // Value row
    var valRow = document.createElement('div');
    valRow.className = 'array-row array-row--value';
    for (var i = 0; i < items.length; i++) {
      var cell = document.createElement('div');
      cell.className = 'array-cell';
      if (items[i].state && items[i].state !== 'default') {
        cell.classList.add('array-cell--' + items[i].state);
      }
      cell.textContent = items[i].value;
      valRow.appendChild(cell);
    }
    table.appendChild(valRow);

    scene.appendChild(table);
    container.appendChild(scene);
  },

  /* ================================================
     QUEUE VISUALIZATION
     ================================================ */

  /**
   * Render a queue state — horizontal row of cells,
   * FRONT label on left, REAR label on right,
   * floating elements on the appropriate side.
   */
  renderQueue: function (step, container) {
    container.innerHTML = '';

    if (!step) {
      container.innerHTML =
        '<p class="canvas-placeholder">Perform an operation to see the visualization</p>';
      return;
    }

    var items = step.items;
    var floating = step.floatingElement;
    var side = step.floatSide; // 'front' | 'rear' | null

    if (items.length === 0 && !floating) {
      container.innerHTML = '<div class="canvas-placeholder">Queue is empty</div>';
      return;
    }

    var scene = document.createElement('div');
    scene.className = 'queue-scene';

    // ---- Title "Queue" with arrows ----
    var title = document.createElement('div');
    title.className = 'queue-title';
    title.innerHTML = '\u2190 <span>Queue</span> \u2192';
    scene.appendChild(title);

    // ---- Main horizontal area: [front-float] [cells] [rear-float] ----
    var row = document.createElement('div');
    row.className = 'queue-row';

    // Front floating area (dequeue side)
    var frontArea = document.createElement('div');
    frontArea.className = 'queue-float-area queue-float-area--front';
    if (floating && side === 'front') {
      var fLabel = document.createElement('div');
      fLabel.className = 'queue-float-label queue-float-label--dequeue';
      fLabel.textContent = 'FRONT';
      frontArea.appendChild(fLabel);

      var fCell = document.createElement('div');
      fCell.className = 'queue-floating-cell queue-floating-cell--removed';
      fCell.textContent = floating.value;
      frontArea.appendChild(fCell);

      var arrow = document.createElement('div');
      arrow.className = 'queue-arrow queue-arrow--dequeue';
      arrow.textContent = 'Dequeue';
      frontArea.appendChild(arrow);
    }
    row.appendChild(frontArea);

    // Cells
    var cells = document.createElement('div');
    cells.className = 'queue-cells';

    // Front label above first cell
    if (items.length > 0) {
      var frontLbl = document.createElement('div');
      frontLbl.className = 'queue-pointer queue-pointer--front';
      frontLbl.textContent = 'Front';
    }

    for (var i = 0; i < items.length; i++) {
      var cellWrap = document.createElement('div');
      cellWrap.className = 'queue-cell-wrap';

      var cell = document.createElement('div');
      cell.className = 'queue-cell';
      if (items[i].state && items[i].state !== 'default') {
        cell.classList.add('queue-cell--' + items[i].state);
      }
      cell.textContent = items[i].value;
      cellWrap.appendChild(cell);

      cells.appendChild(cellWrap);
    }
    row.appendChild(cells);

    // Rear floating area (enqueue side)
    var rearArea = document.createElement('div');
    rearArea.className = 'queue-float-area queue-float-area--rear';
    if (floating && side === 'rear') {
      var rArrow = document.createElement('div');
      rArrow.className = 'queue-arrow queue-arrow--enqueue';
      rArrow.textContent = 'Enqueue';
      rearArea.appendChild(rArrow);

      var rCell = document.createElement('div');
      rCell.className = 'queue-floating-cell queue-floating-cell--new';
      rCell.textContent = floating.value;
      rearArea.appendChild(rCell);

      var rLabel = document.createElement('div');
      rLabel.className = 'queue-float-label queue-float-label--enqueue';
      rLabel.textContent = 'REAR';
      rearArea.appendChild(rLabel);
    }
    row.appendChild(rearArea);

    scene.appendChild(row);

    // ---- Front / Rear labels below cells ----
    if (items.length > 0) {
      var labels = document.createElement('div');
      labels.className = 'queue-labels';
      var fl = document.createElement('span');
      fl.className = 'queue-label queue-label--front';
      fl.textContent = '\u2190 Front';
      var rl = document.createElement('span');
      rl.className = 'queue-label queue-label--rear';
      rl.textContent = 'Rear \u2192';
      labels.appendChild(fl);
      labels.appendChild(rl);
      scene.appendChild(labels);
    }

    container.appendChild(scene);
  },

  /* ================================================
     LINKED LIST VISUALIZATION
     ================================================ */

  /**
   * Render a linked list — each node is a [Data|Next] box,
   * connected by arrows, ending with NULL.
   * Head label above the first node.
   */
  renderLinkedList: function (step, container) {
    container.innerHTML = '';

    if (!step) {
      container.innerHTML =
        '<p class="canvas-placeholder">Perform an operation to see the visualization</p>';
      return;
    }

    var nodes = step.nodes;
    var floating = step.floatingNode;

    if (nodes.length === 0 && !floating) {
      container.innerHTML = '<div class="canvas-placeholder">Linked list is empty</div>';
      return;
    }

    var scene = document.createElement('div');
    scene.className = 'll-scene';

    // Floating node (above the chain)
    if (floating) {
      var isNew = floating.label !== 'REMOVED';
      var floatArea = document.createElement('div');
      floatArea.className = 'll-float-area';

      var fLabel = document.createElement('div');
      fLabel.className = 'll-float-label ' +
        (isNew ? 'll-float-label--new' : 'll-float-label--removed');
      fLabel.textContent = floating.label;
      floatArea.appendChild(fLabel);

      var fNode = document.createElement('div');
      fNode.className = 'll-node-box ' +
        (isNew ? 'll-node-box--new' : 'll-node-box--removed');
      var fData = document.createElement('div');
      fData.className = 'll-data';
      fData.textContent = floating.value;
      var fNext = document.createElement('div');
      fNext.className = 'll-next';
      fNext.textContent = '\u2022';
      fNode.appendChild(fData);
      fNode.appendChild(fNext);
      floatArea.appendChild(fNode);

      scene.appendChild(floatArea);
    }

    // Main chain row
    var chain = document.createElement('div');
    chain.className = 'll-chain';

    for (var i = 0; i < nodes.length; i++) {
      // Node wrapper (head label + node box)
      var wrap = document.createElement('div');
      wrap.className = 'll-node-wrap';

      // Head label above first node
      if (i === 0) {
        var headLabel = document.createElement('div');
        headLabel.className = 'll-head-label';
        headLabel.innerHTML = 'Head<br><span class="ll-head-arrow">\u2193</span>';
        wrap.appendChild(headLabel);
      }

      // The [Data | Next] box
      var box = document.createElement('div');
      box.className = 'll-node-box';
      if (nodes[i].state && nodes[i].state !== 'default') {
        box.classList.add('ll-node-box--' + nodes[i].state);
      }

      var dataCell = document.createElement('div');
      dataCell.className = 'll-data';
      dataCell.textContent = nodes[i].value;
      box.appendChild(dataCell);

      var nextCell = document.createElement('div');
      nextCell.className = 'll-next';
      nextCell.textContent = '\u2022';
      box.appendChild(nextCell);

      wrap.appendChild(box);

      // Labels under the first node: "Data" and "Next"
      if (i === 0) {
        var labels = document.createElement('div');
        labels.className = 'll-cell-labels';
        labels.innerHTML = '<span>Data</span><span>Next</span>';
        wrap.appendChild(labels);
      }

      chain.appendChild(wrap);

      // Arrow between nodes (or → NULL after last)
      var arrow = document.createElement('div');
      arrow.className = 'll-arrow';
      arrow.textContent = '\u2192';
      chain.appendChild(arrow);
    }

    // NULL terminator
    var nullEl = document.createElement('div');
    nullEl.className = 'll-null';
    nullEl.textContent = 'NULL';
    chain.appendChild(nullEl);

    scene.appendChild(chain);
    container.appendChild(scene);
  },

  /* ================================================
     SHARED COMPONENTS
     ================================================ */

  /**
   * Create a single visual node element.
   *
   * @param {*}           value
   * @param {number|null} index — shown as a small label; null hides it
   * @param {string}      state — "default"|"highlight"|"active"|"removing"|"floating"
   * @returns {HTMLElement}
   */
  _createNode: function (value, index, state) {
    var node = document.createElement('div');
    node.className = 'node';
    if (state && state !== 'default') {
      node.classList.add('node--' + state);
    }

    var valSpan = document.createElement('span');
    valSpan.className = 'node-value';
    valSpan.textContent = value;
    node.appendChild(valSpan);

    if (index !== null && index !== undefined) {
      var idxSpan = document.createElement('span');
      idxSpan.className = 'node-index';
      idxSpan.textContent = '[' + index + ']';
      node.appendChild(idxSpan);
    }

    return node;
  },

  /* ================================================
     INFO PANEL RENDERERS
     ================================================ */

  /** Render step explanation text. */
  renderExplanation: function (step, container) {
    if (!step) {
      container.innerHTML =
        '<p class="info-placeholder">Perform an operation to see step-by-step explanation</p>';
      return;
    }
    var color = step.error ? ' style="color: var(--danger)"' : '';
    container.innerHTML = '<p' + color + '>' + Renderer._esc(step.explanation) + '</p>';
  },

  /** Render pseudocode block with highlighted active line. */
  renderPseudocode: function (step, container) {
    if (!step || !step.pseudocode) {
      container.innerHTML = '';
      return;
    }
    var html = '';
    for (var i = 0; i < step.pseudocode.length; i++) {
      var active = i === step.pseudocodeLine;
      var cls = active
        ? 'pseudocode-line pseudocode-line--active'
        : 'pseudocode-line';
      html += '<div class="' + cls + '">' + Renderer._esc(step.pseudocode[i]) + '</div>';
    }
    container.innerHTML = html;
  },

  /** Render Big-O complexity badge. */
  renderComplexity: function (step, container) {
    if (!step) {
      container.innerHTML = '<span class="big-o">\u2014</span>';
      return;
    }
    container.innerHTML = '<span class="big-o">' + Renderer._esc(step.bigO) + '</span>';
  },

  /** Basic HTML-escape to prevent XSS. */
  _esc: function (text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  },
};
