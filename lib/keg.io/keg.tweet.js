// We're using the [async twitter lib](https://github.com/jdub/node-twitter)
//
// To install twitter and it's prereqs, simply run:
// `npm install twitter`
var sys = require('util'),
    twitter = require('twitter');   
                  
KegTwit = function() { 
	this.logger = null;
	this.twit = null;    
	this.lastTempTweetDate = null;
};                                     

KegTwit.prototype.init = function(logger, consumerKey, consumerSecret, accessTokenKey, accessTokenSecret) {

	this.logger = logger;
   	this.twit = new twitter({
    	consumer_key: consumerKey,
    	consumer_secret: consumerSecret,
    	access_token_key: accessTokenKey,
    	access_token_secret: accessTokenSecret});
};
                            
// Sends a tweet, using 'message' as the tweet body.  If the 'message' param is too long
// (e.g. > 140 characters), it will be truncated and an ellipsis (...) will be appended.                                               
KegTwit.prototype.tweet = function(message) {    
	
	if ((message) && (message.length > 140))
	{
		message = message.substring(0, 136) + "...";
	}      
	        
	if (this.logger)
	{                  
		this.logger.info("Tweeting the message:\'" + message + "\'."); 
	}
	
	if (this.twit)
	{
		var self = this;                                                   
		this.twit.post('/statuses/update.json', { status: message }, function(data) { 
			self.logger.trace(sys.inspect(data));
		});
		 
	}
};  
                           
KegTwit.prototype.isTweetLength = function(message)
{
	return ((message) && (message.length <= 140));
};
       
KegTwit.prototype.tweetTemp = function(currentTemp)
{                                                                               
	// Don't tweet this more than once per hour      
	if ((this.lastTempTweetDate == null) ||                                                                    
	    ((new Date()).getTime() - this.lastTempTweetDate.getTime() >= 3600000))	// 3600000 ms = 1 hour
	{                                                                                        
		this.lastTempTweetDate = new Date();
		this.tweet("Whoa! This beer is getting too warm! It's currently " + currentTemp + " degrees!");     
	}
};
  
KegTwit.prototype.tweetPour = function(userInfo, ounces, beerInfo)
{                                             	
		// Use the person's regular name (including any given nickname)
		// Ex. Dylan 'Beardo' Carney
		var name = userInfo.first_name + " " +
					((userInfo.nickname && (userInfo.nickname.length > 0)) ? "'" + userInfo.nickname + "' " : "")
		 			+ userInfo.last_name;

		// Use the twitter handle instead, if the user has one.
		if ((userInfo.twitter_handle) && (userInfo.twitter_handle.length > 0))
 		{
			// Add the '@' symbol to the twitter handle to properly "mention" the user
			// Add the . so we mention instead of DM
    		name = userInfo.twitter_handle.indexOf('@') != -1 ?'.'+ userInfo.twitter_handle : '.@' + userInfo.twitter_handle;
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

KegTwit.prototype.tweetCoaster = function(userInfo, coasterInfo)
{                               
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
		                                
		var earnedText = " just earned the '" + coasterInfo[0].name + "' coaster!";  
	  
		if (this.isTweetLength(name + earnedText))
		{                               
			 this.tweet(name + earnedText);      
		}                                  
};

KegTwit.prototype.isTweetLength = function(message) {
	return (message) ? message.length <= 140: false;
}                                                   

exports.KegTwit = KegTwit;    