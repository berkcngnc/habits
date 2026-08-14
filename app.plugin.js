const { withStringsXml } = require('@expo/config-plugins');

module.exports = function withCustomAppName(config) {
  return withStringsXml(config, (config) => {
    const strings = config.modResults.resources.string || [];
    const entry = strings.find((s) => s.$.name === 'app_name');
    if (entry) {
      entry._ = 'habits.';
    } else {
      strings.push({ $: { name: 'app_name' }, _: 'habits.' });
    }
    config.modResults.resources.string = strings;
    return config;
  });
};
