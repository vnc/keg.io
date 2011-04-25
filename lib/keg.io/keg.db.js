var fs = require('fs'),
	sys = require('sys'),
	util = require(process.binding('natives').util ? 'util' : 'sys'),
     sqlite = require('../node-sqlite/sqlite');

KegDb = function(){
	this.db = new sqlite.Database();
};

//util.inherits(Keg, process.EventEmitter);

KegDb.prototype.init = function() {

   var self = this;
   this.db.open("kegerator.db", function (error) {
    if (error) {
        console.log("Shit. Error.");
        throw error;
    }
    else
    {
        console.log("Opened that shit.");
    }
    });
};

KegDb.prototype.getTemperatureHistory = function(callback) {
  var self = this;
  this.openAndExec('SELECT temperature, temperature_date FROM temperature ORDER BY temperature_date', function(rows) {
    callback(rows);
  });
};

KegDb.prototype.getPourHistory = function(callback) {
  var self = this;
  this.openAndExec('SELECT rfid, keg_id, pour_date, volume_ounces FROM pour ORDER BY pour_date DESC', function(rows) {
    callback(rows);
  });
};

KegDb.prototype.getKegs = function(callback) {
  var self = this;
  this.openAndExec('SELECT keg_id, beer, brewery, description, tapped_date FROM keg ORDER BY tapped_date DESC', function(rows) {
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
  this.openAndExec(sql, function(rows) {
    callback(rows);
  });
};

KegDb.prototype.getPourTotalsByUserByKeg = function(keg_id, callback) {
  var self = this;
  var sql = 'SELECT user.first_name, user.last_name, SUM(pour.volume_ounces) ' +
            'FROM pour INNER JOIN user ON pour.rfid = user.rfid ' +
            'WHERE pour.keg_id = \'' + keg_id + '\' '
            'GROUP BY user.rfid, user.first_name, user.last_name ' +
			'ORDER BY SUM(pour.volume_ounces) DESC ' +
			'LIMIT 10';
  this.openAndExec(sql, function(rows) {
    callback(rows);
  });
};

KegDb.prototype.validateUser = function(tag, callback) {
	var self = this;
	var sql = 'SELECT first_name, last_name, email ' +
			  'FROM user ' +
			  'WHERE rfid=\'' + tag + '\' ' +
			  'LIMIT 1';
	this.openAndExec(sql, function(rows) {
		callback(rows);
	});
};

KegDb.prototype.addTemperature = function(temperature) {
  this.openAndExecBindings(
    "INSERT INTO temperature (temperature, temperature_date) VALUES (?, ?)"
    , [Math.round(temperature), new Date() + '']
    , function (error, rows) {
        if (error) { console.log(error); }
      });
}; 

KegDb.prototype.addPour = function(rfid, volumeInOunces) {
  this.openAndExecBindings(
    "INSERT INTO pour (rfid, keg_id, pour_date, volume_ounces) VALUES (?, ?, ?, ?)"
    , [rfid, 1, new Date() + '', Math.round(volumeInOunces)]
    , function (error, rows) {
        if (error) { console.log(error); }
      });
}; 

KegDb.prototype.openAndExecBindings = function(sql, bindings, callback)
{
  var self = this;
  this.db.open("kegerator.db", function(error) 
  {
    if (error) { throw error; }
    else
    {
      self.db.execute(sql, bindings, function(error, rows)
        {
		 self.db.close(function(error){});
          if (error) { throw error; }
          else
          {
            callback(null, rows);
          }
        });
    }
  });
};

KegDb.prototype.openAndExec = function(sql, callback)
{
  var self = this;
  this.db.open("kegerator.db", function(error) 
  {
    if (error) { throw error; }
    else
    {
      self.db.execute(sql, function(error, rows)
        {
		 self.db.close(function(error){});
          if (error) { console.log(error); }
          else
          {
            callback(rows);
          }
        });
    }
  });
};

exports.KegDb = KegDb;