//setup Dependencies
require(__dirname + "/lib/setup").ext( __dirname + "/lib").ext( __dirname + "/lib/express/support");
var connect = require('connect')
	, fs = require('fs')
    , express = require('express')
    , sys = require('sys')
    , io = require('Socket.IO-node')
    , port = (process.env.PORT || 8081)
	, keg_io = require('keg.io')
	, keg = new keg_io.Keg();

// initialize serial port connection to kegerator
keg.init('/dev/cu.usbserial-A400fGxO');

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.use(connect.bodyDecoder());
    server.use(connect.staticProvider(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.ejs', { locals: { 
                  header: '#Header#'
                 ,footer: '#Footer#'
                 ,title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.ejs', { locals: { 
                  header: '#Header#'
                 ,footer: '#Footer#'
                 ,title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Setup Socket.IO
var io = io.listen(server);
io.on('connection', function(client){
	console.log('Client Connected');
	
	keg.on('temp', function(data) {
		if (data) {
			client.send(JSON.stringify({ name: 'temp', value: data }));
		}
	});
	
	keg.on('tag', function(data) {
		if (data) {
			client.send(JSON.stringify({ name: 'tag', value: data }));
		}
	});
	
	keg.on('flow', function(data) {
		if (data) {
			client.send(JSON.stringify({ name: 'flow', value: data }));
		}
	});
	
	client.on('disconnect', function(){
		console.log('Client Disconnected.');
	});
});


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
	
	
  res.render('index.ejs', {
    locals : { 
              header: '#Header#'
             ,footer: '#Footer#'
             ,title : 'Page Title'
             ,description: 'Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
});


//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Listening on http://0.0.0.0:' + port );
