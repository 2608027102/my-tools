const PluginManager = require('./src/plugin/PluginManager');
const manager = new PluginManager();
const plugins = manager.loadPlugins();
console.log('Loaded plugins:', plugins.length);
plugins.forEach(p => {
  console.log('-', p.name, '(', p.id, ')');
  if (p.commands && p.commands.length > 0) {
    console.log('  Commands:');
    p.commands.forEach(cmd => {
      console.log('   -', cmd.name, '(', cmd.id, ')');
    });
  }
});
