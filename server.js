// ## About
// **keg.io** is a techonology-laden kegerator, developed by VNC employees, to
// satisfy their nerdiest beer-drinking needs.  It's built on node.js, and utilizes
// an arduino microcontroller for interfacing with the actual keg HW and sensors.
//                                                                                   
// It's got several cool features, including:  
//
// * Gravatar support 
// * Twitter integration

// ##Setup dependencies 
require(__dirname + "/lib/setup").ext( __dirname + "/lib");     
var	  fs = require('fs')
	, sys = require('sys')
	, http = require('http')
	, url = require('url')
	, querystring = require('querystring')
	, io = require('Socket.IO-node')
	, files = require('node-static')
	, router = require('choreographer').router()
	, keg_io = require('keg.io')
	, keg = new keg_io.Keg()
	, log4js = require('log4js')();       

function printUsage(logger)
{                
 	logger.error("USAGE:")
 	logger.error("node server.js <path_to_config_file>");
 	logger.error("\tWhere <path_to_config_file> is the path to a JSON configuration file");   
 	logger.error("\t containing all the required keg.io config options.  Optionally, the");
 	logger.error("\t config file may contain C-style comments (/* */).")
};   
                                    
// Setup our logging     
// We're using [**log4js**](http://log4js.berlios.de/) for all of our logging  
// The logging verbosity (particularly to the console for debugging) can be changed via the 
// **conf/log4js.json** configuration file, using standard log4js log levels:
//
// * OFF
// * FATAL
// * ERROR
// * WARN
// * INFO
// * DEBUG
// * TRACE
// * ALL
log4js.configure('conf/log4js.json');
var logger = log4js.getLogger('default');   

// Make sure we got all the required cmdline args
if (process.argv.length < 3)
{  
	printUsage(logger);
	process.exit(1);
}
	
// echo all the args                   
logger.debug("ARGS:");
process.argv.forEach(function (val, index, array) {
	logger.debug(index + ": " + val);
});                                 

// Load our commented JSON configuration file, and echo it
var config = JSON.parse(
	fs.readFileSync(process.argv[2]).toString().replace(
		new RegExp("\\/\\*(.|\\r|\\n)*?\\*\\/", "g"),
		"" // strip out C-style comments (/*  */)
	)
);                             
logger.debug("CONFIG:");   
for(var prop in config) {
    if(config.hasOwnProperty(prop))
        logger.debug(prop + ": " + config[prop]);
}
//logger.debug(sys.inspect(config, true, null));  

// initialize serial port connection to kegerator     
keg.init(logger,
		 config.device,  
		 config.db_name,
		 config.twitter_enabled,
		 config.twitter_consumer_key,
		 config.twitter_consumer_secret,
		 config.twitter_access_token_key,
		 config.twitter_access_token_secret,
		 config.admin_ui_password,
		 config.high_temp_threshold);    

//
// Create several node-static server instances to serve the './public' folder
//
var base = new(files.Server)('./static');
var css = new(files.Server)('./static/css');
var css2 = new(files.Server)('./static/css/ui-lightness');
var css3 = new(files.Server)('./static/css/ui-lightness/images');
var images = new(files.Server)('./static/images');
var js = new(files.Server)('./static/js');
var js2 = new(files.Server)('./static/js/profiling');
var docs = new(files.Server)('./static/docs');


// ##Routes
// We're using [**choreographer**](https://github.com/laughinghan/choreographer) for our request routing
router.ignoreCase = true;	   

/////// ADD ALL YOUR ROUTES HERE  /////////
router.get('/', function(req, res) {
	base.serveFile('/index.html', 200, {}, req, res);
})                  
.get('/new', function(req, res) {
	base.serveFile('/index1.html', 200, {}, req, res);
})
.get('/socketPort.json', function(req, res) {
 	 res.writeHead(200, {'Content-Type': 'text/plain'});
	 res.end(config.socket_client_connect_port);
})    
.get('/temperatureHistory.json', function(req, res) {
	keg.getTemperatureTrend(function(result) {
		// For some reason, the following line doesn't work with the highcharts.
		//res.send(result, {'Content-Type': 'text/json'}, 200);
		//console.log(result);
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end(result);
	});
})          
.get('/pourHistory.json', function(req, res) {
	keg.getPourTrend(function(result) {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end(result);
	});
})     
.get('/pourHistoryAllTime.json', function(req, res) {
	keg.getPourTrendAllTime(function(result) {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end(result);
	});
})  
.get('/kegInfo.json', function(req, res) {
	keg.getKegInfo(function(result) {   
	   res.writeHead(200, {'Content-Type': 'text/plain'});
	   res.end(result);                 
	});
})
.get('/addUser.json',function(req,res){
	keg.addUser(
		querystring.parse(req.url.split('?')[1])
		,function(result){
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(result);
		});	
})
.get('/css/ui-lightness/*', function(req, res, file) {
	css2.serveFile(file, 200, {}, req, res);
})
.get('/css/ui-lightness/images/*', function(req, res, file) {
	css3.serveFile(file, 200, {}, req, res);
})
.get('/css/*', function(req, res, file) {
	css.serveFile(file, 200, {}, req, res);
})
.get('/images/*', function(req, res, file) {
	images.serveFile(file, 200, {}, req,res);
})
.get('/js/profiling/*', function(req, res, file) {
	js2.serveFile(file, 200, {}, req, res);
})
.get('/js/*', function(req, res, file) {
	js.serveFile(file, 200, {}, req,res);
})
.get('/docs/*', function(req, res, file) {
	docs.serveFile(file, 200, {}, req, res);
});

// Create an HTTP server
var server = http.createServer(router);
server.listen(config.http_port);
                                  
// Create a server for the web socket
// Depending on the port assignments, this 
// could be the same server that we use for HTTP
var socketServer = server;
if (config.http_port != config.socket_listen_port) 
{
	socketServer = http.createServer();
	socketServer.listen(config.socket_listen_port);
}                          

// Setup Socket.IO
var socket = io.listen(socketServer);
socket.on('connection', function(client){
	logger.info('Client Connected');
	
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
	
	keg.on('pour', function(data){
		if (data)
		{
			client.send(JSON.stringify({name: 'pour', value: data }));
		}
	});
	keg.on('deny', function(data){
		if (data)
		{
			client.send(JSON.stringify({name: 'deny', value: data }));
		}
	});
	keg.on('remaining', function(data){
		if (data)
		{
			client.send(JSON.stringify({name: 'remaining', value: data }));
		}
	});
	client.on('disconnect', function(){
		logger.info('Client Disconnected.');
	});
});

logger.info('Listening for HTTP requests on http://0.0.0.0:' + config.http_port );  
logger.info('Listening for web socket requests on http://0.0.0.0:' + config.socket_listen_port );   
logger.info('Telling clients to connect web socket on port: ' + config.socket_client_connect_port );   