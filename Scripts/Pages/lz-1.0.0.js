/***********Base View Model Methods**************/
function namespace(namespaceString) {
    var parts = namespaceString.split('.'),
        parent = window,
        currentPart = '';

    for (var i = 0, length = parts.length; i < length; i++) {
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
    }

    return parent;
}

var lz = namespace("lz");

lz.getRootUrl = function () {
    var currentURL = document.URL;
    var rootPosition = currentURL.indexOf("/", 7);
    var relativeHomeUrl = currentURL.substring(0, rootPosition + 1);
    return relativeHomeUrl + "MyProject/";
};

lz.showError = function (err) {
    var error = JSON.parse(err.responseText);
    $("<div></div>").html(error.Message).dialog({
        modal: true,
        title: "Error", buttons: {
            "Ok":
            function () { $(this).dialog("close"); }
        }
    }).show();
}

// Handle external login dialog callback
lz.loginCallback = function (success, returnUrl) {
    if (!returnUrl) {
        returnUrl = "/";
    }
    window.location.href = returnUrl;
}

// Fix place holder for IE9-
lz.fixPlaceholder = function () {
    //feature detection
    var hasPlaceholder = 'placeholder' in document.createElement('input');

    //sniffy sniff sniff -- just to give extra left padding for the older
    //graphics for type=email and type=url
    var isOldOpera = $.browser.opera && $.browser.version < 10.5;

    $.fn.placeholder = function (options) {
        //merge in passed in options, if any
        var options = $.extend({}, $.fn.placeholder.defaults, options),
        //cache the original 'left' value, for use by Opera later
        o_left = options.placeholderCSS.left;

        //first test for native placeholder support before continuing
        //feature detection inspired by ye olde jquery 1.4 hawtness, with paul irish
        return (hasPlaceholder) ? this : this.each(function () {

            //local vars
            var $this = $(this),
                inputVal = $.trim($this.val()),
                inputWidth = $this.width(),
                inputHeight = $this.height(),

                //grab the inputs id for the <label @for>, or make a new one from the Date
                placeholderText = $this.attr('placeholder'),
                placeholder = $('<label class="ie9-placeholder">' + placeholderText + '</label>');

            //stuff in some calculated values into the placeholderCSS object
            options.placeholderCSS['width'] = inputWidth;
            //options.placeholderCSS['height'] = inputHeight;

            // adjust position of placeholder 
            options.placeholderCSS.left = (isOldOpera && (this.type == 'email' || this.type == 'url')) ?
              '11%' : o_left;
            placeholder.css(options.placeholderCSS);

            //place the placeholder if the input is empty
            if (!inputVal) {
                $this.wrap(options.inputWrapper);
                $this.before(placeholder);

                // TODO: Add binding handling in case value is more complex than value:...

                var dataBind = $this.attr('data-bind');
                if (dataBind.trim().indexOf('value:') >= 0) {
                    placeholder.attr('data-bind', 'showHide: ' + dataBind.split(':')[1].trim() + '() == ""');
                    $this.attr('data-bind', '{' + dataBind + ' , valueUpdate: ["afterkeydown", "blur", "input"] }')
                }
            };
        });
    };

    //expose defaults
    $.fn.placeholder.defaults = {
        //you can pass in a custom wrapper
        inputWrapper: '<span style="position:relative"></span>',

        //more or less just emulating what webkit does here
        //tweak to your hearts content
        placeholderCSS: { 'left': '8px' }
    };

    $('[placeholder]').placeholder();
};

lz.getDlgCtx = function (ctrl) {
    return $(ctrl).closest('.dialog').data('koContext');
};

lz.closeDlg = function (ctrl) {
    return $(ctrl).closest('.qtip').qtip('hide');
};

// Exception Handling
lz.exp = {
    DeletetionHaveChildren: "Listonz.Models.DeletetionHaveChildrenLZException",
    ConnectionTimeoutException: "Listonz.Models.ConnectionTimeoutException",

    isOf: function (err, str) {
        try { return JSON.parse(err.responseText).ExceptionType == "Listonz.Models.DeletetionHaveChildrenLZException"; }
        catch (e) { }
        return false;
    },
    alert: function (title, msg) {
        $("<div title=\"" + title + "\">" + msg + "</div>").dialog({
            resizable: false,
            height: 'auto',
            modal: true,
            buttons: {
                Ok: function () {
                    $(this).dialog("close");
                }
            }
        });
    },

    msg: {
        idleTimeout: "You have been idle for 5 minutes, please click 'OK' to be redirected to login"
    }
};

$.ajaxSetup({
    error: function (xhr, status, error) {
        if (console && console.log)
            console.log("An AJAX error occured: " + status + "\nError: " + error);
    }
});