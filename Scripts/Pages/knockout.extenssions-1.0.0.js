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

        try {
            $el.qtip("api").hide();
            $el.qtip("api").destroy();
            $el.removeClass('generated_qtip');
        } catch (err) { };

        var $content = null;
        try { $content = $(content); } catch (e) { }

        if ($content != null && $content.length > 0) {
            content = $(content); /* Note that you shouldn't use the same content as two different tooltips */
            content.data('koContext', ko.contextFor($el[0]))
        }

        if (content == "next-ph") content = $el.next().find('input').attr('placeholder');

        options.content = content;
        options.position = position;

        if (onShow) { options.events = options.events || {}; options.events.show = onShow; }

        if (type == 'Form') {
            options.show = 'click';
            options.hide = 'unfocus click';
        } else if (type == "HoverStayOpen") {
            options.hide = 'unfocus click';
        }

        $el.qtip(options);
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
                        function (data) {
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
        var options = allBindingsAccessor().datepickerOptions || {},
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

// Making the content scrollable when page size is too small and items count threthold is too big
ko.bindingHandlers.pageScoll = {
    setCalculatedHeight: function (element, valueAccessor, allBindingsAccessor) {
        //initialize datepicker with some optional options
        var data = valueAccessor() || {},
            $el = $(element);

        data = ko.utils.extend({ rowHeight: 20, headerHeight: 20, heightDelta: 300 }, data);

        var newHeight = $(window).height() - data.heightDelta;
        $el.height(newHeight);
        if (ko.dataFor(element).collection().length > ((newHeight - data.headerHeight) / data.rowHeight)) {
            $el.addClass('Scrollable');
            $el.find('.ScrollArea').height(newHeight);
        }
        else
            $el.removeClass('Scollable');
    },
    init: function (element, valueAccessor, allBindingsAccessor) {
        ko.bindingHandlers.pageScoll.setCalculatedHeight(element, valueAccessor, allBindingsAccessor);
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        ko.bindingHandlers.pageScoll.setCalculatedHeight(element, valueAccessor, allBindingsAccessor);
    }
};

ko.bindingHandlers.rateit = {
    init: function (element, valueAccessor) {
        var local = ko.toJS(valueAccessor()),
            options = {};

        if (typeof local === 'number') {
            local = {
                value: local
            };
        }

        ko.utils.extend(options, ko.bindingHandlers.rateit.options);
        ko.utils.extend(options, local);

        $(element).rateit(options);
        //register an event handler to update the viewmodel when the view is updated.
        $(element).bind('rated reset', function (event, value) {
            var floa = parseFloat((value || 0).toFixed(1));
            var observable = valueAccessor();
            if (ko.isObservable(observable)) {
                observable(floa);
            } else {
                if (observable.value !== undefined && ko.isObservable(observable.value)) {
                    observable.value(floa);
                }
            }
        });
    },
    update: function (element, valueAccessor) {
        var local = ko.toJS(valueAccessor());

        if (typeof local === 'number') {
            local = {
                value: local
            };
        }
        if (local.value !== undefined) {
            var floa = parseFloat(local.value || "0").toFixed(1);
            $(element).rateit('value', floa);
        }

    },
    options: {
        //this section is to allow users to override the rateit defaults on a per site basis.
        //override by adding ko.bindingHandlers.rateit.options = { ... }
    }
};

/************************************************/