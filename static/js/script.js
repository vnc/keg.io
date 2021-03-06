/* Author: Chris Castle & Dylan Carney

*/
var temperatureHistoryChart;
var pourHistoryChart;
var flowData = [];
var flowRateGauge;
var tempGauge;
var beerGauge;
var g_pourHistoryChart;   
var g_pourHistoryAllTimeChart;
// temperature history chart options

var beerGaugeOptions = {
	redFrom:0,
	redTo: 10,
	yellowFrom:10,
	yellowTo:30,
	yellowColor: '#FF6E00',
	greenFrom:80,
	greenTo:100,
	width: 150,
	height: 150,
	data : {}
}


var tempGaugeOptions = {
	min:30,
	max:70,
	greenFrom:30,
	greenTo:48,
	greenColor:'#1FD8D8',
	yellowFrom:48,
	yellowTo:60,
	yellowColor: '#FF6E00',
	redFrom:60,
	redTo:70,
	redColor: 'red',
	width:150,
	height:150,
	data:{}
}

var flowRateGaugeOptions = {
	redFrom:70,
	redTo:80,
	yellowFrom:60,
	yellowTo:70,
	yellowColor: '#FF6E00',
	width:150,
	height:150,
	min: 0,
	max: 80,
	data:{}
}
  
var g_pourHistoryChartOptions = {
	width: 400, 
	height: 200, 
	legend: 'none',
//	title: 'Who be drinkin all the beer?',
	chartArea: {
			height: 100,
			top:25
		},
	hAxis: {   
				maxAlternation:2,
				showTextEvery:1,
				titleTextStyle: {color: 'Black', fontSize:'8px'},
				slantedText:true,
				slantedTextAngle:45
			},
	vAxis:{title:'Ounces'}
};

function drawPourChart(historyChart, chartElementId, title, colors, json) {
		if(json!=null) {
			var receivedJson = JSON.parse(json);
        	var data = new google.visualization.DataTable();
        	data.addColumn('string', 'Name');
        	data.addColumn('number', 'Ounces');
		  	data = googleDatafy(data,receivedJson);

		  	if(typeof(historyChart) == 'undefined') {
        		historyChart = new google.visualization.ColumnChart(document.getElementById(chartElementId));
        	}                        
			g_pourHistoryChartOptions.title = title;
			g_pourHistoryChartOptions.colors = colors; 
        	historyChart.draw(data, g_pourHistoryChartOptions);
        }
};                          

// Pour history chart options	
function drawPourHistoryChart(json) {
	drawPourChart(g_pourHistoryChart, 'pour_day_chart', 'Who be drinkin all of this keg?', ['#1FD8D8'], json);
};          

function drawPourHistoryAllTimeChart(json) { 
	drawPourChart(g_pourHistoryAllTimeChart, 'pour_day_chart_all_time', 'Who be drinkin the most? (all time)',  ['#FF6E00'], json);
};

function trim(stringToTrim) { 
	return (stringToTrim == null) ? null : stringToTrim.replace(/^\s+|\s+$/g,"");
}

var googleDatafy  = function(g_data,json){
	
	var values = json.value;
	g_data.addRows(values.length);
	for(var i = 0; i < values.length; i++){
		var tv = values[i];
		for(var z = 0; z < tv.length; z ++){
			g_data.setValue(i,z,tv[z]);
		}
	
	}
	return g_data;
	
};
var drawGauges = function(){
	    tempGaugeOptions.data = new google.visualization.DataTable();
        tempGaugeOptions.data.addColumn('string', 'Label');
        tempGaugeOptions.data.addColumn('number', 'Value');
        tempGaugeOptions.data.addRows(1);
        tempGaugeOptions.data.setValue(0, 0, 'Temp °F');
        tempGaugeOptions.data.setValue(0, 1, 0);
        
        flowRateGaugeOptions.data = new google.visualization.DataTable();
        flowRateGaugeOptions.data.addColumn('string', 'Label');
        flowRateGaugeOptions.data.addColumn('number', 'Value');
        flowRateGaugeOptions.data.addRows(1);
        flowRateGaugeOptions.data.setValue(0, 0, 'Flow');
        flowRateGaugeOptions.data.setValue(0, 1, 0);
        
      	tempGauge = new google.visualization.Gauge(document.getElementById('temp_chart'));
        tempGauge.draw(tempGaugeOptions.data , tempGaugeOptions);
        
        flowRateGauge =  new google.visualization.Gauge(document.getElementById('flow_chart'));
        flowRateGauge.draw(flowRateGaugeOptions.data,flowRateGaugeOptions);
        window.setInterval(needleBump,100);
        
	    beerGaugeOptions.data = new google.visualization.DataTable();
        beerGaugeOptions.data.addColumn('string', 'Label');
        beerGaugeOptions.data.addColumn('number', 'Value');
        beerGaugeOptions.data.addRows(1);
        beerGaugeOptions.data.setValue(0, 0, 'Beer %');
        beerGaugeOptions.data.setValue(0, 1, 0);
        beerGauge =  new google.visualization.Gauge(document.getElementById('beer_chart'));
        beerGauge.draw(beerGaugeOptions.data,beerGaugeOptions);
}

var updateFlowRateGauge = function(value){
  		flowRateGaugeOptions.data.setValue(0,1,value*1);
  		flowRateGauge.draw(flowRateGaugeOptions.data,flowRateGaugeOptions);
}

var updateBeerGauge = function(value){
	  	beerGaugeOptions.data.setValue(0,1,value*1);
  		beerGauge.draw(beerGaugeOptions.data, beerGaugeOptions);
}

var updateTempGauge = function(value){
	if(typeof(tempGauge) != 'undefined' && tempGauge!=null){
		tempGaugeOptions.data.setValue(0,1,value*1);
		tempGauge.draw(tempGaugeOptions.data , tempGaugeOptions);
	}
}

var needleBump = function(){
	if(flowRateGaugeOptions.data.getValue(0, 1)!=0){
		var bump = Math.random()>.5?1:-1;
		var nv = flowRateGaugeOptions.data.getValue(0, 1) + bump;
		flowRateGaugeOptions.data.setValue(0,1,nv);
		flowRateGauge.draw(flowRateGaugeOptions.data,flowRateGaugeOptions);
	}
}
               
var rotateCharts = function rotateCharts() {
	                          
	// Get the # of charts
	var numChildren = $("#rotating_charts").children().length;   
	                     
	var visibleIndex = 0;  
	
	// Loop through each chart, until we find the visible one
	$("#rotating_charts").children().each(function(index){
			
		    if ($(this).is(':visible'))
			{                                                
				// Make the next chart visible, wrapping around to the first one if necessary
			    visibleIndex = ((index + 1) % numChildren);  
				
				// Hide the currently visible one    
				$(this).hide();
				return false; 	// done
			}
	    });  

		// Show the newly visible chart
		var newChart = $("#rotating_charts").children().eq(visibleIndex).show();
}
                                          
var updateHistory = function(historyData) {
	if ((historyData != null) && (historyData.length > 0)) {
		
		// Get the mustache template, which is currently just stored in the
		// markup of a hidden div.  We might want to move this into a seperate
		// file that we can serve up.           
		var history = JSON.parse(historyData);
	    var template = $('#history_template').html();

		// parse the data, and tweak it to get it into a format that's better
		// suited to our iterative template
		for(var i = 0; i < history.length; i++){
			history[i].pour_date = dateFormat(history[i].pour_date, "hh:MMtt, dd-mmm-yyyy ")
		}

		var html = Mustache.to_html(template, { title: "Recent Activity", rows: history}); 
		
		$('#history').html(html);
	}
}

var updateKegInfo = function(json) {   
	var data = JSON.parse(json);  
	if ((data != null) && (data.length > 0))
	{
	   $('#beer_desc').text(data[0].description);
	   $('#beer_name').text(data[0].beer);
	   $('#beer_style').text(data[0].beer_style);
	   $('#beer_brewery').text(data[0].brewery);
	   $('#beer_label').attr("src", data[0].image_path);
	   $('#beer_tapped_date').text(dateFormat(data[0].tapped_date, "dd-mmm-yyyy"));
	}    
}

var showSpeechBubble = function(text, fadeDelayInMs) {
	$('blockquote#speech_bubble p').text(text);
	$('blockquote#speech_bubble').show();
	$('blockquote#speech_bubble').fadeOut(fadeDelayInMs,
		function() {
			$('blockquote#speech_bubble p').text('');
		});
	$('blockquote#speech_bubble').glow('green');
}

function updateMetrics(name, value) {  

	var inEdit = $('#newuser').attr('inEdit');
	var values = null;  
	
	///////////
	//  TAG
	///////////
	if (name == 'tag') {
		// Nothing to do in the UI for a tag event
	}
	///////////
	//  FLOW
	/////////// 
	else if (name == 'flow' && value == 'end') { 
		// pour finished, update pourHistoryChart  
		$('img#flow_status').attr("src", "images/padlock-closed.png").attr("alt", "keg locked");   
		
		jQuery.get('pourHistory.json', null, function(json) { 
			drawPourHistoryChart(json);
			updateFlowRateGauge(0);
		});                             
		
		jQuery.get('pourHistoryAllTime.json', null, function(json) {
				   drawPourHistoryAllTimeChart(json); 
				});                           
		
		
	}
	///////////
	//  TEMP
	/////////// 
	else if (name == 'temp') {
		var newText = value;
		updateTempGauge(value);
	} 
	///////////
	//  POUR
	///////////
	else if (name == 'pour')
	{                   
			values = JSON.parse(value);
			            
			if ((typeof values == "undefined") || (values == null))
			{
				return;
			}          
			
			if (values.hash != null)
			{                                
				// Show the user's gravatar, based on the MD5 hash passed in, or use the built-in
				// gravatar "mystery man" (mm) if the email address isn't registered with gravatar
				$('#user_gravatar').attr("src", 
									"http://www.gravatar.com/avatar/" + values.hash + "?s=250&d=mm"); 
			}                                                               
			else
			{   
				$('#user_gravatar').attr("src", "images/default_avatar_150.png");
			}
		 	
		 	if( inEdit=='false'){
				//dont change form user tag if someone has started to edit the form
				fillUserEditForm(values, false);
			}                                                                    
			
		    var textToUpdate = $('blockquote#speech_bubble p').text();
			var fullname = values.first_name + " " +
				(((values.nickname) && (values.nickname.length > 0)) ? "'" + values.nickname + "' ": "") + values.last_name;
				
		   $('span#user_text').text(fullname);
		   $('span#user_date').text(dateFormat(values.member_since, "dd-mmm-yyyy"));
		   $('span#user_pours').text(values.num_pours);
		
		   $('#coasters').html(""); 
           if (values.pouring == true)
		   {            
				showSpeechBubble("Hey there " + fullname + "! Pour yourself a beer!", 8000);
				$('img#flow_status').attr("src", "images/padlock-open2.png").attr("alt", "keg unlocked!");   
		   }
    ///////////
	//  DENY
	/////////// 
	} else if (name == 'deny') {
			values = JSON.parse(value);
			
			if( inEdit=='false'){
				//dont change form user tag if someone has started to edit the form
				fillUserEditForm(values, true);
			}
		    
		showSpeechBubble("Denied! Don\'t even think about trying to drink from our keg.", 8000);
	}
	///////////
	//  REMAINING
	/////////// 
	else if (name == 'remaining') {
		updateBeerGauge(Math.round(value*100)/100);
	}
	///////////
	//  COASTER
	///////////
	else if (name == 'coaster') {
		                        
		// Get the mustache template, which is currently just stored in the
		// markup of a hidden div.  We might want to move this into a seperate
		// file that we can serve up.
	    var template = $('#coaster_template').html();
	                                    
		// parse the data, and tweak it to get it into a format that's better
		// suited to our iterative template
		var rowData = JSON.parse(value);
		var data = { title: "Coasters",
					rows: rowData 
		   		  };
		var html = Mustache.to_html(template, data);
		
		// Display
		$('#coasters').html(html);  
	}   
	else if (name == 'coaster_earned') {   
			var coaster_list = $('#coasters').find('#badgeslist');
			
			//var existingMarkup = trim($('#coasters').html());  
			var existingMarkup = trim(coaster_list.html()); 
			if ((existingMarkup != null) && (existingMarkup.length > 0))
			{
				// Get the mustache template, which is currently just stored in the
					// markup of a hidden div.  We might want to move this into a seperate
					// file that we can serve up.                
				    var template = $('#badge_template').html();

					// parse the data, and tweak it to get it into a format that's better
					// suited to our iterative template
					var rowData = JSON.parse(value); 
					//alert(rowData);            
					var html = Mustache.to_html(template, rowData[0]); 
				    //$('#badgeslist').html(existingMarkup + html);  
					coaster_list.html(existingMarkup + html);
					$('li.badge').each(function(index) {
					    $(this).glow("red");
					  }); 
			} 
			else
			{      
				
			   // TODO: COPIED VERBATIM FROM THE "COASTER"  EVENT ABOVE
					// Get the mustache template, which is currently just stored in the
					// markup of a hidden div.  We might want to move this into a seperate
					// file that we can serve up.
				    var template = $('#coaster_template').html();

					// parse the data, and tweak it to get it into a format that's better
					// suited to our iterative template
					var rowData = JSON.parse(value);
					var data = { title: "Coasters",
								rows: rowData 
					   		  };
					var html = Mustache.to_html(template, data);
					         
					// Display
					$('#coasters').html(html);
					$('li.badge').glow("red");       
			}        
	}
};

var fillUserEditForm = function(data, isnewuser) {
    $('#newuser').resetForm();
    $('#newuserformsuccess').text('');
    $('#formerror').text('');
    $('#newuser input').removeClass('error');
    $('form#newuser').toggle(true);
    if (data != null) {
        $('input[name=usertag]').val(data.usertag);
    }
    $('input[name=usertag]').glow('yellow');
    $('input[name=isnewuser]').val(isnewuser);
    if ((!isnewuser) && (data != null)) {
        //fill rest of form
        $('input[name=firstname]').val(data.first_name);
        $('input[name=lastname]').val(data.last_name);
        $('input[name=email]').val(data.email);
        $('input[name=twitterusername]').val(data.twitter_handle);
        $('#newusersubmit').val("Update User");
    } else {
        $('#newusersubmit').val("Add New User");
    }
};

function newUserSuccess(data){
	var formResponse = JSON.parse(data);
	if(formResponse.success==true){
		$('#newuserformsuccess').text(formResponse.user + ' sucessfully updated');
			$('#newuser').resetForm();
			$('#newuser').toggle(false);
			$('#newuser input').removeClass('error');
			 $('#newuser').attr('inEdit',false);
			 window.setTimeout(function(){
			 	$('div.ui-dialog').fadeOut('slow',function(){
			 	//window.setTimeout("$('#admin').dialog('close')",2000);
			 	$('#admin').dialog('close');
			 	});
			 },2000);
		}	else{
			$('#formerror').text(formResponse.error.message);
			for(var z = 0; z < formResponse.error.fields.length; z++){
				$('input[name=' + formResponse.error.fields[z] + ']').addClass('error');
				$('input[name=' + formResponse.error.fields[z] + ']').glow('red');	
			}
		}
}

function validateNewUserForm(formData, jqForm, option){
	//{ name:  username, value: valueOfUsernameInput }, 
    //     { name:  password, value: valueOfPasswordInput }
    $('#formerror').text('');
  var isvalid = true;
	    for (var i=0; i < formData.length; i++) { 

	    if((formData[i].name=='kegiopassword' || formData[i].name == 'firstname' || formData[i].name == 'lastname')&& formData[i].value.replace(' ','') =='')
		{
	    		var field = $('label[for='+ formData[i].name + ']').text();
	    		$('input[name=' + formData[i].name + ']').addClass('error');
	    		$('input[name=' + formData[i].name + ']').glow('red');
	    		$('#formerror').append(field + ' Cannot be blank<br />');
	    		isvalid = false;
	    	}
    }
    if(isvalid==true){
    		$('#formerror').text('');
    	} 
    setEditLockTimeout();
    return isvalid;
	}

function setEditLockTimeout(ms){
		if(ms==null){
			ms = 10000;
		}
		if(isEditTimeout != null){
			window.clearTimeout(isEditTimeout);
		}
		isEditTimeout= window.setTimeout('$("#newuser").attr("inEdit",false);',ms);
} 

$(document).ready(function() {   
	isEditTimeout = null;
	reloadAttempt = 0;
	
	jQuery.get('socketPort.json', null, function(json) {  
		var socketPort = JSON.parse(json);
		socket = io.connect(null, { 
			port: socketPort
		});
		socket.on('message', function(data){
			if (data) {
				var d = JSON.parse(data);
				updateMetrics(d.name, d.value);

				// hold on to all incoming flow data (if it's not an "END" flow message)
				if ((d.name == 'flow') && (d.value != 'end')) {
					updateFlowRateGauge(d.value);
				}
			}
		});   
		socket.on('disconnect', function() {
		/*	setTimeout(function() {
				location.reload(true);
				reloadAttempt++;
			}, Math.pow(2,reloadAttempt)); */
		});
	});
		
	
    // Gather some info from the server to populate the initial UI                                                                                   
	jQuery.get('kegInfo.json', null, function(json) { updateKegInfo(json); } );
	jQuery.get('pourHistory.json', null, function(json) { drawPourHistoryChart(json); } );      
	jQuery.get('pourHistoryAllTime.json', null, function(json) { drawPourHistoryAllTimeChart(json); } ); 
	jQuery.get('currentTemperature.json', null, function(json) { var d = JSON.parse(json); updateMetrics(d.name, d.value); } ); 
	jQuery.get('currentPercentRemaining.json', null, function(json) { var d = JSON.parse(json); updateMetrics(d.name, d.value); }); 
	jQuery.get('lastDrinker.json', null, function(json) { var d = JSON.parse(json); updateMetrics(d.name, d.value); });  
	jQuery.get('lastDrinkerCoasters.json', null, function(json) { var d = JSON.parse(json); updateMetrics(d.name, d.value); });
	jQuery.get('recentHistory.json', null, function(json) { var d = JSON.parse(json); updateHistory(d); });
	
	$('#newuser').ajaxForm({success:newUserSuccess,beforeSubmit:validateNewUserForm});
	$('#newuser input').focus(function(){
			$('#newuser').attr('inEdit',true);
			setEditLockTimeout();
		});
   $('#newuser').attr('inEdit',false);   
   
  	drawGauges();

	// define a generic repeater
	var repeater = function(func, times, interval) {
	  var ID = window.setInterval( function(times) {
	    return function() {
	      if (--times <= 0) window.clearInterval(ID);
	      func();
	    }
	  } (times), interval);
	};
	
	$('#flow_status').click(function(){
		$('#admin').dialog({
				modal:true,
				width:550,
				title:'Update/Add User',
				close: function(){
						$('#newuser').attr('inEdit',false); 
					}
			});	
	});
	
	$('#kegio_about').click(function(){
			$('#about').dialog({
				modal: true,
				width: 800,
				title: 'About Keg.io'
			});
		});

	// call the repeater with a function as the argument
	repeater(rotateCharts, 100000000, 10000);
   
});

