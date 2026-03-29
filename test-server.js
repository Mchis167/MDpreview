const server = require('./server/index');
server.start().then(port => {
  console.log('Test server started on port', port);
  // Set watch dir to project root for testing
  server.setWatchDir(process.cwd());
});
