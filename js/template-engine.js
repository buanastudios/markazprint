/**
 * TIBYAN PRINT SERVICE v2.0
 * template-engine.js - Dynamic Component Template Loader Engine
 */

const TemplateEngine = {
  cache: {},

  /**
   * Loads an HTML component template from file or cache, and renders it into a container DOM element.
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
        const response = await fetch(templatePath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} when fetching template ${templatePath}`);
        }
        htmlContent = await response.text();
        this.cache[templatePath] = htmlContent;
      }

      container.innerHTML = htmlContent;
    } catch (err) {
      console.error(`TemplateEngine: Failed to load '${templatePath}':`, err);
      // Fallback for file:// protocol or unserved paths
      const inlineTmpl = document.querySelector(`template[data-src="${templatePath}"]`);
      if (inlineTmpl) {
        container.innerHTML = inlineTmpl.innerHTML;
      }
    }
  },

  /**
   * Batch loads core layout component templates
   */
  async initLayoutComponents() {
    await Promise.all([
      this.renderComponent('views/header.html', 'header-slot'),
      this.renderComponent('views/nav-mobile.html', 'nav-mobile-slot'),
      this.renderComponent('views/dashboard.html', 'view-dashboard-slot'),
      this.renderComponent('views/request.html', 'view-request-slot'),
      this.renderComponent('views/status.html', 'view-status-slot'),
      this.renderComponent('views/modals.html', 'modals-slot')
    ]);
  }
};
