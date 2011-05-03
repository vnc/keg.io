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
                      
KegTwit.prototype.getTest = function() {        
	// Gets one of the first tweets ever issued by keg_io     
	
	this.twit.get('/statuses/show/62682426928926720.json', {include_entities:true}, function(data) {
      sys.puts(sys.inspect(data));
	});                          
	
};
                                                         
KegTwit.prototype.tweet = function(message) {                      
	this.logger.debug("Tweeting the message:\'" + message + "\'."); 
	
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