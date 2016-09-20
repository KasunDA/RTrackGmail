/*
 * Convenience methods for working with Handlebar templates, allowing
 * HTML to be externalized in /templates/<name>.hbs files rather than
 * hardcoded into the JavaScript layer.
 * .hbs == Handlebars extension
 */
var Templates = (function() {
  
  var TEMPLATES_DIR = 'templates/';
  var TEMPLATE_EXT = '.hbs'; // Handlebars standard

  // Returns a Deferred Object.
  // Use ".done(function(html) {..})" to access the HTML
  // on the returned deferred object.
  var getDeferred = function(name, data) {
    var url = chrome.extension.getURL(TEMPLATES_DIR + name + TEMPLATE_EXT);
    return $.get(url).then(function(src) {
      return Handlebars.compile(src)(data);
    });
  }

  return {
    getDeferred: getDeferred
  }
})();