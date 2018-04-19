
const path = require('path');

const noteRoutes = require('./browser_routes');

module.exports = function(app, db) {
  noteRoutes(app, db);
  // Other route groups could go here, in the future

    app.get('/test', function(req, res) {
        res.sendFile(path.join(__dirname + '/../../test/index.html'));
    });

};