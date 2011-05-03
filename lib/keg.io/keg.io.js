var fs = require('fs')
	, sys = require('sys')
	, util = require(process.binding('natives').util ? 'util' : 'sys')
	, keg_db = require('keg.db')
	, keg_tweet = require('keg.tweet')	
 	, kegDb = new keg_db.KegDb()
	, kegTwit = new keg_tweet.KegTwit()
	, crypto = require('crypto');

Keg = function(){
	process.EventEmitter.call(this);
	this.actions = ['TAG', 'TEMP', 'FLOW'];
	this.lastRfidSeen = null;
	this.arduino = null; 
	this.logger = null;
	this.totalFlowAmount = 0.0;
	this.lastFlowTime = null;
	
	//this.validMessage = /^\\*\\*TAG|TEMP|FLOW_.*?\\*\\*$/i;
	this.validMessage = /\\*\\*.+_.+\\*\\*/i;
};

util.inherits(Keg, process.EventEmitter);

Keg.prototype.init = function(logger, dev, dbName, twitterEnabled, twitterConsumerKey,
							  twitterConsumerSecret,
 							  twitterAccessTokenKey,
							  twitterAccessTokenSecret) {       
	                    
	this.logger = logger;  
	kegDb.initialize(logger, dbName);

	 if (twitterEnabled)
	 {               
		sys.puts(sys.inspect(kegTwit, true, null));    
		kegTwit.init(logger,
						   twitterConsumerKey,
						   twitterConsumerSecret,
		 				   twitterAccessTokenKey,
						   twitterAccessTokenSecret);
	 }
	
	if (!dev) {
		throw "No serial port defined.";
	}  
	else if (dev == "DEVMODE")
	{                       
		this.logger.info('!!Using DEVMODE data instead of a serial port!!');                
		this.fakePour(); 
		this.fakeTemp();  
	    return;
	}
	
	this.device = dev; // assign serial port to this keg object
	var id = ''; // initialize empty string to store incoming serial port data
	var self = this; // initialize self so 'this' is accessible in events below

	// attach to the serial port device and then setup listeners for error, open, and data
	var f = fs.createReadStream(dev, { bufferSize: 1 });
	f.addListener('error', function(fd) {
		self.logger.error('Serial port read error. Check that device is valid \'' + dev + '\'');
		self.logger.error('Exiting...');
		process.exit(1);
	});

	f.addListener('open', function(fd) { 
		self.logger.info('Successfully opened serial port \'' + dev + '\' for reading from kegerator');
	});

	f.addListener('data', function(chunk) { 

        self.logger.trace(chunk.toString('ascii'));
          
		var c = chunk.toString('ascii').match(/.*/)[0]; // Only keep hex chars

		if ( c == '' ) { // Found non-hex char
			if ( id != '' ) // The ID isn't blank
				self._onData(id);
			id = ''; // Prepare for the next ID chunks
			return;
		}

		id += c; // Add to the ID

	});                                                      
	
	// attach to the serial port device so data can be sent to arduino
	arduino = fs.createWriteStream(dev);
	arduino.addListener('error', function(fd) {
		self.logger.error('Serial port write error. Check that device is valid \'' + dev + '\'');
		//logger.error('Exiting...');
		//process.exit(1);
	});
	
	arduino.addListener('open', function(fd) {
		self.logger.info('Successfully opened serial port \'' + dev + '\' for writing to kegerator');
	});
};

Keg.prototype.getTemperatureTrend = function(callback) {
	kegDb.getTemperatureHistory(function(rows){
		
		var formattedData = [];
		for(i = 0; i < rows.length; i++)
		{
			var row = rows[i];
			var dateObj = new Date(row.temperature_date);
			prettyDate = dateObj.toDateString() + " " + dateObj.toTimeString();
			formattedData.push( [prettyDate, row.temperature] );
		}
		
		var data = JSON.stringify({ name: 'temperatureHistory', value: formattedData });
		callback(data);
	});
};
          
Keg.prototype.getKegInfo = function(callback) {
	kegDb.getActiveKeg(function(rows){
	   callback(JSON.stringify(rows));      
	});
};

Keg.prototype.getPourTrend = function(callback) {
	kegDb.getPourTotalsByUser(function(rows) {
			var formattedData = [];
			for(i = 0; i < rows.length; i++)
			{
				var row = rows[i];
				formattedData.push( [row.first_name + " " + row.last_name, row.volume ] );
			}

			var data = JSON.stringify({ name: 'pourHistory', value: formattedData });	
			callback(data);
	});
};

Keg.prototype.getPercentRemaining = function(callback) {
	kegDb.getPourHistory(function(rows) {
		var totalPoured = 0;
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			totalPoured += parseFloat(row.volume_ounces);
		}
		var kegTotalVolume = 124 * 16;  // 124 pints * 16 ounces per pint
		callback( totalPoured / kegTotalVolume );
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

Keg.prototype.fakeFlow = function fakeFlow(flowsLeft)
{                        
	var frequencyInMs = 1000;       // repeat every second
	var self = this;             
	
	if (flowsLeft > 0)
	{
		setTimeout(function() {     
			self.logger.debug("emitting fake flow");
			var randomFlow = (Math.floor(Math.random() * 31)) + 10; // between 10-40   
			self._onData("**FLOW_" + randomFlow +"**");
			setTimeout(self.fakeFlow(flowsLeft - 1), frequencyInMs); 
			}, frequencyInMs);
	}
	else
	{                                
		// In Fred Armisen from Portandia voice: "This flow is OVER!!!"
		self._onData("**FLOW_END**");
	}
};
                    
Keg.prototype.fakePour = function fakePour()
{                        
	var frequencyInMs = 10000;	// repeat every 10 seconds
	var self = this;         
	this.fakeFlow(5);   // flow for 5 seconds               
	                                                         
	// Select a random user, using values that we "know" are in the DB,
	// (based on the fact that they're hardcoded into the DB rebuild script)
	var randomUser = Math.floor(Math.random() * 6); // between 0-2
	var userRFID = "";
	switch(randomUser)
	{
		case 0:       
			userRFID = "2312A4B540";	// Dylan
		break;
		case 1:                                 
			userRFID = "2312A4B541"; 	// Chris
		break;
		case 2:
			userRFID = "2312A4B542"; 	// Carl
		break;   
		case 3:
			userRFID = "2312A4B543";  // Garrett
		break;         
		case 4:
			userRFID = "DENYTAG544";  //deny user   
		break;  
		case 5:
			userRFID = "DENYTAG545";  //deny user    
		break;                         
	}
	                   
	setTimeout(function() {     
		self.logger.debug("emitting fake pour");    
		self._onData("**TAG_" + userRFID + "**"); 
		setTimeout(self.fakePour(), frequencyInMs);
		}, frequencyInMs);
};                      

Keg.prototype.fakeTemp = function fakeTemp()
{                        
	var frequencyInMs = 3000;    // repeat every 3 seconds 
	var self = this; 
	setTimeout(function() { 
		var randomTemp = Math.floor(Math.random() * 101); // between 0-100
	    self._onData("**TEMP_" + randomTemp + "**");
		setTimeout(self.fakeTemp(), frequencyInMs); 
		}, frequencyInMs);
};
	
Keg.prototype.isValidMessage = function(data) {
	if (data) result = (this.validMessage).exec(data);
	if (result && result[0] == data) return true;
	else return false;
};

Keg.prototype.addUser = function(data,callback){
	//add insert new user code here
	//parse form response	
	if(data!= null){
		if(data.kegiopassword == 'keg'){
		kegDb.validateUser(data.usertag, function(rows) {
			userExists = false;
					if ((rows != null) && (rows.length > 0)){ 
					userExists = true;
					}
		
		//first_name, last_name, rfid, email
		if(userExists==false){
			console.log("new user form add");
			console.log(data);
			kegDb.addUser(data.firstname, data.lastname, data.usertag, data.email);	
			callback(JSON.stringify({success:true,user: data.firstname + ' ' + data.lastname,'error': null}));
		}else{
			console.log("A User for this tag already exists");
			callback(JSON.stringify({success: false,error: {message:'User already exists',fields:['usertag']}}));
		}
		//callback('Form OK');
		
		});
		}else{
			console.log("Invalid keg.io password");
			callback(JSON.stringify({success: false,error: {message:'Invalid keg.io password',fields:['kegiopassword']}}));	
		}
		
	}
}
	
Keg.prototype._allowPour = function() {   
	if (this.arduino)
	{
		arduino.end("**REQUEST_OPEN**");       
		arduino = fs.createWriteStream(this.device);  
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

Keg.prototype._onData = function(data) {

	// don't continue if the message received isn't valid
	if (!this.isValidMessage(data)) { 
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
			var eventName = this.actions[i].toLowerCase();
			var eventData = d.toLowerCase();
			var eventTime = new Date();
			
			this.logger.debug("Event: " + eventName + " Data: " + eventData +
						 " Time: " + eventTime.toDateString() + " " + eventTime.toTimeString());
			
			var self = this;
			switch(this.actions[i].toLowerCase())
              {
              case 'temp':
                kegDb.addTemperature(d);
                break;

              case 'tag':
                // This event is a bit different, as there's nothing to really do yet.
                // We'll just keep track of which RFID was scanned, in case they do something later.
                this.lastRfidSeen = d;
				kegDb.validateUser(d, function(rows) {
					if ((rows != null) && (rows.length > 0)){                               
						self.logger.info("Authenticated RFID: " + d);
						// if a row is returned, user is valid. tell arduino to allow pour	
						self._allowPour();
						
						// Hash the email, then send an event to the UI with the relevant data
						self.hashEmail(rows[0].email, function(hash) {
							self.emit("pour", rows[0].first_name + " " + rows[0].last_name + "|" + hash);   
						});
					}
					else 
					{
						self.logger.info("Denied RFID: " + d);
						// For some reason, we have to pass some data on the emit() call
						if (eventData != '0000000000') self.emit("deny", d);
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
						self.totalFlowAmount = (self.totalFlowAmount * 2);
						this.logger.debug("That flow was: " + self.totalFlowAmount);
						
						// We're done pouring a beer. Send the total flow amount to the DB
						kegDb.addPour(self.lastRfidSeen, self.totalFlowAmount);     
						
						var ounces = Math.round(parseFloat(self.totalFlowAmount));
						
						kegDb.validateUser(self.lastRfidSeen, function(rows) {
							if ((rows != null) && (rows.length > 0)){                               
								// Tweet it
								var name = rows[0].first_name + " " + rows[0].last_name;                                              
								if ((rows[0].twitter_handle) && (rows[0].twitter_handle.length > 0))
								{
									name = rows[0].twitter_handle;
								}
							    kegTwit.tweet(name + " just poured " + ounces + " oz of tasty, tasty beer."); 
							};
						});
						
						self.getPercentRemaining(function(percent) {
							self.logger.debug("PERCENT: " + percent);
							self.emit("remaining", ""+percent)
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