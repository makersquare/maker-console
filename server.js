
////////////////////////////////////
//SERVER FOR TESTING MAKER-CONSOLE//
////////////////////////////////////

var express = require('express'),
app = express();

// serve assets

app.use(express.static(__dirname + '/lib/style'));
app.get('/maker-console.min.js', function(req, res){
 res.sendfile(__dirname + '/maker-console.min.js');
});
//route for test html file
app.get('/', function(req, res){
  res.sendfile(__dirname + '/test.html');
});

// listen on the port assigned or default to 3000
app.listen(process.env.PORT || 3000)

