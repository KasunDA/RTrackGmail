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

	// gmail.observe.on("http_event", function(params) {
	//   console.log("url data:", params);
	// });
}

refresh(main);