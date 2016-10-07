var gmail;

function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === undefined) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

var main = function() {

	// Core library: gmail.js
	// https://github.com/KartikTalwar/gmail.js
	var gmail = new Gmail();

	var apiUrl = 'https://rtrack.rmail.com';
	var email = gmail.get.user_email();
	var senderId = null;

	console.log('Sender email:', email);

	// Get user ID
	RTRACK_API.getSender(apiUrl, email, function(err, result) {
		if (err) {
			return console.log('Error getting sender ID:', err);
		}

		//console.log(result);
		try {
			senderId = result.responseJSON[0].id;
		} catch (err) {
			console.log(err);
		}

		console.log('Sender ID:', senderId);
		
	});

	gmail.observe.before("send_message", function(url, body, data, xhr) {
		console.log('before send_message data:', data);

		if ($("input[name='rtrack']").is(":not(:checked)")) {
			console.log('Send RTrack: off');
			return null;
		}

		var recipients = RTRACK.getRecipients(data);
		//var recipients = data;

		var postData = {
		  "from": email,
		  "to": recipients.to,
		  "cc": recipients.cc,
		  "bcc": recipients.bbc,
		  "date": new Date(),
		  "subject": data.subject,
		  "mailUrl": "",
		  "mailClient": "Gmail",
		  "tracking": true,
		  "senderId": senderId
		};

		// POST message details to API and use tracking ID from return object
		// to create tracking callout in outbound message body.
		RTRACK_API.postMessageSync(apiUrl, postData, function(err, result) {
			var trackId = null;

			if (err) {
				console.log(err);
				return err;
			}

			try {
				trackId = result.responseJSON.trackId
			} catch (err) {
				console.log(err);
				return err;
			}

			var source = apiUrl + '/open/' + trackId;
			var callout = '\n<span><img src="' + source + '" alt="" height="0" width="0"></span>';
			data.body += callout;

			console.log('Open tracking link added:', callout);

			return null;

		});

	});

	// gmail.observe.on("http_event", function(params) {
	//   console.log("url data:", params);
	// });
}

refresh(main);

/**
 * RTRACK_API - Module contains functions to handle RTrack message processing.
 * @return {Object} - Public RTRACK_API module methods.
 */
var RTRACK_API = (function() {

  /**
   * GET /Sender
   * Get sender details from Mailtrack API
   * Query submitted with filter
   *
   * @param {string} url - base URL
   * @param {string} email - sender email
   * @param {function(error, result)} callback
   */
  function getSender(url, email, callback) {

  	var filter = {
  		"where": {
  			"email": email
  		}
  	}

  	filter = JSON.stringify(filter);
  	filter = encodeURIComponent(filter);

  	var path = url + '/api/Senders?filter=' + filter
  	console.log(path);

  	var jqxhr = $.get(path, function() {
  		console.log('GET api/Sender');
  		callback(null, jqxhr);
  	})
  	.done()
  	.fail(function() {
  		callback(new Error(), jqxhr);
  	})
  	.always(function() {
  		console.log('GET api/Sender - finished')
  	})
  } 

  /**
   * POST /Messages
   * Post a new messages to the Mailtrack API
   * Object containing the trackId will be returned on success.
   *
   * @param {string} url - The API URL
   * @param {object} data - data object
   * @param {function(error, result)} callback
   */
  function postMessage(url, data, callback) {

		console.log(data);

  	var path = url + '/api/Messages';
    var jqxhr = $.post(path, data, function() {
      console.log('POST /Messages');
      //callback(null, jqxhr);
    })
    .done(function() {
    	console.log('Response:', jqxhr);
    	callback(null, jqxhr);
    })
    .fail(function() {
    	callback(new Error(), jqxhr);
    })
    .always(function() {
      console.log('POST /Messages - finished');
    });
  }

   /**
   * POST /Messages - Synchronous version
   * Post a new messages to the Mailtrack API
   * Object containing the trackId will be returned on success.
   * WARNING: Sychronous ajax call is depracated JQuery 1.8+
   *
   * @param {string} url - The API URL
   * @param {object} data - data object
   * @param {function(error, result)} callback
   */
  function postMessageSync(url, data, callback) {

  	console.log(data);
  	var path = url + '/api/Messages';
  	var success = function(data, status, jqxhr) {
  		console.log('Data:', data);
  		console.log('Status:', status);
  		console.log('Response:', jqxhr);
    	callback(null, jqxhr);
  	};

  	$.ajax({
		  type: 'POST',
		  url: path,
		  data: data,
		  success: success,
		  dataType: 'json',
		  async:false
		});
  }

  return {
  	getSender: getSender,
  	postMessage: postMessage,
  	postMessageSync: postMessageSync
  }

})();

/**
 * RTRACK -  RTrack helper functions
 */
var RTRACK = (function() {

	/**
	 * getRecipients returns a recipients objects with the 
	 * recipient data from the data object properties. The 
	 * primary purpose is to elimenate the empty recepient 
	 * array elements.
	 *
	 * @param {object} data - Gmail message data object
	 * @return {object} recipients
	 */
  function getRecipients(data) {
  	
  	var recipients = {
  		to: [],
  		cc: [],
  		bcc: []
  	};

  	for (var i=0; i < data.to.length; i++) {
  		if (data.to[i].length > 0) {
  			recipients.to.push(data.to[i]);
  		}
  	}

  	for (var j=0; j < data.cc.length; j++) {
  		if (data.cc[j].length > 0) {
  			recipients.cc.push(data.cc[j]);
  		}
  	}

  	for (var k=0; k < data.bcc.length; k++) {
  		if (data.bcc[k].length > 0) {
  			recipients.bcc.push(data.bcc[k]);
  		}
  	}

  	return recipients;
  }
  
	return {
		getRecipients: getRecipients
	};

})();
