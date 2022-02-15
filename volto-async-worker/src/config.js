/**
 * Add your config changes here.
 * @module config
 * @example
 * export default function applyConfig(config) {
 *   config.settings = {
 *     ...config.settings,
 *     port: 4300,
 *     listBlockTypes: {
 *       ...config.settings.listBlockTypes,
 *       'my-list-item',
 *    }
 * }
 */

// All your imports required for the config here BEFORE this line
import '@plone/volto/config';

const serverConfig =
  typeof __SERVER__ !== 'undefined' && __SERVER__
    ? require('./server').default
    : false;

export default function applyConfig(config) {
  // Add here your project's configuration here by modifying `config` accordingly
  config.settings.ssrBackend = 'http://localhost:3000/';

  if (serverConfig) {
    config.settings.expressMiddleware = [
      ...config.settings.expressMiddleware,
      ...serverConfig,
    ];
  }
  return config;
}
