// using the async lib from https://github.com/jdub/node-twitter
// to install twitter and it's prereqs:
// # npm install twitter
var sys = require('sys'),
    twitter = require('twitter');   
                  
KegTwit = function() { 
	this.logger = null;
	this.twit = null;   
};                                     

KegTwit.prototype.init = function(logger, consumerKey, consumerSecret, accessTokenKey, accessTokenSecret) {

	this.logger = logger;
   	this.twit = new twitter({
    	consumer_key: consumerKey,
    	consumer_secret: consumerSecret,
    	access_token_key: accessTokenKey,
    	access_token_secret: accessTokenSecret});
};
                                                                               
KegTwit.prototype.tweet = function(message) {    
	if (this.logger)
	{                  
		this.logger.debug("Tweeting the message:\'" + message + "\'."); 
	}
	
	if (this.twit)
	{
		var self = this;                                                
		// http://api.twitter.com/version/statuses/update.format       
		this.twit.post('/statuses/update.json', { status: message }, function(data) { 
			self.logger.trace(sys.inspect(data));
		});
		 
	}
};  

KegTwit.prototype.isTweetLength = function(message) {
	return (message) ? message.length <= 140: false;
}                                                   

KegTwit.prototype.constructPourTweet = function() {     
	// optional Twitter handle vs real name
	// beer name vs "beer"
}

exports.KegTwit = KegTwit;    