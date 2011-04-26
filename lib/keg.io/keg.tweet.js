// using the async lib from https://github.com/jdub/node-twitter
// to install twitter and it's prereqs:
// # npm install twitter
var sys = require('sys'),
    twitter = require('twitter');   
                  
KegTwit = function() { 
	this.logger = null;
	this.twit = null;   
};                                     

KegDb.prototype.init = function(logger, consumerKey, consumerSecret, accessTokenKey, accessTokenSecret) {

	this.logger = logger;
   	this.twit = new twitter({
    	consumer_key: consumerKey,
    	consumer_secret: consumerSecret,
    	access_token_key: accessTokenKey,
    	access_token_secret: accessTokenSecret});
};
                      
KegTwit.prototype.getTest = function() {        
	// Gets one of the first tweets ever issued by keg_io     
	
	this.twit.get('/statuses/show/62682426928926720.json', {include_entities:true}, function(data) {
      sys.puts(sys.inspect(data));
	});                          
	
};
                                                         
KegTwit.prototype.tweet = function(message) {     
	/*
   	this.twit
	    .verifyCredentials(function (data) {
	        sys.puts(sys.inspect(data));
	    })
	    .updateStatus(
	        { status: 'Test tweet from keg.io app!' },
	        function (data) {
	            sys.puts(sys.inspect(data));
	        }
	    );       */
	               
	this.logger.debug("Tweeting the message:\'" + message + "\'.");
	var self = this; 
	// http://api.twitter.com/version/statuses/update.format
	this.twit.post('/statuses/update.json', { status: message }, function(data) { 
		self.logger.debug(sys.inspect(data));
	});
	
};

exports.KegTwit = KegTwit;    