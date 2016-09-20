'use strict';

console.log('RTrack for Gmail Loading...');
chrome.extension.sendMessage({ type: 'initialize' }, function(response) {
  var readyStateCheckInterval = setInterval(function() {
	
    if ( document.readyState === 'complete' ) {

  		clearInterval(readyStateCheckInterval);

  		// ----------------------------------------------------------
  		// This part of the script triggers when page is done loading
  		console.log('RMail for Gmail loaded.');
  		// ----------------------------------------------------------

        if ( response && response.isInit ) {
          console.log(response);
          

          // OAuthFunctions.confirmValidToken();
          // OAuthFunctions.updateLabelNames();
          //OAuthFunctions.initTooltipSequence();

        }
        // add the dom elements for top tab and opts bar
        // Top level Rpost Receipts tab is V2 so not executing
        // RPost.initTopUIAddon();

        RPost.detectComposerMutationObserver();
        RPost.detectGmailComposer(RPost.initComposer);
        // RPost.resizeListener();

        // RPost.keyPressesForTest();

        //RPost.insertTooltip();
    	}
  	}, 50);
});

var RPost = (function() {

  var self = this;

  var rmailEnabled = true;
  var plainTextModeEnabled = false;

  var oneClickSendEnabled = false;
  var encryptWithEsign = false;
  var readyToSend = false;

  var hasSeenToolTips = false;
  var optionsTabInitialized = false;

  // Template data
  var logo32Url = chrome.extension.getURL('images/rmail-logo-32.png');
  var logo28Url = chrome.extension.getURL('images/rmail-logo-28.png');

  // ----------------------------------------------------------
  // Constants
  // ----------------------------------------------------------

  var RPOST_SELECTORS = {
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
    TOP_INBOX_ROW_MARGIN : 'td.aKl'
  };

  /**
   * Inserts a handlebars template into DOM
   *
   */
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

  function insertHandlebarsTemplate(selector, template, data, elemToRemove, prepend, callback) {
    Templates.getDeferred(template, data).done(function(html) {
      // TO prevent duplicates. Pass false for elemToRemove if this stage unneeded
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

  function initComposeUI(newMessage) {
    //addRpostEnabledClass();

    // Detect reply mode or not and insert toolbar

    // Insert send registered button
    //insertHandlebarsTemplate(GMAIL_SELECTORS.SEND_MESSAGE_BTN_CONTAINER, 'send-registered-btn', {}, '.send-registered-btn', registerSendRegisteredButtonListeners);
    
    // Insert RTrack checkbox 
    //insertHandlebarsTemplate(GMAIL_SELECTORS.SEND_MESSAGE_BTN_CONTAINER, 'rtrack-checkbox', {iconUrl: logo32Url}, '.rtrack-checkbox', registerRtrackCheckboxListeners);

    insertHandlebarsTemplate(GMAIL_SELECTORS.SEND_MESSAGE_BTN_CONTAINER, 'rtrack-checkbox', {iconUrl: logo28Url}, '.rtrack-checkbox', false, registerRtrackCheckboxListeners);
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

  function detectPlainTextMode(newMessage) {

    var plainTextString = $(newMessage).find('.oG').text();

    // It is truly a pain in the butt to detect plain text mode. There is a selector that corresponds to the menu option, but 
    // it isn't present in the DOM until you click the menu button. This method will work when a window is opened. 
    // TODO: have this method attach an event listener so we can detect when we leave plain text mode. 
    // This will need to be internationalised properly as well. 
    
    console.log("is this ... : " + $(newMessage).find('.oG').text());
    console.log(plainTextString);

    if ( plainTextString === "Plain text" ) {
      console.log('looks like we found plain text!!!!');
      plainTextModeEnabled = true;
      plainTextWarning();
      disableRpost();
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
    });
  }

  function registerRtrackCheckboxListeners() {
    $(RPOST_SELECTORS.COMPOSE_RTRACK_CHECKBOX).click(function (e) {
      //
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
    detectComposerMutationObserver : detectComposerMutationObserver
    // initTopUIAddon: initTopUIAddon,
    // setOAuth: setOAuth,
    // getOAuth: getOAuth
  };

})();
