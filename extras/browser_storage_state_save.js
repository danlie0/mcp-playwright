const { z } = require('playwright-core/lib/mcpBundle');
const { mkdirIfNeeded } = require('playwright-core/lib/utils');

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

const schema = z.object({
  filename: z.string().optional().describe('File name to save storage state to (relative to the output directory). Defaults to `storage-state-{timestamp}.json`.'),
});

module.exports = {
  capability: 'core',
  schema: {
    name: 'browser_storage_state_save',
    title: 'Save storage state',
    description: 'Save the current browser context storage state (cookies + localStorage) to a JSON file in the output directory.',
    inputSchema: schema,
    type: 'action',
  },
  handle: async (context, params, response) => {
    const tab = await context.ensureTab();
    const modalStates = tab.modalStates();
    if (modalStates.length) {
      response.setIncludeModalStates(modalStates);
      response.addError(`Error: Tool "${'browser_storage_state_save'}" does not handle the modal state.`);
      return;
    }

    const fileName = await response.addFile(
      params.filename || `storage-state-${timestampSlug()}.json`,
      { origin: 'llm', reason: 'Browser storage state' }
    );

    response.addCode(`await context.storageState({ path: '${fileName}' });`);
    await mkdirIfNeeded(fileName);
    await tab.page.context().storageState({ path: fileName });
  },
};

