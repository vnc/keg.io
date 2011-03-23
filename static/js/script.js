/* Author: Chris Castle & Dylan Carney

*/

function updateMetrics(name, value) {
	if (name == 'tag') {
		// Nothing to do in the UI for a tag event
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
	} else if (name == 'pour'){
			var textToUpdate = $('p#user').text();
			var newText = "Hey there " + value + "! Pour yourself a beer!";
			//if (textToUpdate != newText) {
				$('p#user').text(newText);
				$('p#user').glow();
			//}
	} else if (name == 'deny') {
			var textToUpdate = $('p#user').text();
			var newText = "Denied! Dont even think about trying to drink from our keg.";
		    $('p#user').text(newText);
			$('p#user').glow();
	}
};

var temperatureHistoryChart;
var byDayChart;
$(document).ready(function() {   
   
	io.setPath('/client/');
	socket = new io.Socket(null, { 
		port: 8081
		,transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
	});
	socket.connect();
	
	var flowData = [];
	
	socket.on('message', function(data){
		if (data) {
			var d = JSON.parse(data);
			updateMetrics(d.name, d.value);
			
			// hold on to all incoming flow data
			if (d.name == 'flow') flowData.push(d.value);
		}
	});

	// temperature history chart options
	var temperatureHistoryChartOptions = {
		chart: {
			height: 200,
			renderTo: 'temp_chart',
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
							sum += flowData[i];
						}
							
						// define points
						var y0 = (count != 0) ? (sum / count) : (0);
						var x0 = (new Date()).getTime();
						
						var y1 = y0 * -1;
						var x1 = x0;
						
						// determine whether old points should fall off left side of chart
						if (series0.data.length < 50) var dropPoint = false;
						else var dropPoint = true;
						
						// add point to chart
						series0.addPoint([x0, y0], true, dropPoint);
						series1.addPoint([x1, y1], true, dropPoint);
							
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
			min: -50,
			max: 50
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

	jQuery.get('temperatureHistory.json', null, function(json) {
		var receivedJson = JSON.parse(json);
		
		temperatureHistoryChartOptions.series[1].data = new Array();
		for (var i = 0; i < receivedJson.value.length; i++) {
			temperatureHistoryChartOptions.series[1].data.push(["somejunk", receivedJson.value[i][1] * -1]);
		}
		temperatureHistoryChartOptions.series[0].data = receivedJson.value;
		temperatureHistoryChart = new Highcharts.Chart(temperatureHistoryChartOptions);
	});

	jQuery.get('pourHistory.json', null, function(json) {
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
		pourHistoryChar = new Highcharts.Chart(pourHistoryChartOptions);
	});
   
});
