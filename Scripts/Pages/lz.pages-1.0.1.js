/***********this section is pulled from my typical Utility.js include**************/
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

lz.AjaxtoJSON = function (params) {
    var param = new Object();
    param.serviceName = params.serviceName;
    param.methodName = params.methodName;
    param.zeroValue = params.zeroValue;
    param.serviceData = params.serviceData;
    param.async = params.async || false;

    var result;

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: myUtes.getRootUrl() + "Webservices/" + param.serviceName + ".asmx/" + param.methodName,
        data: JSON.stringify(param.serviceData),
        async: param.async,
        dataType: "json",
        success: function (data, textResponse) {
            result = $.parseJSON(data.d);
            if (param.zeroValue) {
                result.unshift(param.zeroValue);
            }
        }
    });
    return result;

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

lz.loginCallback = function (success, returnUrl) {
    if (!returnUrl) {
        returnUrl = "/";
    }
    window.location.href = returnUrl;
}


// ko extenssions
// ==================
ko.bindingHandlers.showHide = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var val = ko.utils.unwrapObservable(valueAccessor());
        if (val === "" || val === true) { $(element).show("fast"); }
        else { $(element).hide("fast"); }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {

        var val = ko.utils.unwrapObservable(valueAccessor());
        if (val === "" || val === true) { $(element).show("fast"); }
        else { $(element).hide("fast"); }
    }
};

ko.bindingHandlers.rv = {
    init: function (element, valueAccessor, allBindingsAccessor) {

        var getInjectValueUpdate = function (allBindingsAccessor) {
            var AFTERKEYDOWN = "afterkeydown";
            return function () {
                var allBindings = ko.utils.extend({}, allBindingsAccessor()),
                    valueUpdate = allBindings.valueUpdate;

                if (valueUpdate === undefined) {
                    return ko.utils.extend(allBindings, { valueUpdate: AFTERKEYDOWN });
                } else if (typeof valueUpdate === 'string' && ko.utils.arrayIndexOf(AFTERKEYDOWN, valueUpdate) === -1 ||
                           typeof valueUpdate === 'array' /*&& ko.utils.arrayIndexOf(valueUpdate, AFTERKEYDOWN) === -1*/) {
                    valueUpdate = ko.utils.arrayPushAll(AFTERKEYDOWN, valueUpdate);
                    return ko.utils.extend(allBindings, { valueUpdate: [valueUpdate, AFTERKEYDOWN] });
                }

                return allBindings;
            };
        };

        allBindingsAccessor = getInjectValueUpdate(allBindingsAccessor);
        return ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);
    },
    update: ko.bindingHandlers.value.update
};

ko.bindingHandlers.autoComplete = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

        var postUrl = valueAccessor();
        var updateValue = allBindingsAccessor().autocomplete_select;

        var updateFunction = function (selectedItem, setTimeout) {
            $(element).data('selected', selectedItem);
            if (updateValue && typeof (bindingContext.$parent[updateValue]) == 'function')
                bindingContext.$parent[updateValue](element, selectedItem, viewModel);

            if (setTimeout !== false)
                window.setTimeout(function () {
                    updateFunction(selectedItem, false);
                }, 1);
        };

        $(element).autocomplete({
            minLength: 0,
            autoFocus: false,
            source: function (request, response) {
                updateFunction(null, false);
                $.ajax({
                    url: postUrl.replace('REP_URL', this.term),
                    data: { term: request.term },
                    success: function (data) {
                        response(data);
                    },
                    error: function (e) {
                        alert(e);
                    }
                });
            },
            focus:function (event, ui) {
                updateFunction(ui.item);
            },
            select: function (event, ui) {
                updateFunction(ui.item);
            },
            change: function (event, ui) {
                updateFunction(ui.item);
            }

        // On later version it should be ui-autocomplete instead of autocomplete
        }).data("autocomplete")._renderItem = function (ul, item) {
            return $("<li style='display:inline-block'>")
                .data('item.autocomplete', item)
                .append("<a><div class='float-left'><img src='/images/companyLogo.png' /></div><div>" + item.FirstName + ' ' + item.LastName + "<br>Email: " + item.Email + "</div></a>")
                .appendTo(ul);
        };
    }
};

// View Model definition
var vm = namespace("lz.viewModel");
vm.viewModelsToLoad = ko.observable(0);
vm.allloaded = ko.observable(false);
vm.baseViewModel = function (extend) {
    var self = this;

    extend.extend(self);
    extend.api(self);
    extend.model(self);

    vm.viewModelsToLoad(vm.viewModelsToLoad() + 1);

    // View model variables
    self.loaded = ko.observable(false);
    self.collection = ko.observableArray([]);
    self.isNew = ko.observable(true);
    self.isDelete = ko.observable(false);

    self.showEditor = ko.observable(false);
    self.startSave = ko.observable();

    self.selected = ko.observable(new self.model());
    self.cancelEdit = function () { self.showEditor(false); };

    self.validationContext = ko.jqValidation({
        returnBool: false, // We want more details of our validation result.
        useInlineErrors: true, // Use inline errors
        errorClass: 'error', // Apply error class
        msg_empty: 'My friend, this just wont do.', // Global empty message.
        noInlineErrors: "*[type='password']" // Password fields should not show inline errors.
    });
    self.validationErrors = ko.observableArray([]);

    // view model methods
    self.refresh = function () {
        self.collection.removeAll();
        $.getJSON(self.api + self.options.getAll, function (data) {
            self.collection(data);
            self.loaded(true);
            vm.viewModelsToLoad(vm.viewModelsToLoad() - 1);

            if (vm.viewModelsToLoad() === 0)
                vm.allloaded(true);
        });
    }

    self.select = ko.dependentObservable(function () {
        var selected = self.selected();
        var result = ko.utils.arrayFilter(self.collection(), function (item) {
            return item == selected
        });
        if (result.length != 0) {
            result = ko.toJS(result)[0];
            var observable = ko.mapping.fromJS(result);
            return observable;
        } else {
            return new self.model();
        };
    }, self);

    self.isItemValid = function (item) {
        // Check for validation rules
        var valid = true;
        for (var attr in item)
            if (typeof (item[attr]) != 'undefined' && typeof (item[attr].isValid) == 'function')
                valid &= item[attr].isValid();
        return valid;
    };

    self.save = function (item) {

        self.startSave.valueHasMutated();

        // Check for validation rules
        var validationResult = self.validationContext.Validate();
        if (!validationResult.valid) {
            // Oh boy, you're in troubleeeeee!
            self.validationErrors(validationResult.messages);
            return;
        }
        
        window.setTimeout(function () {

            // check if new or update
            var postData = ko.toJS(ko.utils.unwrapObservable(item));
            if (self.isNew())
                $.post(self.api + self.options.add, postData, function (data) {
                    self.collection.push(data);
                });
            else
                $.ajax({
                    url: self.api + self.options.update + "?id=" + postData.Id,
                    data: postData,
                    type: "PUT",
                    success: function (data) {
                        if (arguments.length > 2 && arguments[2] != null && arguments[2].responseText != '')
                            postData = JSON.parse(arguments[2].responseText)
                        for (var i = 0, j = self.collection().length; i < j; i++)
                            if (self.collection()[i].Id == postData.Id)
                                self.collection.replace(self.collection()[i], postData);
                    },
                    error: lz.showError
                });
            self.showEditor(false);
        }, 100);
    };

    self.edit = function (data) {
        var d;
        if (data && !isNaN(data.Id) && data.Id != 0) {
            d = data;
            self.isNew(false);
        } else {
            d = new self.model();
            self.isNew(true);
        };
        self.selected(d);
        self.showEditor(true);
    };

    self.remove = function (item) {
        if (confirm(self.options.removeConfirm)) {
            $.ajax({
                url: self.api + self.options.remove + "?id=" + item.Id,
                type: "DELETE",
                success: function (data) {
                    self.collection.remove(item);
                },
                error: lz.showError
            });
        }
    };

    self.validate = function () {
        if (!self.isValid()) {
            self.errors.showAllMessages();

            return false;
        }

        return true;
    };

    extend.view(self);

    self.refresh();

};

/**********************************************************************************/

// Page load methods
$(function () {

    var $loader = $('.loader');
    var $body = $('#body');
    var $footer = $('footer');
    
    $loader.css({
        paddingTop: ($(window).height() - $body.position().top - $footer.height() - $loader.height() - 200) / 2,
        paddingBottom: ($(window).height() - $body.position().top - $footer.height() - $loader.height() - 200) / 2
    });
    $loader.find('img').show();

    var $password = $('.pass-strength input[type=password]');

    if ($password.length > 0) {
        $password.get(0).passStrength = $password.password_strength({
            minLength: 8,
            specialLength: 0,
            messages: ["Are you kidding me?!", "A little better", "Almost there...", "Now that wan't so hard, was it?"]
        });
    }

    if ($('.tabs').tabs) $('.tabs').tabs();

    // Fixing placeholders
    /*if (!Modernizr.input.placeholder) {
        $('[placeholder]').each(function () {
            $this = $(this);
            if ($this.attr('placeholder'))
                $this.before(
                    $('<label class="placeholder" onclick="$(this).next().focus();"></label>').text($this.attr('placeholder')));

            $this.blur(function () {
                var input = $(this);
                if (input.val() == '')
                    input.prev().show();
                else
                    input.prev().hide();
            }).focus(function () {
                alert($(this).prev('label').text());
                $(this).prev('label').hide();
            });
        });
        /*$('[placeholder]').focus(function () {
            var input = $(this);
            if (input.val() == input.attr('placeholder')) {
                input.val('');
                input.removeClass('placeholder');
            }
        }).blur(function () {
            var input = $(this);
            if (input.val() == '' || input.val() == input.attr('placeholder')) {
                input.addClass('placeholder');
                input.val(input.attr('placeholder'));
            }
        })
        .blur()
        .parents('form').submit(function () {
            $(this).find('[placeholder]').each(function () {
                var input = $(this);
                if (input.val() == input.attr('placeholder')) {
                    input.val('');
                }
            })
        });*
    }*/
});

// Placeholder fix for ie9
(function ($) {
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
})(jQuery);