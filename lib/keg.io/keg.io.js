var fs = require('fs')
	, sys = require('sys')
	, util = require(process.binding('natives').util ? 'util' : 'sys')
	, keg_db = require('keg.db')	
 	, kegDb = new keg_db.KegDb();

Keg = function(){
	process.EventEmitter.call(this);
	this.actions = ['TAG', 'TEMP', 'FLOW'];
	
	//this.validMessage = /^\\*\\*TAG|TEMP|FLOW_.*?\\*\\*$/i;
	this.validMessage = /\\*\\*.+_.+\\*\\*/i;
};

util.inherits(Keg, process.EventEmitter);

Keg.prototype.init = function(dev) {
	if (!dev) throw "No serial port defined.";

    // test out the DB
    kegDb.getTemperatureHistory( function(rows) {
      console.log(JSON.stringify({ name: 'temperatureHistory', value: rows }));
      for (var row in rows) 
      {
        console.log(rows[row]);
      } 
    });

	this.device = dev; // assign serial port to this keg object
	var id = ''; // initialize empty string to store incoming serial port data
	var self = this; // initialize self so 'this' is accessible in events below

	// attach to the serial port device and then setup listeners for error, open, and data
	var f = fs.createReadStream(dev, { bufferSize: 1 });
	f.addListener('error', function(fd) {
		console.log('Serial port error. Check that device is valid \'' + dev + '\'');
		console.log('Exiting...');
		process.exit(1);
	});

	f.addListener('open', function(fd) { 
		console.log('Successfully opened serial port \'' + dev + '\' to kegerator');
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
};
	
Keg.prototype.isValidMessage = function(data) {
	if (data) result = (this.validMessage).exec(data);
	if (result && result[0] == data) return true;
	else return false;
};
	
Keg.prototype._onData = function(data) {

    console.log(data);
    
	// don't continue if the message received isn't valid
	if (!this.isValidMessage(data)) return;
	
	// determine the type of message and emit the proper event
	for (var i = 0; i < this.actions.length; i++) {
		if (data.indexOf(this.actions[i]) >= 0) {
			var startSlice = data.indexOf('_') + 1;
			var endSlice = data.indexOf('*', data.indexOf('_'));
			var d = data.slice(startSlice, endSlice);
			
			// temp|tag|flow
			console.log("Action: " + this.actions[i] + " Data: " + d);
			switch(this.actions[i].toLowerCase())
              {
              case 'temp':
                kegDb.addTemperature(d);
                break;
              case 'tag':
                //TODO: kegDb.something
                break;
              case 'flow':
                // TODO: kegDb.something
                break;
                default:
                // TODO: set an error.  We got an invalid message.
              }
			
			this.emit(this.actions[i].toLowerCase(), d);
		}
	}
};
exports.Keg = Keg;