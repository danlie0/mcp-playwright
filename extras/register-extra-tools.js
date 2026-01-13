function registerExtraTools() {
  if (globalThis.__playwrightMcpExtraToolsRegistered)
    return;
  globalThis.__playwrightMcpExtraToolsRegistered = true;

  const { browserTools } = require('playwright/lib/mcp/browser/tools');
  const sweepTool = require('./browser_screenshot_sweep');
  const storageStateSaveTool = require('./browser_storage_state_save');

  if (!browserTools.some(t => t?.schema?.name === sweepTool?.schema?.name))
    browserTools.push(sweepTool);
  if (!browserTools.some(t => t?.schema?.name === storageStateSaveTool?.schema?.name))
    browserTools.push(storageStateSaveTool);
}

module.exports = { registerExtraTools };
