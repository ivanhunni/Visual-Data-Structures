/**
 * app.js — Main controller for the Visualizer page.
 *
 * Responsibilities:
 *   1. Read the ?ds= query parameter to pick the data structure.
 *   2. Wire the data-structure class → AnimationEngine → Renderer.
 *   3. Set up all button / input event listeners.
 */
(function () {
  'use strict';

  /* ---- DOM References ---- */
  var canvas        = document.getElementById('visualization');
  var explanationEl = document.getElementById('explanation');
  var pseudocodeEl  = document.getElementById('pseudocode');
  var complexityEl  = document.getElementById('complexity');
  var controlsEl    = document.getElementById('operation-controls');
  var stepIndicator = document.getElementById('step-indicator');
  var dsNameEl      = document.getElementById('ds-name');

  var btnPlay        = document.getElementById('btn-play');
  var btnStepForward = document.getElementById('btn-step-forward');
  var btnStepBack    = document.getElementById('btn-step-back');
  var btnReset       = document.getElementById('btn-reset');
  var btnClear       = document.getElementById('btn-clear');
  var speedSlider    = document.getElementById('speed-slider');
  var speedValue     = document.getElementById('speed-value');

  /* ---- Determine which DS from query string ---- */
  var params = new URLSearchParams(window.location.search);
  var dsType = (params.get('ds') || 'stack').toLowerCase();

  /* ---- State ---- */
  var stack = new StackDS();
  var arr   = (typeof ArrayDS !== 'undefined') ? new ArrayDS() : null;
  var queue = (typeof QueueDS !== 'undefined') ? new QueueDS() : null;
  var ll    = (typeof LinkedListDS !== 'undefined') ? new LinkedListDS() : null;

  /* ---- Render callback (called by the engine on every change) ---- */
  function render(state) {
    var step      = state.step;
    var index     = state.index;
    var total     = state.total;
    var isPlaying = state.isPlaying;

    // Visualization — pick the right renderer
    if (dsType === 'array') {
      Renderer.renderArray(step, canvas);
    } else if (dsType === 'queue') {
      Renderer.renderQueue(step, canvas);
    } else if (dsType === 'linkedlist') {
      Renderer.renderLinkedList(step, canvas);
    } else {
      Renderer.renderStack(step, canvas);
    }

    // Info panels
    Renderer.renderExplanation(step, explanationEl);
    Renderer.renderPseudocode(step, pseudocodeEl);
    Renderer.renderComplexity(step, complexityEl);

    // Step counter
    stepIndicator.textContent =
      total > 0
        ? 'Step ' + (index + 1) + ' / ' + total
        : 'No steps';

    // Play/Pause icon
    btnPlay.textContent = isPlaying ? '\u23F8' : '\u25B6';
    btnPlay.title       = isPlaying ? 'Pause' : 'Play';

    // Enable / disable nav buttons
    btnStepBack.disabled    = index <= 0;
    btnStepForward.disabled = index >= total - 1;
    btnPlay.disabled        = total === 0;
    btnReset.disabled       = total === 0;
  }

  /* ---- Animation Engine ---- */
  var engine = new AnimationEngine(render);

  /* ---- Build Stack operation controls ---- */
  function setupStackControls() {
    dsNameEl.textContent = 'Stack';

    controlsEl.innerHTML =
      '<div class="operation-row">' +
      '  <input type="text" class="input" id="input-value" placeholder="Values (e.g. 1, 2, 3)" autocomplete="off">' +
      '  <button class="btn btn--primary" id="btn-push">Push</button>' +
      '</div>' +
      '<div class="operation-row">' +
      '  <button class="btn" id="btn-pop" style="flex:1">Pop</button>' +
      '  <button class="btn" id="btn-peek" style="flex:1">Peek</button>' +
      '</div>';

    // Push — supports multiple comma-separated values
    document.getElementById('btn-push').addEventListener('click', function () {
      var input = document.getElementById('input-value');
      var raw   = input.value.trim();
      if (raw === '') return;

      // Split by comma, filter empty entries
      var parts = raw.split(',');
      var values = [];
      for (var i = 0; i < parts.length; i++) {
        var v = parts[i].trim();
        if (v !== '') {
          values.push(isNaN(Number(v)) ? v : Number(v));
        }
      }
      if (values.length === 0) return;

      // Generate steps for all values and concatenate them
      var allSteps = [];
      for (var j = 0; j < values.length; j++) {
        var steps = stack.generatePushSteps(values[j]);
        for (var k = 0; k < steps.length; k++) {
          allSteps.push(steps[k]);
        }
      }
      engine.loadSteps(allSteps);
      input.value = '';
      input.focus();
    });

    // Pop
    document.getElementById('btn-pop').addEventListener('click', function () {
      engine.loadSteps(stack.generatePopSteps());
    });

    // Peek
    document.getElementById('btn-peek').addEventListener('click', function () {
      engine.loadSteps(stack.generatePeekSteps());
    });

    // Enter key shortcut on input
    document.getElementById('input-value').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        document.getElementById('btn-push').click();
      }
    });
  }

  /* ---- Animation control listeners ---- */

  btnPlay.addEventListener('click', function () {
    engine.isPlaying ? engine.pause() : engine.play();
  });

  btnStepForward.addEventListener('click', function () {
    engine.pause();
    engine.stepForward();
  });

  btnStepBack.addEventListener('click', function () {
    engine.pause();
    engine.stepBackward();
  });

  btnReset.addEventListener('click', function () {
    engine.stop();
  });

  btnClear.addEventListener('click', function () {
    if (dsType === 'array' && arr) {
      arr.clear();
    } else if (dsType === 'queue' && queue) {
      queue.clear();
    } else if (dsType === 'linkedlist' && ll) {
      ll.clear();
    } else {
      stack.clear();
    }
    engine.reset();
    render({ step: null, index: 0, total: 0, isPlaying: false });
  });

  speedSlider.addEventListener('input', function () {
    var val = Number(this.value);
    engine.setSpeed(val);
    speedValue.textContent = val + 'ms';
  });

  /* ---- Keyboard shortcuts ---- */
  document.addEventListener('keydown', function (e) {
    // Don't intercept when typing in an input
    if (e.target.tagName === 'INPUT') return;

    switch (e.key) {
      case 'ArrowRight':
        engine.pause();
        engine.stepForward();
        break;
      case 'ArrowLeft':
        engine.pause();
        engine.stepBackward();
        break;
      case ' ':
        e.preventDefault();
        engine.isPlaying ? engine.pause() : engine.play();
        break;
    }
  });

  /* ---- Build Array operation controls ---- */
  function setupArrayControls() {
    dsNameEl.textContent = 'Array';

    controlsEl.innerHTML =
      '<div class="operation-row">' +
      '  <input type="text" class="input" id="input-value" placeholder="Values (e.g. 1, 2, 3)" autocomplete="off">' +
      '</div>' +
      '<div class="operation-row">' +
      '  <input type="number" class="input" id="input-index" placeholder="Index" min="0" style="width:80px">' +
      '  <button class="btn btn--primary" id="btn-insert" style="flex:1">Insert</button>' +
      '</div>' +
      '<div class="operation-row">' +
      '  <input type="number" class="input" id="input-del-index" placeholder="Index" min="0" style="width:80px">' +
      '  <button class="btn btn--danger" id="btn-delete" style="flex:1">Delete</button>' +
      '</div>' +
      '<div class="operation-row">' +
      '  <input type="number" class="input" id="input-acc-index" placeholder="Index" min="0" style="width:80px">' +
      '  <button class="btn" id="btn-access" style="flex:1">Access</button>' +
      '</div>';

    // Insert — supports multiple comma-separated values
    document.getElementById('btn-insert').addEventListener('click', function () {
      var valInput = document.getElementById('input-value');
      var idxInput = document.getElementById('input-index');
      var rawVals  = valInput.value.trim();
      if (rawVals === '') return;

      var parts = rawVals.split(',');
      var values = [];
      for (var i = 0; i < parts.length; i++) {
        var v = parts[i].trim();
        if (v !== '') values.push(isNaN(Number(v)) ? v : Number(v));
      }
      if (values.length === 0) return;

      var baseIndex = idxInput.value.trim() !== '' ? parseInt(idxInput.value, 10) : arr.items.length;

      var allSteps = [];
      for (var j = 0; j < values.length; j++) {
        var idx = baseIndex + j;
        var steps = arr.generateInsertSteps(idx, values[j]);
        for (var k = 0; k < steps.length; k++) allSteps.push(steps[k]);
      }
      engine.loadSteps(allSteps);
      valInput.value = '';
      idxInput.value = '';
      valInput.focus();
    });

    // Delete
    document.getElementById('btn-delete').addEventListener('click', function () {
      var idxInput = document.getElementById('input-del-index');
      var idx = idxInput.value.trim() !== '' ? parseInt(idxInput.value, 10) : arr.items.length - 1;
      engine.loadSteps(arr.generateDeleteSteps(idx));
      idxInput.value = '';
    });

    // Access
    document.getElementById('btn-access').addEventListener('click', function () {
      var idxInput = document.getElementById('input-acc-index');
      var idx = parseInt(idxInput.value, 10);
      if (isNaN(idx)) return;
      engine.loadSteps(arr.generateAccessSteps(idx));
      idxInput.value = '';
    });

    // Enter key on value input triggers insert
    document.getElementById('input-value').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btn-insert').click();
    });
  }

  /* ---- Build Queue operation controls ---- */
  function setupQueueControls() {
    dsNameEl.textContent = 'Queue';

    controlsEl.innerHTML =
      '<div class="operation-row">' +
      '  <input type="text" class="input" id="input-value" placeholder="Values (e.g. 1, 2, 3)" autocomplete="off">' +
      '  <button class="btn btn--primary" id="btn-enqueue">Enqueue</button>' +
      '</div>' +
      '<div class="operation-row">' +
      '  <button class="btn btn--danger" id="btn-dequeue" style="flex:1">Dequeue</button>' +
      '</div>';

    // Enqueue — supports multiple comma-separated values
    document.getElementById('btn-enqueue').addEventListener('click', function () {
      var input = document.getElementById('input-value');
      var raw   = input.value.trim();
      if (raw === '') return;

      var parts = raw.split(',');
      var values = [];
      for (var i = 0; i < parts.length; i++) {
        var v = parts[i].trim();
        if (v !== '') values.push(isNaN(Number(v)) ? v : Number(v));
      }
      if (values.length === 0) return;

      var allSteps = [];
      for (var j = 0; j < values.length; j++) {
        var steps = queue.generateEnqueueSteps(values[j]);
        for (var k = 0; k < steps.length; k++) allSteps.push(steps[k]);
      }
      engine.loadSteps(allSteps);
      input.value = '';
      input.focus();
    });

    // Dequeue
    document.getElementById('btn-dequeue').addEventListener('click', function () {
      engine.loadSteps(queue.generateDequeueSteps());
    });

    // Enter key
    document.getElementById('input-value').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btn-enqueue').click();
    });
  }

  /* ---- Build Linked List operation controls ---- */
  function setupLinkedListControls() {
    dsNameEl.textContent = 'Linked List';

    controlsEl.innerHTML =
      '<div class="operation-row">' +
      '  <input type="text" class="input" id="input-value" placeholder="Values (e.g. A, B, C)" autocomplete="off">' +
      '</div>' +
      '<div class="operation-row">' +
      '  <input type="number" class="input" id="input-index" placeholder="Index" min="0" style="width:80px">' +
      '  <button class="btn btn--primary" id="btn-insert" style="flex:1">Insert</button>' +
      '</div>' +
      '<div class="operation-row">' +
      '  <input type="number" class="input" id="input-del-index" placeholder="Index" min="0" style="width:80px">' +
      '  <button class="btn btn--danger" id="btn-delete" style="flex:1">Delete</button>' +
      '</div>' +
      '<div class="operation-row">' +
      '  <button class="btn" id="btn-traverse" style="flex:1">Traverse</button>' +
      '</div>';

    // Insert — supports multiple comma-separated values
    document.getElementById('btn-insert').addEventListener('click', function () {
      var valInput = document.getElementById('input-value');
      var idxInput = document.getElementById('input-index');
      var rawVals  = valInput.value.trim();
      if (rawVals === '') return;

      var parts = rawVals.split(',');
      var values = [];
      for (var i = 0; i < parts.length; i++) {
        var v = parts[i].trim();
        if (v !== '') values.push(isNaN(Number(v)) ? v : Number(v));
      }
      if (values.length === 0) return;

      var baseIndex = idxInput.value.trim() !== '' ? parseInt(idxInput.value, 10) : ll.items.length;

      var allSteps = [];
      for (var j = 0; j < values.length; j++) {
        var idx = baseIndex + j;
        var steps = ll.generateInsertSteps(idx, values[j]);
        for (var k = 0; k < steps.length; k++) allSteps.push(steps[k]);
      }
      engine.loadSteps(allSteps);
      valInput.value = '';
      idxInput.value = '';
      valInput.focus();
    });

    // Delete
    document.getElementById('btn-delete').addEventListener('click', function () {
      var idxInput = document.getElementById('input-del-index');
      var idx = idxInput.value.trim() !== '' ? parseInt(idxInput.value, 10) : ll.items.length - 1;
      engine.loadSteps(ll.generateDeleteSteps(idx));
      idxInput.value = '';
    });

    // Traverse
    document.getElementById('btn-traverse').addEventListener('click', function () {
      engine.loadSteps(ll.generateTraverseSteps());
    });

    // Enter key
    document.getElementById('input-value').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btn-insert').click();
    });
  }

  /* ---- Initialize ---- */
  if (dsType === 'array' && arr) {
    setupArrayControls();
  } else if (dsType === 'queue' && queue) {
    setupQueueControls();
  } else if (dsType === 'linkedlist' && ll) {
    setupLinkedListControls();
  } else {
    setupStackControls();
  }
  render({ step: null, index: 0, total: 0, isPlaying: false });
})();
