/*'use strict';*/

/* Magic Mirror
 * Module: MMM-Dreambox
 *
 * By AxLED
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const request = require('request');
const exec = require("child_process").exec;
const parser = require("./MMM-Podcast-xml2json.js");

var Errormessage = '';

module.exports = NodeHelper.create({

	start: function() {
		this.started = false;
		this.config = null;
	},

	socketNotificationReceived: function(notification, payload) {
				
		var self = this;
		if (notification === 'CONFIG' && self.started == false) {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData2();//Inittal Dataload before timer interval is activated
			self.started = true;
			console.log("Starting node helper for: " + self.name);
		} 

		if (notification === "BUTTON_PRESSED") {
			if (payload[1] === 'PLAY') {
				console.log('MMM-Podcast2 PLAY:'); 
				exec(self.config.videoplayer + ' ' + self.config.videoargs + ' ' + payload[0], null);//without --live buffering works
			} else {
				console.log('MMM-Podcast2 STOP:'); 
				exec('pkill ' + self.config.videoplayer, null);
			}
			self.getData2();
		}

		if (notification === "FETCH_DATA") {
			self.getData2();
		}
	},

	getData2: function() {
		var self = this;
		var myUrl = this.config.feedUrl;
		
		request({url: myUrl }, function (error, response, body) {
		
			if (!error && response.statusCode == 200) {
				json = parser.xml2json(body);
				self.sendSocketNotification("DATA",json);
			} else {
				if (!error && response.statusCode == 404){//because sometimes error is null
					Errormessage = 'Error: '+response.statusCode+' in '+myUrl;
				} else {
					Errormessage = 'Error: '+error.code+' in '+myUrl;
				}
				console.log('MMM-Podcast2 Error :',Errormessage); 
				self.sendSocketNotification("DATA",['ERROR',Errormessage]);
			}
		});
	},

});
