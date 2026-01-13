const fs = require('fs');

const { mkdirIfNeeded, formatObject } = require('playwright-core/lib/utils');
const { z } = require('playwright-core/lib/mcpBundle');

const VIEWPORT_PRESETS = {
  desktop: { width: 1440, height: 900, title: 'Desktop (1440x900)' },
  tablet: { width: 820, height: 1180, title: 'Tablet (820x1180)' },
  mobile: { width: 390, height: 844, title: 'Mobile (390x844)' },
};

function sanitizeFileSegment(value) {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return cleaned.replace(/^-+/, '').replace(/-+$/, '') || 'screenshot';
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

const schema = z.object({
  url: z.string().optional().describe('Optional URL to navigate to before capturing screenshots. If omitted, uses the current page.'),
  presets: z.array(z.enum(['desktop', 'tablet', 'mobile'])).default(['desktop', 'mobile']).describe('Viewport presets to capture.'),
  viewports: z.array(z.object({
    name: z.string().optional().describe('Optional name used in the filename.'),
    width: z.number().describe('Viewport width in CSS pixels.'),
    height: z.number().describe('Viewport height in CSS pixels.'),
  })).optional().describe('Additional custom viewports to capture.'),
  fullPage: z.boolean().default(true).describe('Capture the full scrollable page.'),
  type: z.enum(['png', 'jpeg']).default('png').describe('Image format for screenshots.'),
  prefix: z.string().optional().describe('Filename prefix (relative to the output directory).'),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load').describe('Navigation waitUntil when url is provided.'),
  delayMs: z.number().default(250).describe('Delay (ms) after resizing before taking each screenshot.'),
  embedImages: z.boolean().default(false).describe('Include images inline in the MCP response (can be large).'),
  restoreViewport: z.boolean().default(true).describe('Attempt to restore the original viewport after the sweep.'),
});

module.exports = {
  capability: 'core',
  schema: {
    name: 'browser_screenshot_sweep',
    title: 'Screenshot sweep',
    description: 'Capture multiple screenshots across viewport presets (desktop/tablet/mobile) and save them to the output directory.',
    inputSchema: schema,
    type: 'action',
  },
  handle: async (context, params, response) => {
    const tab = await context.ensureTab();
    const modalStates = tab.modalStates();
    if (modalStates.length) {
      response.setIncludeModalStates(modalStates);
      response.addError(`Error: Tool "${'browser_screenshot_sweep'}" does not handle the modal state.`);
      return;
    }

    const fileType = params.type || 'png';
    const options = {
      type: fileType,
      quality: fileType === 'png' ? undefined : 90,
      scale: 'css',
      ...(params.fullPage !== undefined ? { fullPage: params.fullPage } : undefined),
    };

    const sweepStamp = timestampSlug();
    const prefix = params.prefix ? sanitizeFileSegment(params.prefix) : 'sweep';

    const initialViewport = tab.page.viewportSize();
    const initialInner = initialViewport ? null : await tab.page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })).catch(() => null);

    if (params.url) {
      response.addCode(`await page.goto('${params.url}', { waitUntil: '${params.waitUntil}' });`);
      await tab.page.goto(params.url, { waitUntil: params.waitUntil });
    }

    const viewports = [];
    for (const preset of params.presets || []) {
      const p = VIEWPORT_PRESETS[preset];
      if (p)
        viewports.push({ name: preset, ...p });
    }
    for (const vp of params.viewports || [])
      viewports.push({ name: vp.name || `${vp.width}x${vp.height}`, width: vp.width, height: vp.height, title: `${vp.width}x${vp.height}` });

    if (!viewports.length)
      throw new Error('No viewports to capture. Provide presets and/or viewports.');

    let i = 0;
    for (const vp of viewports) {
      const viewportLabel = vp.name || `${vp.width}x${vp.height}`;
      response.addCode(`await page.setViewportSize({ width: ${vp.width}, height: ${vp.height} });`);
      await tab.page.setViewportSize({ width: vp.width, height: vp.height });
      if (params.delayMs) {
        response.addCode(`await page.waitForTimeout(${params.delayMs});`);
        await tab.page.waitForTimeout(params.delayMs);
      }

      const safeLabel = sanitizeFileSegment(viewportLabel);
      const suggestedFileName = `${prefix}-${sweepStamp}-${String(++i).padStart(2, '0')}-${safeLabel}.${fileType}`;
      const fileName = await response.addFile(suggestedFileName, { origin: 'llm', reason: `Screenshot: ${vp.title || viewportLabel}` });
      response.addCode(`await page.screenshot(${formatObject(options)});`);

      const buffer = await tab.page.screenshot(options);
      await mkdirIfNeeded(fileName);
      await fs.promises.writeFile(fileName, buffer);

      if (params.embedImages) {
        response.addImage({
          contentType: fileType === 'png' ? 'image/png' : 'image/jpeg',
          data: buffer,
        });
      }
    }

    if (params.restoreViewport) {
      if (initialViewport) {
        response.addCode(`await page.setViewportSize({ width: ${initialViewport.width}, height: ${initialViewport.height} });`);
        await tab.page.setViewportSize(initialViewport);
      } else if (initialInner) {
        response.addCode(`await page.setViewportSize({ width: ${initialInner.width}, height: ${initialInner.height} });`);
        await tab.page.setViewportSize(initialInner);
      }
    }
  },
};
