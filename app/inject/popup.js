'use strict';

console.log('popup.js');

$(function() {
	RTRACK_OPTIONS.initSwitches();
	RTRACK_OPTIONS.initSwitchListeners();
	RTRACK_OPTIONS.initSettings();

	console.log('ui:', RTRACK_OPTIONS.settings.ui);
	console.log('defaultState:', RTRACK_OPTIONS.settings.defaultState);
	console.log('notifications:', RTRACK_OPTIONS.settings.notifications);
});

var RTRACK_OPTIONS = function() {

	var settings = {
		ui: true,
		defaultState: false,
		notifications: true 
	}

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
		  settings.ui = state;
		  console.log('ui:', settings.ui);
		});

		$('input[name="cb-default"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('Default switch changed to:', state); // true | false
		  localStorage.setItem('defaultState', state.toString());
		  settings.defaultState = state;
		  console.log('defaultState:', settings.defaultState);
		});

		$('input[name="cb-notifications"]').on('switchChange.bootstrapSwitch', function(event, state) {
		  console.log('Notification switch changed to:', state); // true | false
		  localStorage.setItem('notifications', state.toString());
		  settings.notifications = state;
		  console.log('notifications:', settings.notifications);
		});
	}

	function initSettings() {

		var storage = {};
		storage.ui = localStorage.getItem('ui');
		storage.defaultState = localStorage.getItem('defaultState');
		storage.notifications = localStorage.getItem('notifications');

		// Use localStorage settings or defaults
		if (storage.ui == null||undefined) {
			localStorage.setItem('ui', settings.ui.toString());
		} else {
			this.settings.ui = (storage.ui == 'true');
		}

		if (storage.defaultState == null||undefined ) {
			localStorage.setItem('defaultState', settings.defaultState.toString());
		} else {
			this.settings.defaultState = (storage.defaultState == 'true');
		}

		if (storage.notifications == null||undefined) {
			localStorage.setItem('notifications', settings.notifications.toString());
		} else {
			this.settings.notifications = (storage.notifications == 'true');
		}
		
		// Set switch state based on settings
		$('[name="cb-ui"]').bootstrapSwitch('state', this.settings.ui, false);
		$('[name="cb-default"]').bootstrapSwitch('state', this.settings.defaultState, false);
		$('[name="cb-notifications"]').bootstrapSwitch('state', this.settings.notifications, false);
	}
	
	return {
		settings: settings,
		initSwitches: initSwitches,
		initSwitchListeners: initSwitchListeners,
		initSettings: initSettings
	}

}();


