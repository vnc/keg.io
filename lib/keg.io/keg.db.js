var fs = require('fs'),
	sys = require('sys'),
	util = require(process.binding('natives').util ? 'util' : 'sys'),
     sqlite = require('../../../node-sqlite/sqlite');

KegDb = function(){
	this.db = new sqlite.Database();
	this.db.open("kegerator.db", function(error) { });
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
  this.openAndExec('SELECT * FROM temperature ORDER BY temperature_date DESC', function(rows) {
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
          if (error) { throw error; }
          else
          {
            callback(rows);
          }
        });
    }
  });
};

exports.KegDb = KegDb;