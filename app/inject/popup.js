'use strict';

console.log('popup.js');

// function initSwitches() {
// 		$("[name='cb-ui']").bootstrapSwitch();
// 		$("[name='cb-default']").bootstrapSwitch();
// 		$("[name='cb-notifications']").bootstrapSwitch();
// 		$.fn.bootstrapSwitch.defaults.size = 'mini';
// }

// initSwitches();
// $("[name='cb-ui']").bootstrapSwitch();
// $("[name='cb-default']").bootstrapSwitch();
// $("[name='cb-notifications']").bootstrapSwitch();
// $.fn.bootstrapSwitch.defaults.size = 'mini';

$(function() {
	RTRACK_OPTIONS.initSwitches();
	RTRACK_OPTIONS.initSwitchListeners();
	RTRACK_OPTIONS.initSettings();
});

var RTRACK_OPTIONS = function() {

		// Initialize boostrap-switch
	function initSwitches() {
		$("[name='cb-ui']").bootstrapSwitch();
		$("[name='cb-default']").bootstrapSwitch();
		$("[name='cb-notifications']").bootstrapSwitch();
		$.fn.bootstrapSwitch.defaults.size = 'mini';
	}

	// Event handlers to update stored settings on switch changes
	function initSwitchListeners() {
		$('input[name="cb-ui"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('UI switch changed to:', state); // true | false
		  localStorage.setItem('ui', state.toString());
		});

		$('input[name="cb-default"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('Default switch changed to:', state); // true | false
		  localStorage.setItem('defaultState', state.toString());
		});

		$('input[name="cb-notifications"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('Notification switch changed to:', state); // true | false
		  localStorage.setItem('notifications', state.toString());
		});
	}

	// Read settings from localStorage
	function initSettings() {
		// Defaults
		var ui = true;
		var defaultState = false;
		var notifications = true;

		var storage = {};
		storage.ui = localStorage.getItem('ui');
		storage.defaultState = localStorage.getItem('defaultState');
		storage.notifications = localStorage.getItem('notifications');

		if (storage.ui != null) {
			ui = !!storage.ui;
		}

		if (storage.defaultState != null) {
			defaultState = !!storage.defaultState;
		}

		if (storage.notifications != null) {
			notifications = !!storage.notifications;
		}
		
		$('[name="cb-ui"]').bootstrapSwitch('state', ui, true);
		$('[name="cb-default"]').bootstrapSwitch('state', defaultState, true);
		$('[name="cb-notifications"]').bootstrapSwitch('state', notifications, true);
	}
	

	return {
		initSwitches: initSwitches,
		initSwitchListeners: initSwitchListeners,
		initSettings: initSettings
	}

}();


