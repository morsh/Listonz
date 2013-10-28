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
        if (val) {
            $(element).show("fast");
        } else {
            $(element).hide("fast");
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {

        var val = ko.utils.unwrapObservable(valueAccessor());

        if (val) { $(element).show("fast"); }
        else { $(element).hide("fast"); }
    }
};

// View Model definition
var vm = namespace("lz.viewModel");

/*********************************************
// Example of usage in model:
var vm = namespace("lz.viewModel");
vm.contacts = new vm.baseViewModel({
    api: function (self) {
        self.api = "/api/contacts/";
        self.options = {
            getAll: "GetContacts",
            add: "PostContact",
            update: "PutContact",
            remove: "DeleteContact",
            removeConfirm: "Are you sure you want to delete this contact?"
        };
    },
    model: function (self) {
        self.model = function () {
            this.Id = ko.observable(0);
            this.FirstName = ko.observable('');
            this.LastName = ko.observable('');
            this.Company = ko.observable('');
            this.Country = ko.observable('');
        }
    },
    view: function (self) {

    }
}); 
**********************************************/
vm.baseViewModel = function (extend) {
    var self = this;

    extend.api(self);
    extend.model(self);

    

    // View model variables
    self.collection = ko.observableArray([]);
    self.isNew = ko.observable(true);
    self.isDelete = ko.observable(false);
    self.showEditor = ko.observable(false);
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

        // Check for validation rules
        var validationResult = self.validationContext.Validate();
        if (!validationResult.valid) {
            // Oh boy, you're in troubleeeeee!
            self.validationErrors(validationResult.messages);
            return;
        }
        
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
                    for (var i = 0, j = self.collection().length; i < j; i++) 
                        if (self.collection()[i].Id == postData.Id)
                            self.collection.replace(self.collection()[i], postData);
                },
                error: lz.showError
            });
        self.showEditor(false);
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

$(function () {
    var $password = $('.pass-strength input[type=password]');

    if ($password.length > 0) {
        $password.get(0).passStrength = $password.password_strength({
            minLength: 8,
            specialLength: 0,
            messages: ["Are you kidding me?!", "A little better", "Almost there...", "Now that wan't so hard, was it?"]
        });
    }
});