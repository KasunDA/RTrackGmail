'use strict';

console.log('popup.js');

// Initialize boostrap-switch
$("[name='cb-checkbox']").bootstrapSwitch();
$("[name='cb-default']").bootstrapSwitch();
$("[name='cb-notifications']").bootstrapSwitch();
$.fn.bootstrapSwitch.defaults.size = 'mini';

