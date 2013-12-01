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
var vm = namespace("lz.viewModel");

// This method keeps check on how many view models are loaded.
// When all view models are finished loading, the loader can be hidden
vm.viewModelsToLoad = ko.observable(0);

// A flag to know if all the view models have finished loading
vm.allloaded = ko.observable(false);

// Base class for all the view models
vm.baseViewModel = function (extend) {
    "use strict";
    var self = this;

    extend.api(self);
    extend.model(self);
    extend.extend(self);

    vm.viewModelsToLoad(vm.viewModelsToLoad() + 1);

    // View model variables
    // ======================

    // Is current module loaded
    self.loaded = ko.observable(false);
    // Collection of all current entities
    self.collection = ko.observableArray([]);
    // Is edit mode in new mode
    self.isNew = ko.observable(true);
    // Are we asking for a deletion
    self.isDelete = ko.observable(false);

    self.showEditor = ko.observable(false);
    self.startSave = ko.observable();

    self.selectedID = ko.observable(-1);
    self.selected = ko.observable(new self.model());
    self.cancelEdit = function () { self.showEditor(false); };

    self.validationContext = ko.jqValidation({
        returnBool: false, // We want more details of our validation result.
        useInlineErrors: true, // Use inline errors
        errorClass: 'error', // Apply error class
        msg_empty: 'My friend, this just wont do.', // Global empty message.
        noInlineErrors: "*[type='password']" // Password fields should not show inline errors.
    });

    // Display a summasry of validation messages
    self.validationErrors = ko.observableArray([]);
    self.showEditor.subscribe(function () {
        if (!self.showEditor()) {
            self.validationErrors([]);
            lz.sammy.quietRoute(lz.sammy.path);
        }
    });

    // view model methods
    //=====================

    // Refresh the module data collection
    self.refresh = function () {
        self.collection.removeAll();
        $.getJSON(self.api + self.options.getAll(), function (data) {
            self.collection(data);

            if (self.selectedID() >= 0) {
                self.edit(self.selectedID());
            }

            self.selectedID(-1);
            self.loaded(true);
            vm.viewModelsToLoad(vm.viewModelsToLoad() - 1);

            if (vm.viewModelsToLoad() === 0)
                vm.allloaded(true);
        });
    }

    // Select a single entity in the collection
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

    // Check item for validity
    self.isItemValid = function (item) {
        // Check for validation rules
        var valid = true;
        for (var attr in item)
            if (typeof (item[attr]) != 'undefined' && typeof (item[attr].isValid) == 'function')
                valid &= item[attr].isValid();
        return valid;
    };

    // Save new or edited entity back into collection
    self.save = function (item) {

        if (self.startSave()) return;

        self.startSave(true);
        window.setTimeout(function () { self.startSave(false); }, 500);

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
            if (self.prepareDataForSave)
                self.prepareDataForSave(postData);
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

    // Enter into edit mode with given entity
    self.edit = function (data) {
        var d = null;
        var itemID = 0;
        if (data && !isNaN(data.Id) && data.Id != 0) {
            d = data;
            itemID = d.Id;
            self.isNew(false);
        } else if (data && !isNaN(data) && data != 0) {

            for (var i = 0; i < self.collection().length; i++)
                if (self.collection()[i].Id == data) {
                    d = self.collection()[i];
                    itemID = d.Id;
                    self.isNew(false);
                }

            // TODO: if no contact was found, give a proper message
            if (d == null) { return };
        } else {
            d = new self.model();
            self.isNew(true);
        };

        lz.sammy.quietRoute(lz.sammy.path + "/" + itemID);
        
        self.selected(d);
        self.showEditor(true);
    };

    // Delete given entity
    self.remove = function (item) {
        if (confirm(self.options.removeConfirm)) {
            var itemToRemove = ko.utils.unwrapObservable(ko.toJS(item));
            $.ajax({
                url: self.api + self.options.remove + "?id=" + itemToRemove.Id,
                type: "DELETE",
                success: function (data) {

                    for (var i = 0, j = self.collection().length; i < j; i++)
                        if (self.collection()[i].Id == itemToRemove.Id) {
                            self.collection.remove(self.collection()[i]);
                            break;
                        }

                    self.showEditor(false);
                },
                error: lz.showError
            });
        }
    };

    // Validate form
    self.validate = function () {
        if (!self.isValid()) {
            self.errors.showAllMessages();

            return false;
        }

        return true;
    };

    // Call extended method that are bound to the module
    extend.view(self);

    self.refresh();

};
/************************************************/

$.ajaxSetup({
    error: function (xhr, status, error) {
        if (console && console.log)
            console.log("An AJAX error occured: " + status + "\nError: " + error);
    }
});

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

/*********** ko extenssion methods **************/
// ko extenssions
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

ko.bindingHandlers.qtip = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        //initialize datepicker with some optional options
        var options = allBindingsAccessor().qtipOptions || {},
            content = valueAccessor() || '',
            position = allBindingsAccessor().qtipPosition || {
                my: "bottom center",
                at: "top center",
            },
            type = allBindingsAccessor().qtipType || 'Tooltip', // 'Tooltip', 'Form'
            onShow = allBindingsAccessor().qtipOnShow || null,
            $el = $(element);

        if ($(content).length > 0) {
            content = $(content);
            content.data('koContext', ko.contextFor($el[0]))
        }

        options.content = content;
        options.position = position;

        if (onShow) { options.events = options.events || {}; options.events.show = onShow; }

        if (type == 'Form') {
            options.show = 'click';
            options.hide = 'unfocus click';
        }

        $el.qtip(options);

        //handle the field changing
        //ko.utils.registerEventHandler(element, "change", function () {
        //    var observable = valueAccessor();
        //    observable($el.datepicker("getDate"));
        //});

        //handle disposal (if KO removes by the template binding)
        //ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
        //    $el.datepicker("destroy");
        //});

    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            $el = $(element);

        var current = $el.datepicker("getDate");

        if (value - current !== 0) {
            $el.datepicker("setDate", new Date(moment(value).format()));
        }
    }
};

ko.bindingHandlers.toggleClass = {
    toggleFunc: function (element, valueAccessor, allBindingsAccessor) {
        var toggleIf = valueAccessor() || '',
            className = allBindingsAccessor().toggleClassName,
            $el = $(element);

        if (toggleIf) $el.addClass(className);
        else $el.removeClass(className);
    },
    init: function (element, valueAccessor, allBindingsAccessor) {
        ko.bindingHandlers.toggleClass.toggleFunc(element, valueAccessor, allBindingsAccessor);
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        ko.bindingHandlers.toggleClass.toggleFunc(element, valueAccessor, allBindingsAccessor);
    }
};

ko.bindingHandlers.autoComplete = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

        var postUrl = valueAccessor();
        var updateValue = allBindingsAccessor().autocomplete_select;
        var renderItem = allBindingsAccessor().autocomplete_render;
        var cacheFilter = allBindingsAccessor().autocomplete_cache || false;
        var $el = $(element);

        var updateFunction = function (selectedItem, setTimeout) {
            $el.data('selected', selectedItem);
            if (updateValue && typeof (bindingContext.$parent[updateValue]) == 'function')
                bindingContext.$parent[updateValue](element, selectedItem, viewModel);

            if (setTimeout !== false)
                window.setTimeout(function () {
                    updateFunction(selectedItem, false);
                }, 1);
        };

        var cache = [];
        var getFromCache = function (s, url) {

            if (!s) return cache[url];

            var filterFunction = null;
            if (cacheFilter && typeof (bindingContext.$parent[cacheFilter]) == 'function')
                filterFunction = bindingContext.$parent[cacheFilter];

            if (!cache[url]) return null;

            return $.grep(cache[url], function (item) {
                if (!filterFunction)
                    return item.toLowerCase().indexOf(s.toLowerCase()) === 0;
                else
                    return filterFunction(item, s);
            });
        };
        var autoComp = $el.autocomplete({
            minLength: 0,
            autoFocus: false,
            source: function (request, response) {
                updateFunction(null, false);
                var _postUrl = valueAccessor().replace('REP_URL', encodeURIComponent(this.term));
                var term = this.term;
                if (!cacheFilter || cache[_postUrl] === undefined)
                    $.get(_postUrl,
                        function (data) 
                        {
                            if (cacheFilter) {
                                cache[_postUrl] = data;
                                response(getFromCache(term, _postUrl));
                            }
                            else {
                                response(data);
                            }
                        });
                else
                    response(getFromCache(term, _postUrl));
            },
            focus: function (event, ui) {
                updateFunction(ui.item);
            },
            select: function (event, ui) {
                updateFunction(ui.item);
            },
            change: function (event, ui) {
                updateFunction(ui.item);
            }

            // On later version it should be ui-autocomplete instead of autocomplete
        })

        if (renderItem && typeof (bindingContext.$parent[renderItem]) == 'function')
            autoComp.data("ui-autocomplete")._renderItem = bindingContext.$parent[renderItem];

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $el.autocomplete("destroy");
        });
    }
};

ko.bindingHandlers.datepicker = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        //initialize datepicker with some optional options
        var options = allBindingsAccessor().datepickerOptions || { },
            $el = $(element);

        options.dateFormat = options.dateFormat || 'dd/mm/yy';

        $el.datepicker(options);

        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function () {
            var observable = valueAccessor();
            observable($el.datepicker("getDate"));
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $el.datepicker("destroy");
        });

    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            $el = $(element);

        var current = $el.datepicker("getDate");

        if (value - current !== 0) {
            $el.datepicker("setDate", new Date(moment(value).format()));
        }
    }
};

ko.bindingHandlers.chars = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        //initialize datepicker with some optional options
        var type = valueAccessor() || '',
            $el = $(element);

        var patterns = [];
        patterns['phone'] = { match: /^[0-9-+]*$/g, replace: /[^0-9-+]/g }; // filtering digits, -, +

        //handle the field changing
        ko.utils.registerEventHandler(element, "change keypress input", function () {
            var e = event;
            var pattern = patterns['phone'];
            var key = 0;
            if (e != null) e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
            if (key != 0) {
                var char = String.fromCharCode(key);
                if (isNaN(char) && char != '-' && char != '+') return false;
            }
            else {
                if (!pattern.match.test($el.val())) {
                    // Filter non-digits from input value.
                    $el.val($el.val().replace(pattern.replace, ''));
                }
            }
        });
    }
};

/************************************************/


// Page load methods
lz.sammy = null;
$(function () {

    // Fixing loader location on screen
    var $loader = $('.loader');
    var $body = $('#body');
    var $footer = $('footer');
    
    $loader.css({
        paddingTop: ($(window).height() - $body.position().top - $footer.height() - $loader.height() - 200) / 2,
        paddingBottom: ($(window).height() - $body.position().top - $footer.height() - $loader.height() - 200) / 2
    });
    $loader.find('img').show();

    // Binding password strength control
    var $password = $('.pass-strength input[type=password]');

    if ($password.length > 0) {
        $password.get(0).passStrength = $password.password_strength({
            minLength: 8,
            specialLength: 0,
            messages: ["Are you kidding me?!", "A little better", "Almost there...", "Now that wan't so hard, was it?"]
        });
    }

    // Enable tabs on tab controls
    if ($('.tabs').tabs)
        $('.tabs').tabs()
        .find('>ul>li>a').click(function () {


            var currentTabID = $(this).attr('href');
            if (currentTabID != window.location.hash.replace('#/', '#tab')) {
                window.location = currentTabID.replace('#tab', '#/');
            }
            else {
                var $view = $(currentTabID + ':visible .vm-view');

                if ($view[0]) {
                    var viewModel = ko.dataFor($view[0]);
                    var showEditor = viewModel.showEditor();
                    if ($view.length > 0)
                        viewModel.showEditor(false);
                    if (!showEditor)
                        viewModel.showEditor.valueHasMutated();
                }
            }
        });

    // Binding all view models
    ko.applyBindings(lz.viewModel);

    // Placeholder fix for ie9
    lz.fixPlaceholder();

    lz.sammy = $.sammy('.tabs', function () {

        var sammy = this;
        sammy.quiet = false; //set quiet to false by default

        //I set quiet to true before running a route
        sammy.quietRoute = function (location) {
            sammy.quiet = true;
            sammy.setLocation(location);
        }

        //I'm called after every route to reset quiet to false
        sammy.after(function () {
            sammy.quiet = false;
        });

        sammy.path = '';
        sammy.subPath = '';
        function showView(tabElement, contextPath, itemID) {
            var savePath = sammy.path;
            var saveSubPath = sammy.subPath;
            try {
                $(tabElement).trigger('click');

                // Getting ko context
                if (contextPath) {
                    var selectedTab = $(contextPath);
                    var koContext = ko.contextFor(selectedTab[0]);
                    koContext.$data.selectedID(itemID || null);
                    koContext.$data.refresh();
                }
            }
            finally {
                sammy.quietRoute(savePath + (saveSubPath ? '/' + saveSubPath : ''));
            }
        }

        $('[tabTrigger]').each(function () {
            var $el = $(this);
            var triggerPath = $el.attr('tabTrigger');
            var contextPath = $el.attr('tabSubPath');

            $el.mousedown(function () {
                if ($(this).parent().hasClass('ui-tabs-active'))
                    try
                    {
                        var tabSubPath = $(this).attr('tabsubpath');
                        var ctx = ko.dataFor($(tabSubPath)[0]);
                        ctx.refresh();
                    }
                    catch (e) { }
            });

            sammy.get(triggerPath, function (context) {
                sammy.path = triggerPath;
                sammy.subPath = '';
                if (sammy.quiet) return;
                showView($el);
            });

            if (contextPath)
                sammy.get("#/Contacts/:ItemID", function (context) {
                    sammy.path = triggerPath;
                    sammy.subPath = context.params.ItemID;
                    if (sammy.quiet) return;
                    showView($el, contextPath, context.params.ItemID);
                });
        });
    });

    $(function () {
        try {
            var defaultPath = $('[tabDefault]').first().attr('tabTrigger');
            lz.sammy.run(defaultPath);
        }
        catch (e) { }
    });
});

