'use strict';

var j = document.createElement('script');
j.src = chrome.extension.getURL('/bower_components/jquery/dist/jquery.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('/inject/gmail.js');
(document.head || document.documentElement).appendChild(g);

var s = document.createElement('script');
s.src = chrome.extension.getURL('/inject/main.js');
(document.head || document.documentElement).appendChild(s);

console.log('RTrack for Gmail loading...');
chrome.extension.sendMessage({ type: 'initialize' }, function(response) {
  var readyStateCheckInterval = setInterval(function() {
	
    if ( document.readyState === 'complete' ) {

  		clearInterval(readyStateCheckInterval);

  		// ----------------------------------------------------------
  		// This part of the script triggers when page is done loading
  		console.log('RTrack for Gmail loaded.');
  		// ----------------------------------------------------------

      // Initialize boostrap-switch
      $("[name='cb-checkbox']").bootstrapSwitch();
      $("[name='cb-default']").bootstrapSwitch();
      $("[name='cb-notifications']").bootstrapSwitch();
      $.fn.bootstrapSwitch.defaults.size = 'mini';

      if ( response && response.isInit ) {
        console.log(response);
        
        //OAuthFunctions.confirmValidToken();
        //OAuthFunctions.updateLabelNames();
        //OAuthFunctions.initTooltipSequence();

      }
      // add the dom elements for top tab and opts bar
      // Top level Rpost Receipts tab is V2 so not executing
      // rtrack.initTopUIAddon();

      rtrack.detectComposerMutationObserver();
      rtrack.detectGmailComposer(rtrack.initComposer);
      //rtrack.registerGmailSendButtonListeners();
      //rtrack.resizeListener();
      //rtrack.keyPressesForTest();
      //rtrack.insertTooltip();

      /*
      var gmail = Gmail();
      console.log(gmail);

      gmail.observe.on("compose", function(compose, type) {

        // type can be compose, reply or forward
        console.log('api.dom.compose object:', compose, 'type is:', type );  // gmail.dom.compose object
      });

      var email = gmail.get.user_email();
      console.log(email);
      */

    }
  }, 50);
});

var api = (function() {

  var url = 'http://localhost:3000';

  /**
   * POST /Messages
   * Post a new messages to the Mailtrack API
   * Object containing the trackId will be returned on success.
   * @param {string} url - The API URL
   */
  function postMessage(url) {
    var jqxhr = $.post(url, function() {
      console.log('POST /Messages');
    })
    .done(function() {
      console.log('POST /Messages succeeded');
      // Insert tracking ID callout into message
    })
    .fail(function() {
      console.log();
      // Popup to inform user of failure.
    })
    .always(function() {
      console.log('POST /Messages - finished');
    });
  }

})();

var rtrack = (function() {

  var self = this;

  var rmailEnabled = true;
  var plainTextModeEnabled = false;
  var oneClickSendEnabled = false;
  var encryptWithEsign = false;
  var readyToSend = false;
  var hasSeenToolTips = false;
  var optionsTabInitialized = false;

  // Template data
  var logoUrl = chrome.extension.getURL('images/rmail_logo.svg');
  var logo32Url = chrome.extension.getURL('images/rmail-logo-32.png');
  var logo28Url = chrome.extension.getURL('images/rmail-logo-28.png');

  // ----------------------------------------------------------
  // Constants
  // ----------------------------------------------------------

  var RPOST_SELECTORS = {
    COMPOSE_RTRACK_BTN : '.rtrack-btn',
    COMPOSE_RTRACK_CHECKBOX : '.rtrack-checkbox',
    COMPOSE_SEND_REGISTERED_BTN : '.send-registered-btn',
    ATTR_RPOST_ENABLED : 'data-rpost-enabled'
  };

  var GMAIL_SELECTORS = {
    COMPOSE_TOOLBAR : 'div.aDh',
    COMPOSE_TOOLBAR_TABLE : 'div.aDh > table > tbody',
    SEND_BUTTON : 'td.gU.Up',
    COMPOSE_RECIPIENTS : '.vR > span.vN',
    COMPOSE_RECIPIENT_EMAIL : 'email',
    COMPOSE_RECIPIENT_INPUT : 'input[type="hidden"]',
    COMPOSE_SUBJECT : 'input[name="subjectbox"]',
    COMPOSE_TO : 'input[name="to"]',
    COMPOSE_CC : 'input[name="cc"]',
    COMPOSE_BCC : 'input[name="bcc"]',
    COMPOSE_BODY : '.Am.Al.editable.LW-avf',
    SAVE_AND_CLOSE_BTN : '.Hm > .Ha',
    LABELS_FOLDERS : '.J-Ke.n0',
    INBOX_FOLDER_SELECTOR : '.J-Ke.n0[href$="#inbox"]',
    LOADING_SCREEN_EMAIL : '#loading .msg',
    FULL_SCREEN_TO_FIELD : '.fX.aXjCH',
    PLAIN_TEXT_MENU_OPTION : '.J-N.J-Ks:nth-child(4)',
    TABS_BAR : 'tr.aAA.J-KU-Jg.J-KU-Jg-K9',
    NATIVE_TABS : 'td.aRz.J-KU',
    INBOX_TABS : 'div.aKh',
    BASE_CONTAINER : '.dw.np',
    BASE_SCREEN : 'div.dw > div > div.nH > div.nH > div.no',
    SEND_MESSAGE_BTN : 'tr.n1tfz > td.Up > div > div[role="button"]',
    SEND_MESSAGE_BTN_CONTAINER : 'tr.n1tfz > td.Up > div.J-J5-Ji',
    NEW_MESSAGE_SELECTOR : 'div.no>div>div.AD',
    REPLIES_SELECTOR : 'table.aoP.HM td.I5',
    POPOUT_SELECTOR : 'div.aCk',
    FULL_SCREEN_SELECTOR : 'div.aSt .aaZ>.M9',
    NEW_MESSAGE_MAIN_CONTAINER : 'div.nH.Hd[role=dialog]',
    FONT_OPTS_DOWN_ARROW : 'div.aA4',
    FULL_SCREEN_BG_DIMMER : 'div.aSs',
    FULL_SCREEN_SELECTOR_PARENT : 'div.aSt',
    TOP_INBOX_TABS : 'td.aRz.J-KU',
    TOP_INBOX_ROW_MARGIN : 'td.aKl',
    MAIL_SEND_BTN : 'n1tfz > .gU.Up > .J-J5-Ji > .J-J5-Ji'
  };

  /* 
  function insertHandlebarsTemplate(prependSelector, template, data, elemToRemove, callback) {
    Templates.getDeferred(template, data).done(function(html) {
      // TO prevent duplicates. Pass false for elemToRemove if this stage unneeded
      if (elemToRemove) {
        if ( $(prependSelector).find(elemToRemove).length > 0 ) {
          $(elemToRemove).remove();
        }
      }
      $(html).prependTo(prependSelector);

      if (callback) callback();
    });
  }
  */

  /**
   * Inserts a handlebars template into DOM
   * @param {string} selector 
   * @param {string} template
   * @param {string} data
   * @param {string} elemToRemove
   * @param {function(string)} callback
   */ 
  function insertHandlebarsTemplate(selector, 
                                    template, 
                                    data, 
                                    elemToRemove, 
                                    prepend, 
                                    callback) {
    Templates.getDeferred(template, data).done(function(html) {
      // To prevent duplicates. Pass false for elemToRemove if not needed.
      if (elemToRemove) {
        if ( $(selector).find(elemToRemove).length > 0 ) {
          $(elemToRemove).remove();
        }
      }
      if (prepend) {
        $(html).prependTo(selector);
      } else {
        $(html).appendTo(selector);
      }


      if (callback) callback();
    });
  }

  // Initializes Settings box as display: none; enhances performace and 
  // allows for better keeping track of selected options.
  function initSettingsUI() {

    insertHandlebarsTemplate(GMAIL_SELECTORS.BASE_SCREEN, 
                            'settings-popout', 
                            {}, 
                            '.settings-panel',
                            false,
                            registerSettingsBoxListeners);
  } 

  function initComposeUI(newMessage) {
    //addRpostEnabledClass();

    // Detect reply mode or not and insert toolbar

    // Insert send registered button
    // insertHandlebarsTemplate(GMAIL_SELECTORS.SEND_MESSAGE_BTN_CONTAINER, 
    //                           'send-registered-btn', 
    //                           {}, 
    //                           '.send-registered-btn', 
    //                           true,
    //                           registerSendRegisteredButtonListeners);
    
    // Insert RTrack checkbox 
    insertHandlebarsTemplate(GMAIL_SELECTORS.SEND_MESSAGE_BTN_CONTAINER, 
                              'rtrack-checkbox', 
                              {iconUrl: logoUrl}, 
                              '.rtrack-checkbox', 
                              false,
                              registerRtrackCheckboxListeners);

    // Insert RTrack button
    // insertHandlebarsTemplate(GMAIL_SELECTORS.SEND_MESSAGE_BTN_CONTAINER,
    //                           'rtrack-btn',
    //                           {},
    //                           '.rtrack-btn',
    //                           true,
    //                           registerRtrackButtonListeners);
    
    // insert settings and options UI but display: none; until needed.

    // if ( $(RPOST_SELECTORS.SETTINGS_BOX).length === 0 ) {
    //   initSettingsUI();
    // }
    // if ( $(RPOST_SELECTORS.OPTS_BOX).length === 0 ) {
    //   initOptionsUI();
    // }

    setTimeout(function() {
        detectPlainTextMode(newMessage)    
      } , 350);
    registerPlainTextToggleListener();

    //insertMoreOptsBar(newMessage); not shown initially, until user action
  }

  // TO DO: Handle plaintext
  function detectPlainTextMode(newMessage) {

    var plainTextString = $(newMessage).find('.oG').text();

    // It is truly a pain in the butt to detect plain text mode. There is a selector that corresponds to the menu option, but 
    // it isn't present in the DOM until you click the menu button. This method will work when a window is opened. 
    // TODO: have this method attach an event listener so we can detect when we leave plain text mode. 
    // This will need to be internationalised properly as well. 
    if (plainTextString === "Plain text") {
      console.log('Looks like we found plain text!');
      plainTextModeEnabled = true;
      // plainTextWarning();
      // disableRpost();
    }
  }

  function registerPlainTextToggleListener() {
    $('body').on('click', GMAIL_SELECTORS.PLAIN_TEXT_MENU_OPTION, function() {
      if ( $(this).hasClass('J-Ks-KO') ) {
        console.log('PLAINT TEXT ENABLED');
        plainTextModeEnabled = true;
        plainTextWarning();
        disableRpost();
        return;
      }
      else {
        plainTextModeEnabled = false;
        enableRpost();
      }
    });
  }

  function registerSendRegisteredButtonListeners() {
    $(RPOST_SELECTORS.COMPOSE_SEND_REGISTERED_BTN).hover(function (e) {
      $(this).addClass('hovered');
    }, function (e) {
      $(this).removeClass('hovered');
    });

    $(RPOST_SELECTORS.COMPOSE_SEND_REGISTERED_BTN).click(function (e) {
      console.log('send registered clicked');
      //sendRegisteredMail();
      send();
    });
  }

  function registerRtrackCheckboxListeners() {
    $(RPOST_SELECTORS.COMPOSE_RTRACK_CHECKBOX).click(function (e) {
      //
    });
  }

  function registerRtrackButtonListeners() {
    $(RPOST_SELECTORS.COMPOSE_RTRACK_BTN).click(function (e) {
            console.log('RTrack button clicked');
            console.log('Subject:', $(GMAIL_SELECTORS.COMPOSE_SUBJECT).val());
            console.log('To:', $(GMAIL_SELECTORS.COMPOSE_TO).val());
            //console.log('Cc:', $(GMAIL_SELECTORS.COMPOSE_CC).val());
            console.log('Recipients:', $(GMAIL_SELECTORS.COMPOSE_RECIPIENTS).val());

            
            var recipients = $(GMAIL_SELECTORS.COMPOSE_RECIPIENTS).map(function() {
                 return $(this).text();
              }).get();

            console.log('recipients:', recipients);

            var addresses = [];

            $(GMAIL_SELECTORS.COMPOSE_RECIPIENTS).each(function() {
                var origEmail = $(this).attr(GMAIL_SELECTORS.COMPOSE_RECIPIENT_EMAIL);
                // Here we change the hidden form input value that contains the full
                // email address of form either "name@domain.com" or "First Last <name@domain.com>".
                // We do not modify the displayed email address span DOM element, although
                // we used that to get the email attribute which does not include
                // proper names.
                var origEmailInputEl = $(this).siblings(GMAIL_SELECTORS.COMPOSE_RECIPIENT_INPUT)
                .first();
                  var origEmailInput = origEmailInputEl.attr('value');
                  var recipientInputRegexp = new RegExp(origEmail, 'g');
                  console.log('Address:', origEmailInput);

                  addresses.push(origEmailInput);
                //var rpEmailInput = origEmailInput.replace(recipientInputRegexp, rpEmail);
                //origEmailInputEl.attr('value', rpEmailInput);
                //console.log('Transformed email address "%s" => "%s"', 
                  //origEmailInput, rpEmailInput);
                  
              });

            console.log('addresses:', addresses);

            send();
    });
  }

  function registerSettingsBoxListeners() {

  }

  function send() {
    
    // transformSubjectWithParams();
    // if ( plainTextModeEnabled ) {
    //   plainTextWarning();
    //   disableRpost();
    // }

    transformRecipientEmailAddresses();

    //injectHiddenOptsSpan(storageRpost.serializeFeatureParams());
    // Send the actual email:

    $(GMAIL_SELECTORS.SEND_MESSAGE_BTN).click();
  }

  function registerGmailSendButtonListeners() {
    $(GMAIL_SELECTORS.MAIL_SEND_BTN).click(function (e) {
      console.log('Gmail send button clicked');
    });
  }

  /* Get open tracking URL
   * Get message subject
   * Get message recipients
   * Get date
   * Make rest call to MailTrack API
   * Insert URL into message
   */
   function insertOpenTrackingUrl() {
      //
   };

  function transformRecipientEmailAddresses() {
    $(GMAIL_SELECTORS.COMPOSE_RECIPIENTS).each(function() {
      // TODO: next line is broken. Need to look at GMAIL_SELECTORS.COMPOSE_RECIPIENT_INPUT
      var origEmail = $(this).attr(GMAIL_SELECTORS.COMPOSE_RECIPIENT_EMAIL);
      // if (isRPostEmailAddress(origEmail)) {
      //   // Already a valid RPost email address so leave it alone
      //   console.log('Will not modify RPost email address %s', origEmail);
      // } else {
        // Here we change the hidden form input value that contains the full
        // email address of form either "name@domain.com" or "First Last <name@domain.com>".
        // We do not modify the displayed email address span DOM element, although
        // we used that to get the email attribute which does not include
        // proper names.
        var rpEmail = origEmail + '.rpost.biz';
        var origEmailInputEl = $(this).siblings(
          GMAIL_SELECTORS.COMPOSE_RECIPIENT_INPUT).first();
        var origEmailInput = origEmailInputEl.attr('value');
        var recipientInputRegexp = new RegExp(origEmail, 'g');
        var rpEmailInput = origEmailInput.replace(recipientInputRegexp, rpEmail);
        origEmailInputEl.attr('value', rpEmailInput);
        console.log('Transformed email address "%s" => "%s"', 
          origEmailInput, rpEmailInput);
      // }
    });    
  } 

  function setIntervalDetectGmailComposer(onDetectGmailComposer) {
    detectGmailComposerInterval = setInterval(function() {
      detectGmailComposer(onDetectGmailComposer);
    }, GMAIL.COMPOSER_CHECK_INTERVAL);
  }

  // Detect a case where the Gmail composer is visible and
  // invoke the onDetectGmailComposer callback.
  function detectGmailComposer(onDetectGmailComposer) {
    var newMessages = $(GMAIL_SELECTORS.NEW_MESSAGE_SELECTOR + ", " + 
      GMAIL_SELECTORS.REPLIES_SELECTOR + ", " + 
      GMAIL_SELECTORS.POPOUT_SELECTOR + ", " + 
      GMAIL_SELECTORS.FULL_SCREEN_SELECTOR);

    if (!newMessages || newMessages.length === 0) {
      return true;
    }
    newMessages.each(function() {
      var newMessage = $(this);

      
      if (!newMessage.is(":visible")) {
          return true; // can't insert in hidden element
      }
      if (newMessage.hasClass("aCk") && newMessage.find("form").length === 0) {
          return true; // a new popout composer must have a form in it
      }      
      // See if we've already enabled the RPost toolbar in this
      // composer widget:
      if (!newMessage.attr(RPOST_SELECTORS.ATTR_RPOST_ENABLED)) {
        // console.log('+ gmail composer detected; enabling rpost');       
        // Mark this composer as having been initialized with RPost so
        // we don't add more than one toolbar to the same composer:
        newMessage.attr(RPOST_SELECTORS.ATTR_RPOST_ENABLED, 'true');
        // Run our callback:
        //modifying for mutation observer


        // onDetectGmailComposer = InitComposer
        onDetectGmailComposer(newMessage);
      } else {
        // console.log('+ gmail composer detected; rpost already enabled');        
      }
    });
  }

  function detectComposerMutationObserver() {
    // select the target node
      var target = document.body;
      console.log(target);
       
      // create an observer instance
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {

          //console.log(mutation.target);

            // console.log('childList mutation detected');

            for (var i = 0; i < mutation.addedNodes.length; i++) {
              var node = $(mutation.addedNodes[i]);
              //console.log(node.attr('class'));

              if (node.hasClass('M9'))
                {
                console.log('new compose window found');

                detectGmailComposer(initComposer);
                }

              if (node.hasClass('aVN')) {
                console.log('mutating to full screen mode');
                
                // if ($(RPOST_SELECTORS.OPTS_BOX).is(':visible')) {
                //   moveOptsBoxFullScreenToggle();
                // }
              }
            }
        });
      });
      // configuration of the observer:
      var config = { childList: true, subtree: true };
      // pass in the target node, as well as the observer options
      observer.observe(target, config);
      // later, you can stop observing
      // observer.disconnect();
  }

    // ----------------------------------------------------------
  // Core initialization -- starting entry point
  // ----------------------------------------------------------

  function initComposer(newMessage) {

    initComposeUI(newMessage);
    // registerComposeListeners();
  }

  return {
    setIntervalDetectGmailComposer : setIntervalDetectGmailComposer,
    initComposer : initComposer,
    detectGmailComposer : detectGmailComposer,
    detectComposerMutationObserver : detectComposerMutationObserver,
    registerGmailSendButtonListeners : registerGmailSendButtonListeners
    // initTopUIAddon: initTopUIAddon,
    // setOAuth: setOAuth,
    // getOAuth: getOAuth
  };

})();
