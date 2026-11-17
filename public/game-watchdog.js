(() => {
  for (const shell of document.querySelectorAll('[data-game-shell]')) {
    const showLoadError = () => {
      if (shell.dataset.state !== 'loading') return;
      shell.dataset.state = 'error';
      for (const overlay of shell.querySelectorAll('[data-overlay]')) {
        overlay.hidden = overlay.dataset.overlay !== 'error';
      }
      for (const item of shell.querySelectorAll('[data-loading-only], [data-start-only]')) item.hidden = true;
      const message = shell.querySelector('[data-error-message]');
      if (message) message.textContent = 'The 3D game could not load. Check your connection and try again.';
      shell.querySelector('[data-action="retry"]')?.focus({ preventScroll: true });
    };
    const timeout = window.setTimeout(showLoadError, 20000);
    const observer = new MutationObserver(() => {
      if (shell.dataset.state === 'loading') return;
      window.clearTimeout(timeout);
      observer.disconnect();
    });
    observer.observe(shell, { attributes: true, attributeFilter: ['data-state'] });
    shell.querySelector('[data-action="retry"]')?.addEventListener('click', () => window.location.reload(), { once: true });
  }
})();
