/**
 * MARKAZ PRINTING v3.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * template-engine.js - Dynamic Component Template Loader Engine
 *
 * Loading strategy (fastest first):
 *  1. Inline <template data-src="path"> tags embedded in index.html  → 0 network requests
 *  2. In-memory cache (already fetched this session)                 → 0 network requests
 *  3. fetch() from server                                            → 1 network request
 */

const TemplateEngine = {
  cache: {},

  /**
   * Loads an HTML component template and renders it into a container DOM element.
   * Checks inline <template> tags first to avoid network round-trips.
   */
  async renderComponent(templatePath, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`TemplateEngine: Target container '#${containerId}' not found.`);
      return;
    }

    try {
      let htmlContent = this.cache[templatePath];

      if (!htmlContent) {
        // 1. Check for inline <template data-src="..."> in the page first
        const inlineTmpl = document.querySelector(`template[data-src="${templatePath}"]`);
        if (inlineTmpl) {
          htmlContent = inlineTmpl.innerHTML;
        } else {
          // 2. Fall back to network fetch
          const response = await fetch(templatePath);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} when fetching template ${templatePath}`);
          }
          htmlContent = await response.text();
        }
        this.cache[templatePath] = htmlContent;
      }

      container.innerHTML = htmlContent;
    } catch (err) {
      console.error(`TemplateEngine: Failed to load '${templatePath}':`, err);
    }
  },

  /**
   * Batch loads all core layout component templates in parallel.
   */
  async initLayoutComponents() {
    await Promise.all([
      this.renderComponent('views/header.html',     'header-slot'),
      this.renderComponent('views/nav-mobile.html', 'nav-mobile-slot'),
      this.renderComponent('views/dashboard.html',  'view-dashboard-slot'),
      this.renderComponent('views/request.html',    'view-request-slot'),
      this.renderComponent('views/status.html',     'view-status-slot'),
      this.renderComponent('views/modals.html',     'modals-slot')
    ]);
  }
};

