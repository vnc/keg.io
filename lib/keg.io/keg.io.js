// The 'main' server-side class
//
// The KegIo object is an event emitter, and serves as the primary object with which the server.js
// code interacts. This object encapsulates and maintains the necessary ojbects for working with 
// the DB and Twitter functionality.  Additionally, it's responsible for communicating with the 
// arduino microcontroller via the serial port.
//         
//
// ## Protocol definition##
// The "protocol" we're using to communicate with the arduino consists of the following messages:
//
//	**arduino --> node**         
// 
// * `**FLOW_number**` (*number* indicates the current flow rate, where *number* is in liters/min)  
// * `**FLOW_END**`	(indicates that pouring is complete e.g. solenoid closed)
// * `**TAG_rfid**`	(*rfid* indicates an rfid scan, where *rfid* is the value that was scanned)
// * `**TAG_0000000000**`	(special case of the above: solenoid closed)
// * `**TEMP_temp**`	(*temp* indicates the current keg temp, where *temp* is in F)
// * `**AUTH_id**`	(*auth* indicates an auth response, where *id* is the client/kegerator unique ID)
//	
//	**node --> arduino** 
//
// * `**REQUEST_TAG**`	(requests the last rfid tag scanned)
// * `**REQUEST_TEMP**`	(requests the current temperature)
// * `**REQUEST_FLOW**`	(requests the current flow rate)
// * `**REQUEST_OPEN**`	(requests that the solenoid open to pour some brewski)
// * `**REQUEST_AUTH**` (requests that the client/kegerator respond with its unique ID)
// * `
//
var fs = require('fs')
	, sys = require('util')
	, util = require(process.binding('natives').util ? 'util' : 'sys')
	, keg_db = require('./keg.db')
	, keg_tweet = require('./keg.tweet')
	, kegDb = new keg_db.KegDb()
	, kegTwit = new keg_tweet.KegTwit()
	, crypto = require('crypto')
	, socketio = require('socket.io')
	, http = require('http');


Keg = function(){
	process.EventEmitter.call(this);
	this.actions = ['TAG', 'TEMP', 'FLOW'];
	this.lastRfidSeen = null;   
	this.lastTempSeen = null;
	this.websocketPort = null; 
	this.logger = null;
	this.totalFlowAmount = 0.0;
	this.lastFlowTime = null;                           
	this.adminUiPassword = '';  
	this.highTempThreshold = null;
	
	// Regex to validate messages from the arduino, according to the protocol definition above.
	this.validMessage		= /\*\*.+_.+\*\*/i;
	this.validAuthMessage	= /\*\*AUTH_.+\*\*/i;
};

// This object is an event emitter.
util.inherits(Keg, process.EventEmitter);

Keg.prototype.init = function(logger, 
							  port, 
							  dbName, 
							  twitterEnabled, 
							  twitterConsumerKey,
							  twitterConsumerSecret,
							  twitterAccessTokenKey,
							  twitterAccessTokenSecret,
							  adminUiPassword,
							  highTempThreshold) {       
	                    
	this.logger = logger;    
	this.adminUiPassword = adminUiPassword;  
	this.highTempThreshold = highTempThreshold;
	
	kegDb.initialize(logger, dbName);

	 if (twitterEnabled)
	 {               
		// Initialize the Twitter module, passing in all the necessary config values (that represent our API keys) 
		kegTwit.init(logger,
					 twitterConsumerKey,
					 twitterConsumerSecret,
					 twitterAccessTokenKey,
					 twitterAccessTokenSecret);        
	  }
	
	if (!port) {
		throw "No websocket port defined.";
	}  
	else if (port == "DEVMODE")
	{                                 
		// If 'DEVMODE' is used as the websocketPort (instead of a port number), the code will
		// generate random events, rather than attempting to communicate with a real arduino via websocket.  This is very helpful
		// for development/debugging, when the actual hardware isn't available.
		this.logger.info('!!Using DEVMODE data instead of a serial port!!');
		this.fakePour(); 
		this.fakeTemp();   
		this.profileMemUsage();
		return;
	}
	
	this.websocketPort = parseInt(port); // assign websocke port to this keg object
	var self = this; // initialize self so 'this' is accessible in events below

	// listen for kegerators via websocket and then setup listeners for error, data, and disconnect
	var io = socketio.listen(this.websocketPort);
	self.logger.info('Listening for kegerator web socket connections on port ' + this.websocketPort);

	io.sockets.on('connection', function(socket){
		self.logger.debug('Kegerator client trying to connect...');
		self._lookupKegerator(socket, function(kegeratorId) {
			if (! kegeratorId ) {
				socket.disconnect(); // refuse connection from unknown kegerator
				self.logger.warn('Unknown kegerator client connection refused.');
			} else {
				socket.send('**AUTH_TRUE**');
				self.logger.info('Kegerator client connected.');

				socket.on('message', function(data) {
					self.logger.trace('Data from Kegerator: ' + data);
					socket.get('nickname', function(err, nickname) {
						self.logger.debug('Nickname: ' + nickname);
						if (!err && nickname) {
							self._onData(nickname, data);
						}
					});
				});
				socket.on('error', function(err){
					self.logger.error('Websocket error reading message from kegerator client.');
					self.logger.error(err);
				});
				socket.on('disconnect', function(){
					self.logger.info('Kegerator client disconnected');
				});				
			}


		});
	});
};

Keg.prototype.getTemperatureTrend = function(callback) {
	kegDb.getTemperatureHistory(function(rows){
		
		var formattedData = [];  
		if (rows)
		{
			for(i = 0; i < rows.length; i++)
			{
				var row = rows[i];
				var dateObj = new Date(row.temperature_date);
				prettyDate = dateObj.toDateString() + " " + dateObj.toTimeString();
				formattedData.push( [prettyDate, row.temperature] );
			}
		}
		var data = JSON.stringify({ name: 'temperatureHistory', value: formattedData });
		callback(data);
	});
};
                               
Keg.prototype.getLastTemperature = function()
{
	return this.lastTempSeen;
};

Keg.prototype.getKegInfo = function(callback) {
	kegDb.getActiveKeg(function(rows){
	   callback(JSON.stringify(rows));      
	});
};
                
Keg.prototype.formatPourTrend = function(rows, callback) {
	var formattedData = [];     
	if (rows)
	{
		for(i = 0; i < rows.length; i++)
		{
			var row = rows[i];
			formattedData.push( [row.first_name + " " + row.last_name, row.volume ] );
		}
    }
	var data = JSON.stringify({ name: 'pourHistory', value: formattedData });	
	callback(data);
};
     
Keg.prototype.getPourTrendAllTime = function(callback) { 
	var self = this;
	 kegDb.getPourTotalsByUser(function(rows) {
			self.formatPourTrend(rows, callback);
	});
};   

Keg.prototype.getPourTrend = function(callback) {   
	var self = this;
	kegDb.getActiveKeg(function(rows){
		if ((rows) && (rows.length > 0))
		{
			kegDb.getPourTotalsByUserByKeg(rows[0].keg_id, function(rows) {
					self.formatPourTrend(rows, callback);
			});
		}
	});   
};

Keg.prototype.getRecentHistory = function(callback) {
	var self = this;
	kegDb.getRecentHistory(function(rows){	
		callback(JSON.stringify(rows));
	});
};

Keg.prototype.getPercentRemaining = function(callback) {

	var self = this;
	// Get info about the pours that have occurred on the 
	// active keg
	kegDb.getPourHistory(function(rows) {
		var totalPoured = 0;           
		if (rows)
		{        
			// Aggregate the total pour volume
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				totalPoured += parseFloat(row.volume_ounces);
			}    
		}  
        self.logger.debug("**** TOTAL POURED FOR ACTIVE KEG: " + totalPoured);   
		// Get info about the active keg (mainly the volume)
		kegDb.getActiveKeg(function(kegRows) {
			if ((kegRows) && (kegRows.length > 0))
			{                                   
				// 1 gallon = 128 ounces
				var kegTotalVolume = kegRows[0].volume_gallons * 128;
				self.logger.debug("**** TOTAL KEG VOLUME: " + kegTotalVolume);     

				// Multiply by 100 to get a %, subtract the result from 100%                      
				var percentRemaining = 100.0 - ((totalPoured / kegTotalVolume) * 100);
				self.logger.debug("*** % REMAINING: " + percentRemaining);
				
				callback( percentRemaining );
			}
		});		
	});
};
        
Keg.prototype.getLastDrinker = function(callback)
{
		var self = this;         
		// Go to the DB to get the last drinker
			kegDb.getLastDrinker(function(rows) {
				if ((rows != null) && (rows.length > 0)) {                               
					// Hash the email, then send an event to the UI with the relevant data
					self.hashEmail(rows[0].email, function(hash) {
						callback(JSON.stringify(
							{
								'first_name':rows[0].first_name,
								'last_name':rows[0].last_name,
								'nickname':rows[0].nickname,
								'hash':hash,
								'email':rows[0].email,
								'usertag':rows[0].rfid,
								'twitter_handle':rows[0].twitter_handle,
								'pouring': false,
								'member_since': rows[0].member_since,
								'num_pours': rows[0].num_pours
								}));   
							});
						}
						else {
							callback(null);
						}
					});
};    

Keg.prototype.getLastDrinkerCoasters = function(callback) 
{                       
	var self = this;
	kegDb.getLastDrinker(function(rows) {
	   if ((rows != null) && (rows.length > 0)) {     
			kegDb.getUserCoasters(rows[0].rfid, function(rows) {
				   if ((rows != null) && (rows.length > 0)) {     
						callback(JSON.stringify(rows));
					}
				});
				
		}
	});
};
	
Keg.prototype.hashEmail = function(email, callback)
{       
	var md5Hash = "";              
	if ((email) && (email.length > 0))
	{
		md5Hash = crypto.createHash('md5').update(email).digest("hex");      
	}
	callback(md5Hash);
};
         
Keg.prototype.profileMemUsage = function profileMemUsage()
{                 
	 var self = this;
	 var frequencyInMs = 60000;       // repeat every minute           
	 
	 setTimeout(function() {      
			self.logger.trace("process mem usage:");
			self.logger.trace(sys.inspect(process.memoryUsage()));
			setTimeout(self.profileMemUsage(), frequencyInMs); 
			}, frequencyInMs);
};
                 
// Produces a fake "flow" event on a given interval, used in development mode         
Keg.prototype.fakeFlow = function fakeFlow(flowsLeft)
{                        
	var frequencyInMs = 1000;       // repeat every second
	var self = this;             
	
	if (flowsLeft > 0)
	{
		setTimeout(function() {     
			var randomFlow = (Math.floor(Math.random() * 51)) + 30; // between 30-80   
			self._onData("1111","**FLOW_" + randomFlow +"**");
			setTimeout(self.fakeFlow(flowsLeft - 1), frequencyInMs); 
			}, frequencyInMs);
	}
	else
	{                                
		// (In Fred Armisen from Portandia voice): "This flow is **OVER**!!!"
		self._onData("1111","**FLOW_END**");
	}
};
                         
// Produces a fake "pour" event on a given interval, used in development mode
Keg.prototype.fakePour = function fakePour()
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
		self._onData("1111", "**TAG_" + userRFID + "**"); 
		setTimeout(self.fakePour(), frequencyInMs);
		}, frequencyInMs);
};                      
              
// Produces a fake "temp" event on a given interval, used in development mode         
Keg.prototype.fakeTemp = function fakeTemp()
{                        
	var frequencyInMs = 3000;    // repeat every 3 seconds 
	var self = this; 
	setTimeout(function() { 
		var randomTemp = 40;                              	   // start at 40
		var randomTemp = randomTemp + (Math.floor(Math.random() * 10) - 5); // between -5 and 5
		// yields a temp between 35 and 45
		self._onData("1111","**TEMP_" + randomTemp + "**");
		setTimeout(self.fakeTemp(), frequencyInMs); 
		}, frequencyInMs);
};
	
Keg.prototype.isValidMessage = function(data) {
	if (data) {
		this.logger.debug("Message received: " + data);
		result = (this.validMessage).exec(data);
		if (result && result[0] == data) return true;
		else return false;
	} else {
		return false;
	}
};

Keg.prototype.isValidAuthMessage = function(data) {
	if (data) {
		this.logger.debug("Message (auth) received: " + data);
		result = (this.validAuthMessage).exec(data);
		if (result && result[0] == data) return true;
		else return false;
	} else {
		return false;
	}
};

Keg.prototype.addUser = function(data,callback){
	//add insert new user code here
	//parse form response	
	if(data!= null) {
		if(data.kegiopassword == this.adminUiPassword) {
			var self = this;
			if(data.twitterusername != null){
				data.twitterusername = data.twitterusername.toString().replace('@','');	
			}
			if(data.isnewuser == 'true'){
				kegDb.validateUser(data.usertag, function(rows) {
					userExists = false;
					if ((rows != null) && (rows.length > 0)) { 
						userExists = true;
					}
		
					// first_name, last_name, rfid, email
					if(userExists == false) {  
						self.logger.info("New user added via UI: " + data.firstname + " " + data.lastname);
						self.logger.debug(data);
						kegDb.addUser(data.firstname, data.lastname, data.usertag, data.email, data.twitterusername);	
						callback(JSON.stringify({success:true, user: data.firstname + ' ' + data.lastname, 'error': null}));
					} else {
						self.logger.info("A user for this tag already exists");
						callback(JSON.stringify({success: false, error: {message:'User already exists', fields:['usertag']}}));
					}                             
				});
			}else{
			//update existing user	
				kegDb.updateUser(data.firstname, data.lastname, data.usertag, data.email, data.twitterusername);
				callback(JSON.stringify({success:true, user: data.firstname + ' ' + data.lastname, 'error': null}));	
			}
		} else {
			this.logger.info("Invalid admin UI password!");
			callback(JSON.stringify({success: false, error: {message:'Invalid keg.io password', fields:['kegiopassword']}}));	
		}
	}
};
	
Keg.prototype._allowPour = function() {   
	if (this.arduino && this.arduino.writable)
	{  
		this.logger.debug("Sending a **REQUEST_OPEN** to the arduino");
		this.arduino.write("**REQUEST_OPEN**");
		//this.arduino = fs.createWriteStream(this.device);  
	}
	else 
	{
		this.logger.debug("this.arduino is undefined");
	}
};
	
Keg.prototype._calculatePourVolume = function(flowRate, flowTime)
{
	if ((this.lastFlowTime == null) || (flowRate == 0))
	{
		// Capture the first time that we got a flow event
		this.lastFlowTime = flowTime;
		return;
	}
	
	// 1 liter per minute = 0.000563567045 US fluid ounces per millisecond
	// 1 liter per hour = 0.00000939278408 US fluid ounces per millisecond
	var diffInMs = parseFloat(flowTime - this.lastFlowTime);
	this.lastFlowTime = flowTime;
	var newFlowAmountInOz = diffInMs * (parseFloat(flowRate) * 0.00000939278408);

	this.logger.debug("diffInMs: " + diffInMs);	
	this.logger.debug("newFlowAmountInOz: " + newFlowAmountInOz);

	this.totalFlowAmount += newFlowAmountInOz;
	this.logger.debug("new flow total is: " + this.totalFlowAmount);
};

Keg.prototype._lookupKegerator = function(client, callback) {
	// send request for client ID
	client.send('**REQUEST_AUTH**');
	var self = this;

	var timeout = setTimeout(function() {
		callback(false);
	}, 5*1000); // 5 seconds

	client.once('message', function(data) {
		clearTimeout(timeout);
		if (!self.isValidAuthMessage(data)) callback(false); // invalid auth message

		var startSlice = data.indexOf('_') + 1;
		var endSlice = data.indexOf('*', data.indexOf('_'));
		var kegeratorId = data.slice(startSlice, endSlice);

		kegDb.validateKegerator(kegeratorId, function(rows) {
			// set a nickname for client if client is found in kegDb
			// existence of a socket nickname will denote that the client is authorized
			// this way we can check for a nickname on each event instead of doing a db query
			var nickname = false;
			if ( rows !== null && rows.length > 0 ) {
				nickname = rows[0].kegerator_id;
				client.set('nickname', "" + nickname, function(){ 
					client.get('nickname', function(err, nick) {
						if (err) {
							self.logger.error('Problem setting kegerator socket nickname: ' + err);
							callback(false);
						} else {
							self.logger.info('Kegerator registered with nickname ' + nick);
							callback(nick);
						}
					});
				});
			} else { // db lookup returned null rows object or rows with length 0
				callback(false);
			}
		});
	});
};

Keg.prototype._onData = function(eventKegeratorId, data) {

	// don't continue if the message received isn't valid
	if (!this.isValidMessage(data) || !eventKegeratorId) {
		this.logger.debug("Ignoring invalid message: " + data);
		return;
	}
	
	// Display the "raw" message
    this.logger.debug(data);
	
	// determine the type of message and emit the proper event
	for (var i = 0; i < this.actions.length; i++) {
		if (data.indexOf(this.actions[i]) >= 0) {
			var startSlice = data.indexOf('_') + 1;
			var endSlice = data.indexOf('*', data.indexOf('_'));
			var d = data.slice(startSlice, endSlice);
			
			// Set up some cleaned vars to use for our event handling
			var eventName   = this.actions[i].toLowerCase();
			var eventData   = d.toLowerCase();
			var eventTime   = new Date();
			
			this.logger.debug("Event: " + eventName + " Data: " + eventData + " KegeratorID: " + eventKegeratorId + 
						      " Time: " + eventTime.toDateString() + " " + eventTime.toTimeString());
			
			var self = this;
			switch(this.actions[i].toLowerCase())
              {
              case 'temp':
                kegDb.addTemperature(d, eventKegeratorId);    

				var currentTemp = parseInt(d);
				self.lastTempSeen = currentTemp;
				if (currentTemp >= self.highTempThreshold)
				{
					kegTwit.tweetTemp(currentTemp);  
				}
                break;

              case 'tag':
                // This event is a bit different, as there's nothing to really do yet.
                // We'll just keep track of which RFID was scanned, in case they do something later.
				kegDb.validateUser(d.toUpperCase(), function(rows) {
					if ((rows != null) && (rows.length > 0)){                               
						self.logger.info("Authenticated RFID: " + d + " (" + rows[0].first_name + " " + rows[0].last_name + ")");
						self.lastRfidSeen = d;  
						// if a row is returned, user is valid. tell arduino to allow pour	
						self._allowPour();
						
						// Hash the email, then send an event to the UI with the relevant data
						self.hashEmail(rows[0].email, function(hash) {
							self.emit("pour", 
								JSON.stringify(
									{
										'first_name':rows[0].first_name,
										'last_name':rows[0].last_name,
										'nickname':rows[0].nickname,
										'hash':hash,
										'email':rows[0].email,
										'usertag':d,
										'twitter_handle':rows[0].twitter_handle,
										'pouring': true,
										'member_since': rows[0].member_since,
										'num_pours': rows[0].num_pours     
									}							
								)
							);   
						});   
						
						
						kegDb.getUserCoasters(d, function(rows) {
						   if ((rows != null) && (rows.length > 0)) {     
								self.emit("coaster", JSON.stringify(rows));
								self.logger.debug("Current Coasters:");
								for(var i = 0; i < rows.length; i++)
								{
									self.logger.debug(rows[i].coaster_id + "(" + rows[i].name + ")");
								}
							}
						});
					}
					else 
					{
						self.logger.info("Denied RFID: " + d);   
						// Make sure we don't attribute any pouring to a denied RFID
						this.lastRfidSeen = null;	
						// For some reason, we have to pass some data on the emit() call
						if (eventData != '0000000000') self.emit("deny",JSON.stringify({'usertag':d}));
					}
				});
                break;

              case 'flow':
                if (this.lastRfidSeen != null)
                {
				   var flowAmount = d.toLowerCase();
				   
				   if (flowAmount == 'end')
					{                                                                            
						// For some reason, our flow calculations are all coming in too low.  
						// They seem to be about 50% of what they should be. So.... multiply
						// everything by 2.
						self.totalFlowAmount = (self.totalFlowAmount * 1.4);
						this.logger.debug("That flow was: " + self.totalFlowAmount); 
						var ounces = Math.round(parseFloat(self.totalFlowAmount));
						                          
						if (ounces != 0)
						{    
							var rfidToAttribute = self.lastRfidSeen;                      
							// We're done pouring a beer. Send the total flow amount to the DB   
							kegDb.addPour(rfidToAttribute, self.totalFlowAmount, eventKegeratorId);             
							
							// Gather user info from the DB
							kegDb.validateUser(rfidToAttribute, function(rows) {
								if ((rows != null) && (rows.length > 0)){                               
									var userInfo = rows[0];      
									              
									// The structure of updateCoasters requires that we only call it AFTER 
									// we've added the most recent pour to the DB
								    kegDb.updateCoasters(rfidToAttribute, self.totalFlowAmount, eventKegeratorId, function(coasterEarned) {
									        //self.logger.info("***WHOA, keg.io knows that I earned a coaster: " + sys.inspect(coasterEarned, null, 2) + "***");
											self.emit("coaster_earned", JSON.stringify(coasterEarned));
											kegTwit.tweetCoaster(userInfo, coasterEarned);
											});
											         
									// Gather beer info from the DB
									kegDb.getActiveKeg(function(rows){  
										if ((rows != null) && (rows.length > 0)){      
											
											// Tweet about it
											kegTwit.tweetPour(userInfo, ounces, rows[0]);
										}
									});		
								};
							});
						}
					
						self.getPercentRemaining(function(percent) {
							self.emit("remaining", ""+ percent);
						});
						self.lastFlowTime = null;
						self.lastRfidSeen = null;
						self.totalFlowAmount = 0.0;
					}
					else
					{
						// We're still getting flow rate messages from the arduino.  
						// Calculate the flow amount and add it to our total.
						self._calculatePourVolume(eventData, eventTime);
					}
                }
                break;
                default:
                // TODO: set an error.  We got an invalid message.
              }
			
			this.emit(eventName, eventData);
		}
	}
};
exports.Keg = Keg;
