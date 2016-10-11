'use strict';

console.log('popup.js');

$(function() {
	RTRACK_OPTIONS.initSwitches();
	RTRACK_OPTIONS.initSwitchListeners();
	RTRACK_OPTIONS.initSettings(function(err, data) {
		if (err) {
			return console.log('Error Initializing settings');
		}

		console.log('Initialized settings:', data);
	});
});

var RTRACK_OPTIONS = function() {

	// Defaults
	var settings = {
		ui: true,
		defaultState: false,
		notifications: true 
	}

	// Initialize boostrap-switch
	function initSwitches() {
		console.log('this.settings:', this.settings);
		$("[name='cb-ui']").bootstrapSwitch();
		$("[name='cb-default']").bootstrapSwitch();
		$("[name='cb-notifications']").bootstrapSwitch();
		$("[name='cb-ui']").bootstrapSwitch('state', this.settings.ui, true);
		$("[name='cb-default']").bootstrapSwitch('state', this.settings.defaultState, true);
		$("[name='cb-notifications']").bootstrapSwitch('state', this.settings.notifications, true);
		$.fn.bootstrapSwitch.defaults.size = 'mini';
	}

	// Event handlers to update stored settings on switch changes
	function initSwitchListeners() {
		$('input[name="cb-ui"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('UI switch changed to:', state);
		  chrome.storage.sync.set({'ui': state}, function() {
		  	console.log('ui setting saved:', state);
		  });
		});

		$('input[name="cb-default"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('Default state switch changed to:', state);
		  chrome.storage.sync.set({'defaultState': state}, function() {
		  	console.log('defaultState setting saved:', state);
		  });
		});

		$('input[name="cb-notifications"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('Notifications switch changed to:', state);
		  chrome.storage.sync.set({'notifications': state}, function() {
		  	console.log('notifications setting saved:', state);
		  });
		});
	}

	// Initialize settings
	function initSettings(callback) {

		initStorage(this.settings, function(err, data) {
			if (err) {
				return callback(err);
			}
			callback(null, data);
		});
	}

	// Update settings and set switch state
	function initStorage(settings, callback) {
		var config = {
			ui: {key: 'ui', defaultVal: settings.ui},
			defaultState: {key: 'defaultState', defaultVal: settings.defaultState},
			notifications: {key: 'notifications', defaultVal: settings.notifications}
		}

    async.parallel({
        ui: initStorageSetting.bind(null, config.ui),
        defaultState: initStorageSetting.bind(null, config.defaultState),
       	notifications: initStorageSetting.bind(null, config.notifications)
    }, function(err, data) {
        if (err) {
            return callback(err);
        }

				// Set switch state based on settings
				$('[name="cb-ui"]').bootstrapSwitch('state', data.ui, true);
				$('[name="cb-default"]').bootstrapSwitch('state', data.defaultState, true);
				$('[name="cb-notifications"]').bootstrapSwitch('state', data.notifications, true);

        callback(null, data);
	  });
  }

  // Retrieve setting from chrome storage or update chrome storage with default setting
	function initStorageSetting(setting, callback) { 
		chrome.storage.sync.get(setting.key, function(data) {
			if (data[setting.key] == null||undefined) {
				var chromeSetting = {};
				chromeSetting[setting.key] = setting.defaultVal;
				chrome.storage.sync.set(chromeSetting, function() {
					console.log('Saved setting: ' + setting.key + ': ' + setting.defaultVal);
					callback(null, setting.defaultVal);
				});
			} else {
				console.log('Retrieved setting ' + setting.key + ': ' + data[setting.key]);
				callback(null, data[setting.key]);
			}
		});
	}

	return {
		settings: settings,
		initSwitches: initSwitches,
		initSwitchListeners: initSwitchListeners,
		initSettings: initSettings
	}

}();


