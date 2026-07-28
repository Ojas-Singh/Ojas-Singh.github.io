/*
 * LineCraft normally refreshes its saved selection on mouseup/keyup. A held
 * Backspace key can produce many input events before the one eventual keyup,
 * leaving the saved highlight pointed at old character offsets meanwhile.
 *
 * Re-run the editor's existing selection handler after every native mutation
 * and native selection event. The synthetic key has no editing action; it
 * only invokes the React onKeyUp callback already attached to the textarea.
 */
(() => {
  const pending = new WeakSet();

  function isDraftEditor(target) {
    return target instanceof HTMLTextAreaElement &&
      target.classList.contains("highlight-input");
  }

  function refreshSelection(target) {
    if (pending.has(target)) return;
    pending.add(target);

    queueMicrotask(() => {
      pending.delete(target);
      if (!target.isConnected) return;

      target.dispatchEvent(new KeyboardEvent("keyup", {
        bubbles: true,
        key: "Unidentified",
      }));
    });
  }

  document.addEventListener("input", (event) => {
    if (isDraftEditor(event.target)) refreshSelection(event.target);
  }, true);

  document.addEventListener("select", (event) => {
    if (isDraftEditor(event.target)) refreshSelection(event.target);
  }, true);
})();
