// using the async lib from https://github.com/jdub/node-twitter
// to install twitter and it's prereqs:
// # npm install twitter
var sys = require('sys'),
    twitter = require('twitter');   
                  
KegTwit = function() {    
	this.twit = new twitter({
    	consumer_key: 'INSERT_VALUE_HERE',
    	consumer_secret: 'INSERT_VALUE_HERE',
    	access_token_key: 'INSERT_VALUE_HERE',
    	access_token_secret: 'INSERT_VALUE_HERE'});
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
	                 
	// http://api.twitter.com/version/statuses/update.format
	this.twit.post('/statuses/update.json', { status: 'Test tweet from keg.io app!'}, function(data) { 
		sys.puts(sys.inspect(data));
	});
	
};

exports.KegTwit = KegTwit;    