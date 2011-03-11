/* Author: Chris Castle

*/

function updateMetrics(name, value) {
	if (name == 'tag') {
		var textToUpdate = $('p#user').text();
		var newText = "Hi, user " + value + "!";
		//if (textToUpdate != newText) {
			$('p#user').text(newText);
			$('p#user').glow();
		//}
	} else if (name == 'flow') {
		var el = $('span#flow_text');
		var textToUpdate = el.text();
		var newText = value;
		if (textToUpdate != newText) {
			el.text(newText);
			el.glow();
			$('#progress_bar .ui-progress').animateProgress(value);
		}
	} else if (name == 'temp') {
		var el = $('span#temp_text');
		var textToUpdate = el.text();
		var newText = value;
		if (textToUpdate != newText) {
			el.text(newText);
			el.glow();
		}
	}
};

$(document).ready(function() {   
   
   io.setPath('/client/');
   socket = new io.Socket(null, { 
     port: 8081
     ,transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
   });
   socket.connect();
   
	var messageTypes = ['temp', 'flow', 'tag'];

   socket.on('message', function(data){
	if (data) {
		var d = JSON.parse(data);
		updateMetrics(d.name, d.value);
	}
   });

      
 });






















