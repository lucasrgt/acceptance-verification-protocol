// The GEOMETRY tier's public surface (`@aerofortress/assay/design/browser`) — the design
// archetypes that need a real layout engine. Kept out of `./design` so importing the jsdom
// tier never pulls puppeteer-core (an optional substrate) into the consumer's graph.
export { verifyDesignBrowser, type BrowserDesignOptions } from './browser-verify';
export { openBrowser, chromePath } from './browser';
export { loadSurface, loadMarkup } from './surface';
export type { ReactDesignSubject } from './subject';
