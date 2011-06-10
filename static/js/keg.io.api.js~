KegApi = {
	kegio: null,
	keginfo : null,
	pourhistory : null,
	pourHistoryURL:'http://localhost:8081/pourHistory.json',
	kegInfoURL:'http://localhost:8081/kegInfo.json',
	
	Init : function(container){
		if(!window.jQuery){
			KegApi.loadScript('http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js','jquery');
		}	
		this.kegio = $('#' + container);
		this.keginfo = $('<div class="keginfo"></div>').appendTo(this.kegio);
		this.pourhistory = $('<div class="pourhistory"></div>').appendTo(this.kegio);
		//this.updatePourHistory();
		this.updateData('pourHistory');
		this.updateData('kegInfo');
		//this.loadScript('http://localhost:8081/kegInfo.json?callback=KegApi.kegInfoCallback','ki')
	},
	
   SetHandler: function(obj, eventname, handler) {
     with (this) {
         if (typeof(obj.addEventListener)=='undefiend' || obj.addEventListener == null) {
             obj.detachEvent('on' + eventname, handler);
             obj.attachEvent('on' + eventname, handler);
         }
         else {
             obj.removeEventListener(eventname, handler, false);
             obj.addEventListener(eventname, handler, false);
         }
     }
   },
   
	loadScript : function(src,id){
		var scr = document.getElementById(id);
		if(scr==null){
			var scr = document.createElement('sc' + 'ript');;
			scr.src = src;
			scr.type = 'text/javascript';
			scr.id = id;
			/*
			if (el.addEventListener){  
	   		el.addEventListener('click', modifyText, false);   
	 		} else if (el.attachEvent){  
	   		el.attachEvent('onclick', modifyText);  
	 		} 
			*/
			document.head.appendChild(scr);
		}else{
			scr.src = src;
		}
		return scr;
	},
	
	pourHistoryCallback : function(ph){
		var pourdata = ph;//JSON.parse(ph);
		var top = 	pourdata.value[0];
		this.pourhistory.text('Top Drinker:' + top[0]);
	},
	
	kegInfoCallback : function(ki){
		var kegdata = ki[0];// JSON.parse(ki);
		var r = '';		
		r = '<h1>' + kegdata.beer + ' ' + kegdata.beer_style + '</h1>';
		r += '<h2>' + kegdata.brewery + '</h2>';
		r += '<img src="http://keg.io/' + kegdata.image_path + '" />';
		
		this.keginfo.html(r);
	},

	updateData : function(kiotype){
		var hash = Math.round(Math.random() * 1000000);
		window['update'+kiotype+'_'+hash] = new Function('data','KegApi.'+kiotype+'Callback(data);delete update'+kiotype+'_'+hash+';document.head.removeChild(document.getElementById("'+kiotype+'_script"));');
		this.loadScript(eval('this.'+kiotype+'URL') + '?callback=' + 'update'+kiotype+'_'+hash,kiotype+'_script');
		
	}
	
}