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
		this.logger.info("Tweeting the message:\'" + message + "\'."); 
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
                           
KegTwit.prototype.isTweetLength = function(message)
{
	return ((message) && (message.length <= 140));
};

KegTwit.prototype.tweetPour = function(userInfo, ounces, beerInfo)
{                                            
	
	// beer, brewery, description, tapped_date, image_path
	//(incl. beer style/name, handle, nickname
		 // Tweet it  
		
		// Use the person's regular name (including any given nickname)
		// Ex. Dylan 'Beardo' Carney
		var name = userInfo.first_name + " " +
					((userInfo.nickname && (userInfo.nickname.length > 0)) ? "'" + userInfo.nickname + "' " : "")
		 			+ userInfo.last_name;

		// Use the twitter handle instead, if the user has one.
		if ((userInfo.twitter_handle) && (userInfo.twitter_handle.length > 0))
 		{
			// Add the '@' symbol to the twitter handle to properly "mention" the user
    		name = userInfo.twitter_handle.indexOf('@') != -1 ? userInfo.twitter_handle : '@' + userInfo.twitter_handle;
		}                                                                             
		                                
		var pouredText = " just poured " + ounces + " oz of ";  
		var longBeerText = "tasty " + beerInfo.beer + " " + beerInfo.beer_style;
		var shortBeerText = "tasty, tasty beer";
		var shortShortBeerText = "tasty beer";
		
		if (this.isTweetLength(name + pouredText + longBeerText))
		{
			 this.tweet(name + pouredText + longBeerText);      
		} else if (this.isTweetLength(name + pouredText + shortBeerText))
		{
			 this.tweet(name + pouredText + shortBeerText);                   
		} else if (this.isTweetLength(name + pouredText + shortShortBeerText))     
		{
			 this.tweet(name + pouredText + shortShortBeerText);
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