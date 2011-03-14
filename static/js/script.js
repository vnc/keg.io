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

var tempChart;
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

	// setup chart options
	var tempChartOptions = {
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
		legend: {
			align: 'left',
			verticalAlign: 'top',
			y: 20,
			floating: true,
			borderWidth: 0
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

	jQuery.get('temp.json', null, function(json) {
		var receivedJson = JSON.parse(json);
		tempChartOptions.series[0].data = receivedJson.value;
		tempChart = new Highcharts.Chart(tempChartOptions);
	});
      
});






















