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

var temperatureHistoryChart;
var byDayChart;
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

	// temperature history chart options
	var temperatureHistoryChartOptions = {
		chart: {
			renderTo: 'temp_chart'
		},
		title: {
			text: 'Temperature Trend'
		},
		xAxis: {
			type: 'datetime',
			tickInterval: 1000 * 60 * 60, // one hour
			tickWidth: 0,
			gridLineWidth: 1,
			labels: {
				align: 'left',
				x: 3,
				y: -3
			}
		},
		yAxis: {
			title: {
				text: null
			},
			labels: {
				align: 'left',
				x: 3,
				y: 16,
				formatter: function() {
					return Highcharts.numberFormat(this.value, 0);
				}
			},
			showFirstLabel: false
		},
		tooltop: {
			shared: true,
			croshairs: true
		},
		series: [{
			name: 'Temperature Trend',
			lineWidth: 4,
			marker: {
				radius: 4
			}
		}]
	};
	
	// Pour history chart options
	var pourHistoryChartOptions = {
	      chart: {
	         renderTo: 'pour_day_chart',
	         defaultSeriesType: 'column'
	      },
	      title: {
	         text: 'Who be drinkin all the beer?'
	      },
	      subtitle: {
	         text: 'Source: keg.io'
	      },
	      xAxis: {
	         title: {
	            text: "Who"
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
	                this.series.name +': '+ this.y +' ounces';
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
				name: 'Total ounces'
			}]
	   };

	jQuery.get('temperatureHistory.json', null, function(json) {
		var receivedJson = JSON.parse(json);
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






















