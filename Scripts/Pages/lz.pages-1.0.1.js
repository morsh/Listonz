﻿
// This method keeps check on how many view models are loaded.
// When all view models are finished loading, the loader can be hidden
var vm = namespace("lz.viewModel");
vm.viewModelsToLoad = ko.observable(0);

// A flag to know if all the view models have finished loading
vm.allloaded = ko.observable(true);

// The following properties 
vm.events = new function () {
    var self = this;

    self.init = function () {
        self.module = ko.observable('');
        self.action = ko.observable('');
        self.data = ko.observable();
    };
    self.init();

    self.trigger = function (eModule, eAction, eData) {

        // Making sure not in the middle of another call - should change to a multiple calls system
        if (self.module()) return;

        self.action(eAction);
        self.data(eData);
        self.module(eModule);

        self.init();
    };

    self.watch = function (eModule, method) {
        self.module.subscribe(function (newValue) {
            if (newValue == eModule) method();
        });
    };
};

// Base class for all the view models
vm.baseViewModel = function (extend) {
    "use strict";
    var self = this;

    self.widget = {
        isWidget: false,
        selectTop: 5
    };

    extend.api(self);
    extend.model(self);
    extend.extend(self);

    // Adding 1 to loader so that when all loaders finish loading, the general loader.gif will stop
    vm.viewModelsToLoad(vm.viewModelsToLoad() + 1);

    // View model variables
    // ======================

    // Is current module loaded
    self.loaded = ko.observable(false);
    self.loading = ko.observable(false);

    // Collection of all current entities
    self.collection = ko.observableArray([]);
    // Is edit mode in new mode
    self.isNew = ko.observable(true);
    // Are we asking for a deletion
    self.isDelete = ko.observable(false);

    self.showEditor = ko.observable(false);
    self.startSave = ko.observable();
    self.sort = ko.observable('Category.Name:FirstName');
    self.sortDir = ko.observable('asc');
    self.sortType = ko.observable('s');
    self.isSortColumn = function (element) {
        var sortExp = $(element || event.srcElement).attr('sort-exp');
        return self.sort() == sortExp;
    }
    self.sortClick = function () {
        var $el = $(event.srcElement).closest('.sort');
        var sortExp = $el.attr('sort-exp');
        var sortType = $el.attr('sort-type');
        var dir = self.sort() == sortExp && self.sortDir() == 'asc' ? 'desc' : 'asc';
        self.sort(sortExp);
        self.sortType(sortType ? sortType : 's');
        self.sortDir(dir);

        self.sortedCollection.notifySubscribers();
    };
    self.filter = ko.observable('');

    self.selectedID = ko.observable(-1);
    self.selectedID.subscribe(function () {
        if (self.selectedID() > 0 && self.loaded()) {
            self.edit(self.selectedID());
            self.selectedID(-1);
        }
    });

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

    // TODO:
    // When the event is insert \ update, only need to do it with one element (when views are loaded)
    self.notifying = ko.observable(false);
    self.refreshConnectedModules = function () {
        // if this is not the first refresh of the module, there are modules to refresh and , trigger refresh event
        if (self.loaded() && self.options.refreshModules) {
            self.notifying(true);
            $.each(self.options.refreshModules.split(' '), function (i, v) {
                if ($.trim(v)) { vm.events.trigger(v, 'refresh'); }
            });
            self.notifying(false);
        }
    };
    // subscribe to module changes
    if (self.options.refreshModules)
        $.each(self.options.refreshModules.split(' '), function (i, v) {
            vm.events.watch(v, function () {
                if (!self.notifying() && vm.events.module() == v)
                    if (vm.events.action() == "refresh") self.refresh();
                    else if (vm.events.action() == "add") self.refresh();
            });
        });

    // Refresh the module data collection
    self.refresh = function () {

        if (self.loading()) return;

        self.collection.removeAll();

        self.loading(true);
        $.getJSON(self.api + self.options.getAll(), function (data) {

            var modelCollection = [];
            for (var i = 0; i < data.length; i++)
                modelCollection.push(new self.model(data[i]));

            self.collection(modelCollection);

            if (self.selectedID() >= 0) {
                self.edit(self.selectedID());
            }

            self.selectedID(-1);
            self.loading(false);

            if (vm.viewModelsToLoad() > 0) {
                self.loaded(true);
                vm.viewModelsToLoad(vm.viewModelsToLoad() - 1);

                if (vm.viewModelsToLoad() === 0)
                    vm.allloaded(true);
            }
        });

        self.refreshConnectedModules();
    }

    self.sortedCollection = ko.computed(function () {
        var items = self.collection();
        var _sort = self.sort();
        var _filter = self.filter().toLowerCase();
        var _isRelevant = function (o) {
            for (var k in o) {
                var v = typeof(o[k]) == 'function' ? o[k]() : o[k];
                if ((typeof v == "string" && v.toLowerCase().indexOf(_filter) >= 0) ||
                    (typeof v == "object" && _isRelevant(v)))
                    return true;
            }
            return false;
        }
        if (_filter != '')
            items = items.filter(function (r) {
                return _isRelevant(r);
            });
        if (_sort != '') {
            var _numeric = self.sortType() == 'n';
            var _asc = self.sortDir() == 'asc' ? 1 : -1;
            var _sortParts = _sort.split(':');
            var _sortValues = [];
            for (var p in _sortParts) _sortValues[p] = _sortParts[p].split('.');
            var getVal = function (obj) {
                var _val = _numeric ? 0 : '';
                for (var v in _sortValues) {
                    var _obj = obj;
                    var _sortTerms = _sortValues[v];
                    for (var t in _sortTerms)
                        _obj = _obj ? _obj[_sortTerms[t]]() : (_numeric ? 0 : '_');
                    _val += _obj;
                }
                return _val;
            };
            items = items.sort(function (left, right) {
                var _left = getVal(left), _right = getVal(right);
                return _left == _right ? 0 : (_left < _right ? (-_asc) : _asc);
            });
        }

        return items;
    });

    // Select a single entity in the collection
    self.select = ko.dependentObservable(function () {

        if (self.isNew() && self.showEditor())
            return self.select._latestValue;

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

            // If this is a new item
            if (self.isNew())
                $.post(self.api + self.options.add, postData, function (data) {
                    postData = new self.model(data);
                    self.collection.push(postData);
                    if (self.widget.isWidget && self.collection().length >= self.widget.selectTop)
                        self.collection.pop();

                    self.refreshConnectedModules();
                });

            // If Updating an existing item
            else
                $.ajax({
                    url: self.api + self.options.update + "?id=" + postData.Id,
                    data: postData,
                    type: "PUT",
                    success: function (data) {
                        if (arguments.length > 2 && arguments[2] != null && arguments[2].responseText != '')
                            postData = JSON.parse(arguments[2].responseText)
                        postData = new self.model(postData);
                        for (var i = 0, j = self.collection().length; i < j; i++)
                            if (self.collection()[i].Id() == postData.Id())
                                self.collection.replace(self.collection()[i], postData);

                        self.refreshConnectedModules();
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
        if (data && typeof(data.Id) == "function" && data.Id() != 0) {
            d = data;
            itemID = d.Id();
            self.isNew(false);
        } else if (data && !isNaN(data) && data != 0) {

            for (var i = 0; i < self.collection().length; i++)
                if (self.collection()[i].Id() == data) {
                    d = self.collection()[i];
                    itemID = d.Id();
                    self.isNew(false);
                }

            // TODO: if no contact was found, give a proper message
            if (d == null) { return };
        } else {
            d = new self.model();
            self.isNew(true);
        };

        self.selected(d);
        self.showEditor(true);


        lz.sammy.quietRoute(lz.sammy.path + "/" + itemID);

        // Prevent row from editing the contact
        event.cancelBubble = true;
    };

    // Delete given entity
    self.remove = function (item) {

        $("<div title=\"Delete Confirmation\">" + self.msg.removeConfirm(item) + "</div>").dialog({
            resizable: false,
            modal: true,
            buttons: {
                "Delete": function () {

                    var itemToRemove = ko.utils.unwrapObservable(ko.toJS(item));
                    var $this = $(this);
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
                            self.refresh();
                            $this.dialog("close");
                        },
                        error: function (err) {
                            $this.dialog("close");

                            if (lz.exp.isOf(err, lz.exp.DeletetionHaveChildren))
                                lz.exp.alert("Delete Confirmation", self.msg.exp_childrenConfirm);
                            else
                                lz.showError(err);
                        }
                    });

                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        });

        // Prevent row from editing the contact
        event.cancelBubble = true;
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
};
/************************************************/

/* This object handles the timeout check for redirecting to login form
/* Each time the user performs
*/
lz.idle = {
    _timeout: (30 * 60 * 1000), /* in milliseconds */
    _lastActive: new Date(),
    _dialogOpen: false,
    active: function () { this._lastActive = new Date(); },
    check: function () {
        var now = new Date();
        if (now - this._lastActive > this._timeout && !this._dialogOpen) {
            this._dialogOpen = true;
            $("<div title=\"Idle Logout\">" + lz.exp.msg.idleTimeout + "</div>").dialog({
                resizable: false,
                height: 'auto',
                modal: true,
                buttons: {
                    Ok: function () {
                        window.location = '/';
                    }
                }
            });
        }
        return !this._dialogOpen;
    },
    load: function () {
        setInterval(lz.idle.check, 60000);
        $(window).bind("focus", function (event) {
            lz.idle.check();
        });
        $(document).ajaxSend(function () {
            if (lz.idle.check())
                lz.idle.active();
        });
    }
};

$(function () { if (!lz.cancelIdle) lz.idle.load(); });


// Page load methods (Sammy)
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

    // Enable tabs on tab controls
    var _lastClickedView = null;
    if ($('.tabs').tabs)
        $('.tabs').tabs()
        .find('>ul>li>a').click(function () {

            // First click navigated to destination hash
            // second click (automated by navigation) clicks on the view
            var $a = $(this);
            var currentTabPath = $a.attr('tabTrigger');
            if (currentTabPath != window.location.hash) {
                window.location = currentTabPath;
            }
            else {
                var currentTabID = $a.attr('href');
                var $view = $(currentTabID + ':visible .vm-view');

                if ($view[0]) {
                    var viewModel = ko.dataFor($view[0]);
                    var showEditor = viewModel.showEditor();
                    if ($view.length > 0)
                        viewModel.showEditor(false);
                    if (!showEditor)
                        viewModel.showEditor.valueHasMutated();
                    if (!showEditor && _lastClickedView == currentTabPath) viewModel.refresh();
                }

                _lastClickedView = currentTabPath;
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
                    koContext.$data.selectedID(itemID || -1);
                    if (!koContext.$data.loaded())
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

            sammy.get(triggerPath, function (context) {
                sammy.path = triggerPath;
                sammy.subPath = '';
                if (sammy.quiet) return;
                showView($el, contextPath);
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

    // Set the default tab
    $(function () {
        try {
            var defaultPath = $('[tabDefault]').first().attr('tabTrigger');
            lz.sammy.run(defaultPath);
        }
        catch (e) { }
    });
});