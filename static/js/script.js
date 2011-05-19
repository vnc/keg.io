/* Author: Chris Castle & Dylan Carney

*/
var temperatureHistoryChart;
var pourHistoryChart;
var flowData = [];
var flowRateGauge;
var tempGauge;
var beerGauge;
var g_pourHistoryChart;
// temperature history chart options

var beerGaugeOptions = {
	redFrom:0,
	redTo: 10,
	yellowFrom:10,
	yellowTo:30,
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
	greenColor:'blue',
	yellowFrom:48,
	yellowTo:60,
	redFrom:60,
	redTo:70,
	width:150,
	height:150,
	data:{}
}

var flowRateGaugeOptions = {
	redFrom:70,
	redTo:80,
	yellowFrom:60,
	yellowTo:70,
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
	title: 'Who be drinkin all the beer?',
	chartArea: {
			height: 100,
			top:10
		},
	hAxis: {	title: 'Name', 
				maxAlternation:2,
				showTextEvery:1,
				titleTextStyle: {color: 'Black', fontSize:'8px'},
				slantedText:true,
				slantedTextAngle:45
			},
	vAxis:{title:'Ounces'}
};
// Pour history chart options
	
	function drawPourHistoryChart(json) {
		if(json!=null){
			var receivedJson = JSON.parse(json);
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Name');
        data.addColumn('number', 'Ounces');
		  data = googleDatafy(data,receivedJson);

		  if(typeof(g_pourHistoryChart) == 'undefined'){
        	g_pourHistoryChart = new google.visualization.ColumnChart(document.getElementById('pour_day_chart'));
        }
        g_pourHistoryChart.draw(data, g_pourHistoryChartOptions);
        }
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
  		beerGauge.draw(beerGaugeOptions.data,beerGaugeOptions);
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

                                          
var updateKegInfo = function(json) {   
	var data = JSON.parse(json);  
	if ((data != null) && (data.length > 0))
	{
	   $('#beer_desc').text(data[0].description);
	   $('#beer_name').text(data[0].beer);
	   $('#beer_brewery').text(data[0].brewery);
	   $('#beer_label').attr("src", data[0].image_path);
	}    
}

function updateMetrics(name, value) {
	var inEdit = $('#newuser').attr('inEdit');
	var values = null;
	if (name == 'tag') {
		// Nothing to do in the UI for a tag event
	} else if (name == 'flow' && value == 'end') { // pour finished, update pourHistoryChart
		$('span#status_text').text('locked').glow();
		jQuery.get('pourHistory.json', null, function(json) { 
			//pourHistoryChart.destroy();
			//updatePourHistoryChart(json);
			drawPourHistoryChart(json);
			updateFlowRateGauge(0);
		});
	} else if (name == 'temp') {
		var el = $('span#temp_text');
		var textToUpdate = el.text();
		var newText = value;
		updateTempGauge(value);
		if (textToUpdate != newText) {
			el.text(newText);
			el.glow();
		}
	} else if (name == 'pour'){                   
			values = JSON.parse(value);//value.split('|');
			//$('form#newuser').toggle(false);
			if (values.hash!=null)//(values != null) && (values.length > 1) && (values[1].length > 0))
			{                                
				// Show the user's gravatar, based on the MD5 hash passed in, or use the built-in
				// gravatar "mystery man" (mm) if the email address isn't registered with gravatar
				$('#user_gravatar').attr("src", 
									"http://www.gravatar.com/avatar/" + values.hash + "?s=150&d=mm"); 
			}                                                               
			else
			{   
				$('#user_gravatar').attr("src", "images/default_avatar_150.png");
			}
		 	
		 	if( inEdit=='false'){
				//dont change form user tag if someone has started to edit the form
				fillUserEditForm(values, false);
			}
			var textToUpdate = $('p#user').text();
			var fullname = values.first_name + " " + values.last_name;
			var newText = "Hey there " + fullname + "! Pour yourself a beer!";
			$('span#user_text').text(fullname).glow();
			//if (textToUpdate != newText) {
				$('p#user').text(newText).fadeOut(5000, function() {
					$('p#user').text('');
					$('p#user').show();
				});
				$('p#user').glow('green');
				
				$('span#status_text').text('unlocked').glow();
			//}
	} else if (name == 'deny') {
			values = JSON.parse(value);
			var textToUpdate = $('p#user').text();
			var newText = "Denied! Don\'t even think about trying to drink from our keg.";
			
			//alert(inEdit);
			if( inEdit=='false'){
				//dont change form user tag if someone has started to edit the form
				fillUserEditForm(values, true);
			}
		    $('p#user').text(newText).fadeOut(5000, function() { 
				$('p#user').text('');
				$('p#user').show();
			});
			$('p#user').glow("red");
	} else if (name == 'remaining') {
		$('#progress_bar .ui-progress').animateProgress(100-(value*100));
		updateBeerGauge(100-Math.round(value*100)/100);
	}
};

var fillUserEditForm = function(data,isnewuser){
	$('#newuser').resetForm();
	$('#newuserformsuccess').text('');
	$('#formerror').text('');
	$('#newuser input').removeClass('error');
	//alert(value);
	//$('#denytag').text('reject ID:' + value);
	$('form#newuser').toggle(true);
	$('input[name=usertag]').val(data.usertag);
	$('input[name=usertag]').glow('yellow');
	$('input[name=isnewuser]').val(isnewuser);
	if(!isnewuser){
		//fill rest of form
		$('input[name=firstname]').val(data.first_name);
		$('input[name=lastname]').val(data.last_name);
		$('input[name=email]').val(data.email);
		$('input[name=twitterusername]').val(data.twitter_handle);
		$('#newusersubmit').val("Update User");
	}else{
		$('#newusersubmit').val("Add New User");	
	}
};

function newUserSuccess(data){
	var formResponse = JSON.parse(data);
	if(formResponse.success==true){
		$('#newuserformsuccess').text(formResponse.user + ' sucessfully added');
			$('#newuser').resetForm();
			$('#newuser').toggle(false);
			$('#newuser input').removeClass('error');
			 $('#newuser').attr('inEdit',false);
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

	    if((formData[i].name=='kegiopassword' || formData[i].name == 'firstname' || formData[i].name == 'lastname')&& formData[i].value.replace(' ','') ==''
				//formData[i].required    	
	    	){
	    		//alert('label[for='+ formData[i].name + ']');
	    		var field = $('label[for='+ formData[i].name + ']').text();
	    		$('input[name=' + formData[i].name + ']').addClass('error');
	    		$('input[name=' + formData[i].name + ']').glow('red');
	    		$('#formerror').append(field + ' Cannot be blank<br />');
	    		isvalid = false;
	    	}
	    	//if(formData[i].name = 'twitterusername'){
	    	//	formData[i].value = formData[i].value.replace('@','');	
	    	//}
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
	io.setPath('/client/');
	
	jQuery.get('socketPort.json', null, function(json) {  
		var socketPort = JSON.parse(json);
		socket = new io.Socket(null, { 
			port: socketPort
			,transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
		});
		socket.connect();	
		socket.on('message', function(data){
			if (data) {
				var d = JSON.parse(data);
				updateMetrics(d.name, d.value);

				// hold on to all incoming flow data (if it's not an "END" flow message)
				if ((d.name == 'flow') && (d.value != 'end')) {
					//console.log("pushing: " + d.value);
					//flowData.push(d.value);
					updateFlowRateGauge(d.value);
				}
			}
		});
	});
		
	
                                                                                                    
	jQuery.get('kegInfo.json', null, function(json) { updateKegInfo(json); } );
	//jQuery.get('temperatureHistory.json', null, function(json) { updateTemperatureHistoryChart(json); } );
	jQuery.get('pourHistory.json', null, function(json) { drawPourHistoryChart(json); } );
	
	$('#newuser').ajaxForm({success:newUserSuccess,beforeSubmit:validateNewUserForm});
	$('#newuser input').focus(function(){
			$('#newuser').attr('inEdit',true);
			setEditLockTimeout();
		});
   $('#newuser').attr('inEdit',false);   
   
  	drawGauges();
  	//drawPourHistoryChart();
   
});

