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

import { defineMessages } from 'react-intl';

// All your imports required for the config here BEFORE this line
import '@plone/volto/config';

const messages = defineMessages({
  headline: {
    id: 'Headline',
    defaultMessage: 'Headline',
  },
});

export default function applyConfig(config) {
  // Add here your project's configuration here by modifying `config` accordingly
  config.blocks.blocksConfig.listing.schemaEnhancer = ({ schema, formData, intl }) => {
    schema.fieldsets[0].fields.unshift('headline');
    schema.properties.headline = {
      title: intl.formatMessage(messages.headline),
    };
    return schema;
  }
  return config;
}
