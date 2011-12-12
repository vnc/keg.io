var io 		= require("socket.io-client");
var kegId = '1111';

var options = {
	port: 3030,
	transports: ['flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
};

var socket = io.connect('http://localhost', options);
//console.log(socket);
//console.log(socket.socket.options);

socket.on('connecting', function(transport) {
	console.log('**connecting with ' + transport);
});
socket.on('connect_failed', function() {
	console.log('**connect failed');
});
socket.on('connect', function () {
  // socket connected
  console.log('**connected to socket server, beginning auth');
});
socket.on('disconnect', function () {
  // socket disconnected
  console.log('**disconnected from socket server');
});
socket.on('error', function(err) {
	console.log('**error connecting: ' + err);
	process.exit(1);
});
socket.on('message', function(data) {
	console.log('**message received: ' + data);
	if (data == '**REQUEST_AUTH**') {
		console.log('**sending auth');
		socket.send('**AUTH_' + kegId + '**');
	}

	if (data == '**AUTH_TRUE**') {
		console.log('**connected to socket server as valid kegerator clinet, sending test data');

		fakeKeg = new FakeKeg();
		fakeKeg.init(socket);
	}
});

FakeKeg = function() {};

FakeKeg.prototype.init = function(socket) {
	this.socket = socket;
	this.fakePour(); 
	this.fakeTemp();   
	//this.profileMemUsage();
	return;
};
// Produces a fake "flow" event on a given interval, used in development mode         
FakeKeg.prototype.fakeFlow = function(flowsLeft)
{                        
	var frequencyInMs = 1000;       // repeat every second
	var self = this;             
	
	if (flowsLeft > 0)
	{
		setTimeout(function() {     
			var randomFlow = (Math.floor(Math.random() * 51)) + 30; // between 30-80   
			self.socket.send("**FLOW_" + randomFlow +"**");
			setTimeout(self.fakeFlow(flowsLeft - 1), frequencyInMs); 
			}, frequencyInMs);
	}
	else
	{                                
		// (In Fred Armisen from Portandia voice): "This flow is **OVER**!!!"
		self.socket.send("**FLOW_END**");
	}
};
                         
// Produces a fake "pour" event on a given interval, used in development mode
FakeKeg.prototype.fakePour = function()
{
	var frequencyInMs = 10000;	// repeat every 10 seconds
	var self = this;         
	this.fakeFlow(5);   // flow for 5 seconds               

	// Select a random user, using values that we "know" are in the DB,
	// (based on the fact that they're hardcoded into the DB rebuild script)
	var randomUser = Math.floor(Math.random() * 5); // between 0-4
	var userRFID = "";
	switch(randomUser)
	{
		case 0:       
			userRFID = "44004C234A";	// Dylan
		break;
		case 1:                                 
			userRFID = "44004C3A1A";	// Chris
		break;
		case 2:
			userRFID = "4400561A0A";	// Carl
		break;   
		case 3:
			userRFID = "440055F873";  // Garrett
		break;         
		case 4:
			userRFID = "DENYTAG544";  //deny user   
		break;                   
	}

	setTimeout(function() {
		console.log('fake pour!!!!!!');
		self.socket.send("**TAG_" + userRFID + "**"); 
		setTimeout(self.fakePour(), frequencyInMs);
		}, frequencyInMs);
};                      
              
// Produces a fake "temp" event on a given interval, used in development mode         
FakeKeg.prototype.fakeTemp = function()
{                        
	var frequencyInMs = 3000;    // repeat every 3 seconds 
	var self = this; 
	setTimeout(function() { 
		var randomTemp = 40;                              	   // start at 40
		var randomTemp = randomTemp + (Math.floor(Math.random() * 10) - 5); // between -5 and 5
		// yields a temp between 35 and 45
		self.socket.send("**TEMP_" + randomTemp + "**");
		setTimeout(self.fakeTemp(), frequencyInMs); 
		}, frequencyInMs);
};
