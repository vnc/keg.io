//setup Dependencies
require(__dirname + "/lib/setup").ext( __dirname + "/lib");
var	  fs = require('fs')
    , sys = require('sys')
	, http = require('http')
    , io = require('Socket.IO-node')
	, files = require('node-static')
	, router = require('choreographer').router()
    , port = (process.env.PORT || 8081)
	, keg_io = require('keg.io')
	, keg = new keg_io.Keg();

// initialize serial port connection to kegerator     

// This is the "spare" arduino:
// keg.init("/dev/cu.usbserial-A400fGxO");

// This is the arduino attached to the kegerator
//keg.init("/dev/cu.usbserial-A400fOlX");

/*  The "protocol" we're using to communicate with the arduino consists of the 
    following messages:

arduino --> node:
**FLOW_number** 	// where number is in liters/min
**FLOW_END**		// indicates that pouring in complete (e.g. solenoid closed)
**TAG_rfid**		// where rfid is the tag that was scanned
**TAG_0000000000**	// special case of the above: solenoid closed
**TEMP_number**		// where number is the temperature in F

node --> arduino
**REQUEST_TAG**		// get the rfid tag scanned
**REQUEST_TEMP**	// get the current temp
**REQUEST_FLOW**	// get the current flow rate
**REQUEST_OPEN**	// open the solenoid to pour some brewski

*/

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
		console.log('Client Disconnected.');
	});
});

console.log('Listening on http://0.0.0.0:' + port );