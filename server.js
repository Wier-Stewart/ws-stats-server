
const express        = require('express');
//const MongoClient    = require('mongodb').MongoClient;
const bodyParser     = require('body-parser');
const app            = express();

const port = 8000;


// jQuery.ajax is sending: Content-Type: application/x-www-form-urlencoded; charset=UTF-8
app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded; extended is *terrible* at parsing json: use JSON.parse.

require('./app/routes')(app, {});

app.listen(port, () => {
  console.log('Listening on http://localhost:' + port);
});