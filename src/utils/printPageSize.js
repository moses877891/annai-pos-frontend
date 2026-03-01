 // --- helper: inject temporary @page size for this print job ---

export function withPrintPageSize(size, printFn) {
  const style = document.createElement('style');
  style.setAttribute('data-print-pagesize', 'true');
  style.media = 'print';
  style.textContent = `@page { size: ${size}; margin: 0; }`;
  document.head.appendChild(style);

  const cleanup = () => {
    document.querySelectorAll('style[data-print-pagesize]').forEach(s => s.remove());
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup, { once: true });

  printFn();
}