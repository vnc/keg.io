/* Author: Chris Castle & Dylan Carney

*/
var temperatureHistoryChart;
var pourHistoryChart;
var flowData = [];

// temperature history chart options
var flowRateChartOptions = {
	chart: {
		height: 200,
		renderTo: 'flow_chart',
		defaultSeriesType: 'areaspline',
		marginRight: 10,
		events: {
			load: function() {

				var series0 = this.series[0];
				var series1 = this.series[1];

				// run every 1 second
				setInterval(function() {
					// calculate components to average y values
					var sum = 0;
					var count = flowData.length;
					for (var i = 0; i < flowData.length; i++) {
						//console.log("sum:" + sum + " adding: " + flowData[i]);
						sum += parseInt(flowData[i]);
					}
						
					// define points
					var y0 = (count != 0) ? (sum / count) : (0);
					var x0 = (new Date()).getTime();
					
					var y1 = y0 * -1;
					var x1 = x0;
					
					// determine whether old points should fall off left side of chart
					if (series0.data.length < 150) var dropPoint = false;
					else var dropPoint = true;
					
					// add point to chart
					series0.addPoint([x0, y0], true, dropPoint);
					series1.addPoint([x1, y1], true, dropPoint);
						
					// flowData.length:7 sum: 019141215131414 y0: 2734459304487.7144
					//console.log("flowData.length:" + flowData.length + " sum: " + sum + " y0: " + y0);
					// clear flowData
					flowData = new Array();
						
				}, 1000); // 1000ms
			}
		}
	},
	title: {
		text: 'How much beer be drinked?'
	},
	legend: {
		enabled: false
	},
	tooltip: {
		enabled: false
	},
	xAxis: {
		type: 'datetime',
		tickPixelInterval: 120
	},
	yAxis: {
		title: {
			text: null
		},
		lineWidth: 0,
		labels: {
			enabled: false
		},
		min: -35,
		max: 35
	},
	series: [
	{
		name: 'Ounces Poured',
		lineWidth: 1,
		marker: {
			radius: 0
		},
		color: '#e78f08'
	},
	{
		name: 'Ounces Poured',
		lineWidth: 1,
		marker: {
			radius: 0
		},
		color: '#e78f08'
	}],
	credits: {
		enabled: false
	}
};

// Pour history chart options
var pourHistoryChartOptions = {
      chart: {
         renderTo: 'pour_day_chart',
         defaultSeriesType: 'column',
		 height: 200
      },
      title: {
         text: 'Who be drinkin all the beer?'
      },
	  legend: {
		 enabled: false
	  },
      xAxis: {
         title: {
            text: null
         }
      },
      yAxis: {
         min: 0,
         title: {
            text: 'Beer consumed (ounces)',
            align: 'high'
         }
      },
      tooltip: {
         formatter: function() {
            return ''+
                this.y +' ounces';
         }
      },
      plotOptions: {
         bar: {
            dataLabels: {
               enabled: true
            }
         }
      },
      credits: {
         enabled: false
      },
     series: [{
			name: 'Total ounces',
			color: '#e78f08'
		}]
	};

var updatePourHistoryChart = function(json) {
	var receivedJson = JSON.parse(json);
	pourHistoryChartOptions.series[0].data = receivedJson.value;

	// Grab the names out of the returned JSON and use them for the chart's xAxis categories.
	var categories = [];
	var vals = receivedJson.value;
	for(i = 0; i < vals.length; i++)
	{
		categories.push(vals[i][0]);
	}

	pourHistoryChartOptions.xAxis.categories = categories;
	pourHistoryChart = new Highcharts.Chart(pourHistoryChartOptions);
}

var updateTemperatureHistoryChart = function(json) {
	var receivedJson = JSON.parse(json);
	
	/*
	flowRateChartOptions.series[1].data = new Array();
	for (var i = 0; i < receivedJson.value.length; i++) {
		flowRateChartOptions.series[1].data.push(["somejunk", receivedJson.value[i][1] * -1]);
	}
	flowRateChartOptions.series[0].data = receivedJson.value;*/
	temperatureHistoryChart = new Highcharts.Chart(flowRateChartOptions);
}

function updateMetrics(name, value) {
	if (name == 'tag') {
		// Nothing to do in the UI for a tag event
	} else if (name == 'flow' && value == 'end') { // pour finished, update pourHistoryChart
		$('span#status_text').text('locked').glow();
		jQuery.get('pourHistory.json', null, function(json) { 
			pourHistoryChart.destroy();
			updatePourHistoryChart(json);
		});
	} else if (name == 'temp') {
		var el = $('span#temp_text');
		var textToUpdate = el.text();
		var newText = value;
		if (textToUpdate != newText) {
			el.text(newText);
			el.glow();
		}
	} else if (name == 'pour'){                   
			values = value.split('|');
			$('form#newuser').toggle(false);
			if ((values != null) && (values.length > 1) && (values[1].length > 0))
			{                                
				// Show the user's gravatar, based on the MD5 hash passed in, or use the built-in
				// gravatar "mystery man" (mm) if the email address isn't registered with gravatar
				$('#user_gravatar').attr("src", 
									"http://www.gravatar.com/avatar/" + values[1] + "?s=150&d=mm"); 
			}                                                               
			else
			{   
				$('#user_gravatar').attr("src", "images/default_avatar_150.png");
			}
		 
			var textToUpdate = $('p#user').text();
			var newText = "Hey there " + values[0] + "! Pour yourself a beer!";
			$('span#user_text').text(values[0]).glow();
			//if (textToUpdate != newText) {
				$('p#user').text(newText).fadeOut(5000, function() {
					$('p#user').text('');
					$('p#user').show();
				});
				$('p#user').glow('green');
				
				$('span#status_text').text('unlocked').glow();
			//}
	} else if (name == 'deny') {
			var textToUpdate = $('p#user').text();
			var newText = "Denied! Don\'t even think about trying to drink from our keg.";
			//alert(value);
			$('#denytag').text('reject ID:' + value);
			$('form#newuser').toggle(true);
			$('[name=usertag]').val(value);
		    $('p#user').text(newText).fadeOut(5000, function() { 
				$('p#user').text('');
				$('p#user').show();
			});
			$('p#user').glow("red");
	} else if (name == 'remaining') {
		$('#progress_bar .ui-progress').animateProgress(100-(value*100));
	}
};

$(document).ready(function() {   
   
	io.setPath('/client/');
	socket = new io.Socket(null, { 
		port: 8081
		,transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
	});
	socket.connect();	
	socket.on('message', function(data){
		if (data) {
			var d = JSON.parse(data);
			updateMetrics(d.name, d.value);
			console.log("name: " + d.name + " || value: " + d.value);
			
			// hold on to all incoming flow data (if it's not an "END" flow message)
			if ((d.name == 'flow') && (d.value != 'end')) {
				//console.log("pushing: " + d.value);
				flowData.push(d.value);
			}
		}
	});

	jQuery.get('temperatureHistory.json', null, function(json) { updateTemperatureHistoryChart(json); } );
	jQuery.get('pourHistory.json', null, function(json) { updatePourHistoryChart(json); } );
	
	$('#newuser').ajaxForm({success:newUserSuccess});
   
});

function newUserSuccess(data){
	if(data.success){
		$('#newuserform').text(data.user + ' sucessfully added');
		}	else{
			$('#newuserform').text(data.error);
			}
}
