var fs = require('fs')
	, sys = require('sys')
	, util = require(process.binding('natives').util ? 'util' : 'sys')
	, keg_db = require('keg.db')	
 	, kegDb = new keg_db.KegDb();

Keg = function(){
	process.EventEmitter.call(this);
	this.actions = ['TAG', 'TEMP', 'FLOW'];
	this.lastRfidSeen = null;
	this.arduino = null;
	
	this.totalFlowAmount = 0;
	this.lastFlowTime = null;
	
	//this.validMessage = /^\\*\\*TAG|TEMP|FLOW_.*?\\*\\*$/i;
	this.validMessage = /\\*\\*.+_.+\\*\\*/i;
};

util.inherits(Keg, process.EventEmitter);

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

Keg.prototype.getPourTrend = function(callback) {
	kegDb.getPourTotalsByUser(function(rows) {
			var formattedData = [];
			for(i = 0; i < rows.length; i++)
			{
				var row = rows[i];
				formattedData.push( [row.first_name + " " + row.last_name, row.volume ] );
			}

			var data = JSON.stringify({ name: 'pourHistory', value: formattedData });	
			console.log(data);
			callback(data);
	});
};

Keg.prototype.init = function(dev) {
	if (!dev) {
		throw "No serial port defined.";
	}
	
	this.device = dev; // assign serial port to this keg object
	var id = ''; // initialize empty string to store incoming serial port data
	var self = this; // initialize self so 'this' is accessible in events below

	// attach to the serial port device and then setup listeners for error, open, and data
	var f = fs.createReadStream(dev, { bufferSize: 1 });
	f.addListener('error', function(fd) {
		console.log('Serial port read error. Check that device is valid \'' + dev + '\'');
		console.log('Exiting...');
		process.exit(1);
	});

	f.addListener('open', function(fd) { 
		console.log('Successfully opened serial port \'' + dev + '\' for reading from kegerator');
	});

	f.addListener('data', function(chunk) { 

        // console.log(chunk.toString('ascii'));
          
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
		console.log('Serial port write error. Check that device is valid \'' + dev + '\'');
		//console.log('Exiting...');
		//process.exit(1);
	});
	
	arduino.addListener('open', function(fd) {
		console.log('Successfully opened serial port \'' + dev + '\' for writing to kegerator');
	});
};
	
Keg.prototype.isValidMessage = function(data) {
	if (data) result = (this.validMessage).exec(data);
	if (result && result[0] == data) return true;
	else return false;
};
	
Keg.prototype._allowPour = function() {
//	arduino.end("REQUEST_OPEN", "utf-8");
};
	
Keg.prototype._calculatePourVolume = function(flowRate, flowTime)
{
	if (this.lastFlowTime == null)
	{
	 	// Capture the first time that we got a flow event
		this.lastFlowTime = flowTime;
		return;
	}
	
	// 1 liter per minute = 0.000563567045 US fluid ounces per millisecond
	var diffInMs = flowTime - this.lastFlowTime;
	var newFlowAmountInOz = diffInMs * (flowRate * 0.000563567045);
	
	this.totalFlowAmount += newFlowAmountInOz;
	console.log("new flow total is: " + this.totalFlowAmount);
};

Keg.prototype._onData = function(data) {

	// don't continue if the message received isn't valid
	if (!this.isValidMessage(data)) { 
		return;
	}
	
	// Display the "raw" message
    console.log(data);
	
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
			
			console.log("Event: " + eventName + " Data: " + eventData +
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
						// if a row is returned, user is valid. tell arduino to allow pour	
						self._allowPour();	
						self.emit("pour", rows[0].first_name + " " + rows[0].last_name);
					}
					else 
					{
						console.log("Denied.");
						// For some reason, we have to pass some data on the emit() call
						self.emit("deny", "dummydata");
					}
				});
                break;

              case 'flow':
                if (this.lastRfidSeen != null)
                {
				   var flowAmount = d.toLowerCase();
				   
				   if (flowAmount == 'end')
					{
						// We're done pouring a beer. Send the total flow amount to the DB
						kegDb.addPour(self.lastRfidSeen, self.totalFlowAmount);
						self.lastFlowTime = null;
						self.lastRfidSeen = null;
						self.totalFlowAmount = 0;
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