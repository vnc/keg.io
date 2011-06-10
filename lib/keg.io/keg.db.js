var fs = require('fs'),
	sys = require('sys'),
	util = require(process.binding('natives').util ? 'util': 'sys'),
	sqlite = require('../node-sqlite/sqlite');

KegDb = function() {                
    this.db = new sqlite.Database();
    this.logger = null;        
};   
    
// I have no idea why, but this no longer works if the 'method'
// is named 'init'.  It's the strangest error...
KegDb.prototype.initialize = function(logger, dbName) {
	this.logger = logger;       
	this.logger.info("Opening DB: " + dbName);
	
    var self = this;    
	this.db.open(dbName, function(error) {
        if (error) {
            self.logger.error("Error opening db. Please check your configuration.");
            throw error;
        }
        else
        {
            self.logger.info(dbName + " opened for reading/writing.");
        }
    });
};
                               
// Formats a Date object as an ISO8601 string, which
// makes life in the DB much easier, since ISO8601 dates are 
// sortable as strings
KegDb.prototype.formatDate = function(d){      
 function pad(n){ return n<10 ? '0'+n : n }         

 return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z';
};

KegDb.prototype.getTemperatureHistory = function(callback) {
    var self = this;
    this.db.execute('SELECT temperature, temperature_date FROM temperature ORDER BY date(temperature_date)',
    function(error, rows) {
		if (error) { self.logger.error("SQL Error:" + error); }   
        callback(rows);
    });
};

KegDb.prototype.getPourHistory = function(callback) {
    var self = this;
    this.db.execute("SELECT rfid, pour.keg_id, pour_date, volume_ounces " +
					"FROM pour INNER JOIN keg on pour.keg_id = keg.keg_id " +  
					"WHERE active = 'true' " +
					"ORDER BY pour_date DESC",
    function(error, rows) {
		if (error) { self.logger.error("SQL Error:" + error); }   
        callback(rows);
    });
};                  

KegDb.prototype.getPourHistoryByKeg = function(keg_id, callback) {
    var self = this;
    this.db.execute('SELECT rfid, keg_id, pour_date, volume_ounces FROM pour WHERE keg_id = \'' + keg_id + '\' ORDER BY pour_date DESC',
    function(error, rows) {
		if (error) { self.logger.error("SQL Error:" + error); }   
        callback(rows);
    });
};

KegDb.prototype.getKegs = function(callback) {
    var self = this;
    this.db.execute("SELECT keg_id, beer, brewery, description, beer_style, tapped_date, image_path, volume_gallons " + 
					"FROM keg ORDER BY tapped_date DESC",
    function(error, rows) {
		if (error) { self.logger.error("SQL Error:" + error); }   
        callback(rows);
    });
};

KegDb.prototype.getActiveKeg = function(callback) {
    var self = this;
    this.db.execute("SELECT keg_id, beer, brewery, description, beer_style, tapped_date, image_path, volume_gallons " + 
					"FROM keg WHERE active = 'true' ORDER BY tapped_date DESC",
    function(error, rows) {
	    if (error) { self.logger.error("SQL Error:" + error); }   
        callback(rows);
    });
};

// Get the top 10 drinkers
KegDb.prototype.getPourTotalsByUser = function(callback) {
    var self = this;
    var sql = 'SELECT user.first_name, user.last_name, SUM(pour.volume_ounces) as volume ' +
    		  'FROM pour INNER JOIN user ON pour.rfid = user.rfid ' +
    		  'GROUP BY user.rfid, user.first_name, user.last_name ' +
    		  'ORDER BY SUM(pour.volume_ounces) DESC ' +
    		  'LIMIT 10';
    this.db.execute(sql,
    function(error, rows) {
		if (error) { self.logger.error("SQL Error:" + error); }   
        callback(rows);
    });
};

KegDb.prototype.getPourTotalsByUserByKeg = function(keg_id, callback) {
    var self = this;     
    var sql = 'SELECT user.first_name, user.last_name, SUM(pour.volume_ounces) as volume ' +
    		  'FROM pour INNER JOIN user ON pour.rfid = user.rfid ' +
    		  'WHERE pour.keg_id = \'' + keg_id + '\' ' + 
    		  'GROUP BY user.rfid, user.first_name, user.last_name ' +
    		  'ORDER BY SUM(pour.volume_ounces) DESC ' +
    		  'LIMIT 10';  
	self.logger.trace(sql);
    this.db.execute(sql,
    function(error, rows) {
	 	if (error) { self.logger.error("SQL Error:" + error); }    
        callback(rows);
    });
};

KegDb.prototype.validateUser = function(rfid, callback) {
    var self = this;
    var sql = 'SELECT first_name, last_name, nickname, email, twitter_handle ' +
    		  'FROM user ' +
    		  'WHERE rfid=\'' + rfid + '\' ' +
    		  'LIMIT 1';
    this.db.execute(sql,
    function(error, rows) {    
	 	if (error) { self.logger.error("SQL Error:" + error); }    
        callback(rows);
    });
};    

KegDb.prototype.getLastDrinker = function(callback) {
	var self = this;
    var sql = 'SELECT u.first_name, u.last_name, u.nickname, u.email, u.twitter_handle, p.rfid ' +
    		  'FROM user u INNER JOIN pour p ON u.rfid = p.rfid ' +
			  'ORDER BY pour_date DESC ' +
    		  'LIMIT 1';
    this.db.execute(sql,
    function(error, rows) {    
	 	if (error) { self.logger.error("SQL Error:" + error); }    
        callback(rows);
    });
};
           
KegDb.prototype.getUserCoasters = function(rfid, callback) {
    var self = this;
    var sql = 'SELECT uc.coaster_id, c.name, c.description, c.image_path, c.audio_path ' +
    		  'FROM user_coaster uc INNER JOIN coaster c on uc.coaster_id = c.coaster_id ' +
    		  'WHERE uc.rfid=\'' + rfid + '\' '
    this.db.execute(sql,
    function(error, rows) {    
	 	if (error) { self.logger.error("SQL Error:" + error); }    
        callback(rows);
    });
};   

KegDb.prototype.getCoaster = function(coaster_id, callback) {
    var self = this;
    var sql = 'SELECT coaster_id, name, description, image_path, audio_path ' +
    		  'FROM coaster ' +
    		  'WHERE coaster_id = ' + coaster_id;
    this.db.execute(sql,
    function(error, rows) {    
	 	if (error) { self.logger.error("SQL Error:" + error); }    
        callback(rows);
    });
};

KegDb.prototype.addTemperature = function(temperature) { 
	var self = this;
    this.db.execute(
    "INSERT INTO temperature (temperature, temperature_date) VALUES (?, ?)"
    , [Math.round(temperature), this.formatDate(new Date()) + '']
    , function(error, rows) {
		 if (error) { self.logger.error("SQL Error:" + error); }    
	});
};
                
// Will insert the given coaster for the given user, **ONLY IF**
// they don't currently already have it.   
KegDb.prototype.insertCoaster = function(rfid, coaster_id, callback) {   
	this.logger.debug("Attempting to insert coaster: " + coaster_id);
	var self = this;
	this.db.prepare("INSERT INTO user_coaster(rfid, coaster_id, earned_date) " +
					"SELECT '" + rfid + "', " + coaster_id + ", '" + self.formatDate(new Date()) + "' WHERE NOT EXISTS (SELECT 1 FROM " +
					"user_coaster WHERE rfid = '" + rfid + "' AND coaster_id = " + coaster_id + ")"  
					
					// We want to be able to track whether or not this INSERT actually does anything 
					// Per the node-sqlite documentation:
					//
					// affectedRows: boolean, default false. If true, when this statement is step()'d over, the context 
					// object (this) in the callback will contain an affectedRows member with the number of affected rows 
					// for the last step.
					,{ affectedRows: true }   
					,function(error, statement) {
					 	if (error) { self.logger.error("SQL Error:" + error); }  
						else { 
							statement.step(function (error, row) {                                  
								// We'll get one callback per row.
								 if (error) { self.logger.error("SQL Error:" + error); }  
								 else {
									if (callback)
									{
										callback((this) && (this.affectedRows > 0)); 
									}
								 } // else  
							});  // function(error, row)
						}
					});
};
                      
// Returns 01-12 instead of 1-11
function getMonthString(dte) {
	var retDate = "";
	if (dte.getMonth()+1 < 10) {
		mon = dte.getMonth()+1;
		retDate = "0" + mon;
	} else {
		retDate = dte.getMonth()+1;
	}	
	return retDate;
};                               

// Returns 01-31 instead of 1-31
function getDateString(dte) {
	var retDate = dte.getDate(); 
	return (retDate < 10) ? "0" + retDate : retDate + "";
	
};
               
// Returns yyyyMMdd
KegDb.prototype.getDateString = function(datetime) {
	return datetime.getFullYear() + getMonthString(datetime) + getDateString(datetime);
};
                    
// The structure of updateCoasters requires that we only call it AFTER 
// we've added the most recent pour to the DB (eg called addPour)
KegDb.prototype.updateCoasters = function(rfid, volumeInOunces, callback) {
	/* 
	   Current Coasters:                                                                             
    - 1: Welcome (has poured a beer with keg.io); multiple people           
	- 2: Early bird (pour before a certain hour of day); multiple people
	- 3: Mayor/duke/king/etc (top drinker overall); single person
	- 4: Keg mayor/duke/king/etc (top drinker of a keg); multiple people
	- 5: Party starter (has poured the first beer of the day); multiple people
	- 6: Closer (has poured the last beer of the day); multiple people
	- 7: Off the wagon (resumed pouring after a prolonged absence); multiple people
	- 8: Take the bus home (has poured above a certain ounces/hour): multiple people
	*/
	var self = this;                                 
	              
	// Welcome, Off The Wagon
	this.db.execute("SELECT pour_date FROM pour WHERE rfid = ? ORDER BY pour_date DESC LIMIT 2",
					[rfid],
					function(error, rows) {
					   	if (error) 
						{ self.logger.error("SQL Error:" + error); }  
						else { 
							if ((rows) && (rows.length == 1)) {        
								// The user just made their first pour.  This code makes the same
								// assumption that the "Party Starter" coaster does
			  					
								self.insertCoaster(rfid, 1, function(earned) { 
										if (earned == true){
										   self.logger.info("COASTER EARNED: Welcome");
										   self.getCoaster(1, function(result) { callback(result); });
										} 
									});       
							} else if ((rows) && (rows.length == 2)) {
								
								// User has 2 or more pours. See how far apart the last 2 were
								var mostRecent = new Date(rows[0].pour_date);
								var previous = new Date(rows[1].pour_date);
								                                  
								self.logger.debug("***MOST RECENT: " + self.formatDate(mostRecent));
								self.logger.debug("***PREVIOUS: " + self.formatDate(previous));
								self.logger.debug("******POUR DIFF: " + (mostRecent - previous));
								// If diff >= 3 weeks 
								if ((mostRecent - previous) >= 1814400000)	// 3 weeks in ms
								{
									self.insertCoaster(rfid, 7, function(earned) { 
											if (earned == true){
											   self.logger.info("COASTER EARNED: Off the Wagon");
											   self.getCoaster(7, function(result) { callback(result); });

											} 
										});
								}
							} 
						}
					});
	
	// Early Bird (pour before noon)	               
	if ((new Date()).getHours() < 12)
	{
		self.insertCoaster(rfid, 2, function(earned) { 
				if (earned == true){
				   self.logger.info("COASTER EARNED: Early Bird");
					self.getCoaster(2, function(result) { callback(result); });
				} 
			});
	}  
	   
    // Party starter                                                                                 
	// Look for any other pours found on this date
	this.db.execute("SELECT 1 from pour WHERE strftime('%Y%m%d', `pour_date`) = '" + this.getDateString(new Date()) + "' LIMIT 2",
					function(error, rows) {
						if (error) 
						{ self.logger.error("SQL Error:" + error); }  
						else { 
							if ((rows) && (rows.length == 1)) 
							{     
								// TODO:
								// We're making a pretty big assumption here that since we only have one pour for the day, 
								// that it's the one that was just added before the call to updateCoasters 
								//
								// First pour of the day!  Insert the proper coaster  
								self.insertCoaster(rfid, 5, function(earned) { 
										if (earned == true){
										   self.logger.info("COASTER EARNED: Party Starter");
										   self.getCoaster(5, function(result) { callback(result); }); 
										} 
									});
							}
						}
					}); 
					
	 // Take the bus home >= 64 ounces/hour (4 full beers)
	 var oneHourAgo = new Date(new Date() - 3600000) // 3600000ms = 1 hour   
	 this.db.execute("SELECT SUM(volume_ounces) as hourTotal from pour WHERE pour_date >= '" +
					  this.formatDate(oneHourAgo) + "' AND rfid = '" + rfid +"' group by rfid HAVING hourTotal >= 64;",
					  function(error, rows) {
						   if (error) { self.logger.error("SQL Error:" + error); }  
						   else { 
								if ((rows) && (rows.length == 1)) 
								{
									self.insertCoaster(rfid, 8, function(earned) { 
											if (earned == true){
											   self.logger.info("COASTER EARNED: Take the Bus Home");
											   self.getCoaster(8, function(result) { callback(result); });
											} 
										});
								}
							}
					  });
};
     
KegDb.prototype.addPour = function(rfid, volumeInOunces) {	                          
	var self = this;                                 
	// Ex.
	// INSERT INTO pour(rfid, keg_id, pour_date, volume_ounces)    
	// SELECT '12341234', keg_id, '2011-03-12 01:23:46.666', '16'
	// FROM keg WHERE active = 'true'
    this.db.execute(
    "INSERT INTO pour (rfid, keg_id, pour_date, volume_ounces) " + 
	"SELECT \'" + rfid + "\', keg_id, \'" + this.formatDate(new Date()) + "\', \'" + 
	 Math.round(volumeInOunces) + "\' FROM keg WHERE active = 'true'"
    , function(error, rows) {
		 if (error) { self.logger.error("SQL Error:" + error); }    
	});
};

KegDb.prototype.addUser = function(first_name, last_name, rfid, email,twitter_handle)
{
	var self = this;
	this.db.execute(
		"INSERT INTO user (first_name, last_name, rfid, email, twitter_handle) VALUES (?, ?, ?, ?, ?)"
		, [first_name, last_name, rfid, email, twitter_handle]
		, function(error, rows) { 
			if (error) { self.logger.error("SQL Error:" + error); } 
		  });
};

KegDb.prototype.updateUser = function(first_name, last_name, rfid, email,twitter_handle)
{
	var self = this;
	
	this.db.execute(
		"UPDATE user SET first_name =? ,last_name = ?,email =?,twitter_handle = ? WHERE rfid = ?"
		, [first_name, last_name, email,twitter_handle,rfid]
		, function(error, rows) {
			 if (error) { self.logger.error("SQL Error:" + error); }    
		});
};
 
exports.KegDb = KegDb;