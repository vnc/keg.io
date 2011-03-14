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
        /*
        self.db.execute("SELECT * FROM user;", function (error, rows) {
          if (error) { throw error; }
          else 
          {
            for (var row in rows) 
            {
              console.log(rows[row]);
            } 
          }
        });*/
    }
    });
};

KegDb.prototype.getTempHistory = function(callback) {
  var self = this;
  this.openAndExec('SELECT * FROM temp ORDER BY temp_date DESC', function(rows) {
    callback(rows);
  });
};

KegDb.prototype.addTemp = function(temp) {
  this.openAndExec("INSERT INTO temp(temp, temp_date) VALUES (66, '2011-03-15 01:29:48.666')", function(error, rows) 
  {
    if (error) { throw error; }
  });
};


KegDb.prototype.addTempTwo = function(temp) {
  var self = this;
  this.db.open("kegerator.db", function (error) {
  if (error) {
      console.log("Welcome.");
      throw error;
  }
  self.db.execute
    ( "INSERT INTO temp (temp, temp_date) VALUES('66', '2011-03-15 01:29:48.666')"
    , function (error, rows) {
        if (error) { console.log(error); /* throw error; */ }
        else { console.log("temp added."); }
      }
    );
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