function printUsage(logger)
{                 
	logger.error("USAGE:")
	logger.error("node server.js <path_to_config_file>");
	logger.error("\tWhere <path_to_config_file> is the path to a JSON configuration file");   
	logger.error("\t containing all the required keg.io config options.  Optionally, the");
	logger.error("\t config file may contain C-style comments (/* */).")
};   

// Setup dependencies
require(__dirname + "/lib/setup").ext( __dirname + "/lib");     
var	  fs = require('fs')
    , sys = require('sys')
	, http = require('http')
    , io = require('Socket.IO-node')
	, files = require('node-static')
	, router = require('choreographer').router()
    , port = (process.env.PORT || 8081)
	, keg_io = require('keg.io')
	, keg = new keg_io.Keg()
	, log4js = require('log4js')();       
                                    
// Setup our logging
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
	logger.debug(index + ': ' + val);
});                                 

// Load our commented JSON configuration file,
// and echo it
var config = JSON.parse(
	fs.readFileSync(process.argv[2]).toString().replace(
		new RegExp("\\/\\*(.|\\r|\\n)*?\\*\\/", "g"),
		"" // strip out C-style comments (/*  */)
	)
);                             
logger.debug("CONFIG:");
logger.debug(sys.inspect(config, true, null));  

// initialize serial port connection to kegerator     
keg.init(config.device,  
		 config.db_name,
		 config.twitter_enabled);    

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

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////
router.ignoreCase = true;	
/////// ADD ALL YOUR ROUTES HERE  /////////
router.get('/', function(req, res) {
	base.serveFile('/index.html', 200, {}, req, res);
})
.get('/temperatureHistory.json', function(req, res) {
	// send static sample data for now
	/*
	var result = '{"name":"tempHistory","value":[["2011-03-15 '
		+'01:29:48.666",66],["2011-03-12 '
		+'01:23:48.666",39],["2011-03-12 '
		+'01:23:47.666",39],["2011-03-12 01:23:46.666",39]]}';
	res.send(result);
	*/
		
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
});

// create http server
var server = http.createServer(router);
server.listen(port);

//Setup Socket.IO
var socket = io.listen(server);
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

logger.info('Listening on http://0.0.0.0:' + port );