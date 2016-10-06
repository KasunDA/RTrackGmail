var gmail;

function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === undefined) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

var main = function(){
  	// NOTE: Always use the latest version of gmail.js from
  	// https://github.com/KartikTalwar/gmail.js
  	var gmail = new Gmail();
  	var apiUrl = 'https://rtrack.rmail.com';
  	var email = gmail.get.user_email();
  	var senderId = null;

  	console.log('Sender:', email);

  	// Get user ID
  	rm.getSender(apiUrl, email, function(err, result) {
  		if (err) {
  			return console.log(err);
  		}
  		console.log(result);
  		try {
  			senderId = result.responseJSON[0].id;
  			console.log('Sender ID:', senderId);
  		} catch (err) {
  			console.log(err);
  		}
 		
  	});

  /*
	gmail.observe.before("send_message", function(url, body, data, xhr) {
		//console.log('before send_message url:', url);
		//console.log('before send_message body:', body);
		console.log('before send_message data:', data);
		console.log('before send_message, xhr:', xhr);

		console.log('To:', data.to[0]);

		data.body += '<span>test string</span>';
		//data.to[0] = data.to[0].replace('>', '.rpost.biz>');
		//data.draft = undefined;

		console.log('draft id:', data.draft);
	});
	*/

	gmail.observe.before("send_message", function(url, body, data, xhr) {
		console.log('before send_message data:', data);

		data.body += '<span>test string</span>';

		var postData = {
		  "from": email,
		  "to": data.to,
		  //"cc": data.cc,
		  //"bcc": data.bcc,
		  "date": new Date(),
		  "subject": data.subject,
		  "mailUrl": "",
		  "mailClient": "Gmail",
		  "tracking": true,
		  "senderId": senderId
		};

		rm.postMessage(apiUrl, postData, function(err, result) {
			var trackId = null;
			if (err) {
				return console.log(err);
			}
			try {
				trackId = result.responseJSON.trackId
			} catch (err) {
				console.log(err);
			}
			var source = apiUrl + '/open/' + trackId;
			var callout = '<span><img src="' + source + '" alt="" height="0" width="0"></span>';
			data.body += callout;
			console.log('Open tracking link added:', callout);
		});

	});

	// gmail.observe.on("http_event", function(params) {
	//   console.log("url data:", params);
	// });
}

refresh(main);

/**
 * rm - Module contains functions to handle RTrack message processing.
 * @return {Object} - Public rm module methods.
 */
var rm = (function() {

  /**
   * GET /Sender
   * Get sender details from Mailtrack API
   * Query submitted with filter
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
  		console.log('GET /Sender');
  		callback(null, jqxhr);
  	})
  	.done()
  	.fail(function() {
  		callback(new Error(), jqxhr);
  	})
  	.always(function() {
  		console.log('GET /Sender - finished')
  	})
  } 


  /**
   * POST /Messages
   * Post a new messages to the Mailtrack API
   * Object containing the trackId will be returned on success.
   * @param {string} url - The API URL
   * @param {object} data - data object
   * @param {function(error, result)} callback
   */
  function postMessage(url, data, callback) {

  	// 	try {
		// 	data = JSON.stringify(data);
		// 	console.log
		// } catch (err) {
		// 	console.log(err);
		// 	callback(err);
		// }
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

  return {
  	getSender: getSender,
  	postMessage: postMessage
  }

})();
