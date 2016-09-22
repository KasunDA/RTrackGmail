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
  	gmail = new Gmail();
  	console.log('Hello,', gmail.get.user_email())

	gmail.observe.on('star', function(obj) {
	  console.log('star:', obj);
	});

	gmail.observe.on('unstar', function(obj) {
	  console.log('unstar:', obj);
	});

    gmail.observe.on("compose", function(compose, type) {
	  // type can be compose, reply or forward
	  // gmail.dom.compose object
	  console.log('api.dom.compose object:', compose, 'type is:', type );  
	});

	gmail.observe.before("send_message", function(url, body, data, xhr) {
		console.log('before send_message url:', url);
		console.log('before send_message body:', body);
		console.log('before send_message data:', data);
		console.log('before send_message, xhr:', xhr);

		data.body += '<span>test string</span>';
		// data.to[0].replace('<', 'x001');
		// date.to[0].replace('>', 'x002');
		// data.to[0] = data.to[0] + '.rpost.biz';
		// data.to[0].replace('x001', '<');
		// date.to[0].replace('x002', '>');
	});

	gmail.observe.on("http_event", function(params) {
	  console.log("url data:", params);
	});
}

refresh(main);