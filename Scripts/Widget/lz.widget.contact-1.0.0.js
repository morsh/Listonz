﻿var vm = namespace("lz.viewModel");

vm.contacts = new vm.baseViewModel({

    api: function (self) {

        // Constants
        self.CompanyCategoryId = 2;

        // Parameters for general calls
        self.api = "/api/contacts/";
        self.options = {
            getAll: function (clear) { return "GetContacts" + (self.categoryId() == 0 || clear ? '' : '?$filter=CategoryId eq ' + self.categoryId()); },
            add: "PostContact",
            update: "PutContact",
            remove: "DeleteContact",

            updateRating: 'UpdateRating',
            refreshModules: 'contacts'
        };
        self.msg = {
            removeConfirm: function (item) {
                if (item.Category && item.Category.Name == "Company")
                    return "Are you sure you want to delete this company? All of it's contacts will still be available.";
                else
                    return "Are you sure you want to delete this contact?";
            },
            exp_childrenConfirm: "This company has other contacts under it",
            cat_removeConfirm: function (item) {
                return "Are you sure you want to delete this category? All of it's contacts will still be available.";
            }
        };

        self.cat_api = "/api/contactscategories/";
        self.cat_options = {
            getAll: function () { return "Get"; },
            add: "Post",
            update: "Put",
            remove: "Delete"
        };

    },
    model: function (self) {
        self.model = function (fromObject) {

            var obj = $.extend(true, {}, fromObject, { Company: {}, Category: {} });
            var mdl = this;
            mdl.Id = ko.observable(obj.Id);
            mdl.UserId = ko.observable(obj.UserId);

            mdl.FirstName = ko.observable(obj.FirstName);
            mdl.LastName = ko.observable(obj.LastName);
            mdl.FullName = ko.computed(function () {
                return mdl.FirstName() + ' ' + (mdl.LastName() || '');
            });
            mdl.ProfilePicture = ko.observable(obj.ProfilePicture);

            mdl.CompanyId = ko.observable(obj.CompanyId);
            mdl.Company = ko.observable({
                Id: ko.observable(obj.Company.Id),
                FirstName: ko.observable(obj.Company.FirstName)
            });
            mdl.Country = ko.observable(obj.Country);
            mdl.State = ko.observable(obj.State);
            mdl.City = ko.observable(obj.City);
            mdl.Street = ko.observable(obj.Street);
            mdl.Notes = ko.observable(obj.Notes);
            mdl.CategoryId = ko.observable(obj.CategoryId);
            mdl.Category = ko.observable({
                Id: ko.observable(obj.Category.Id),
                Name: ko.observable(obj.Category.Name)
            });

            mdl.Email = ko.observable(obj.Email);
            mdl.PhoneNumber = ko.observable(obj.PhoneNumber);
            mdl.MobileNumber = ko.observable(obj.MobileNumber);
            mdl.FaxNumber = ko.observable(obj.FaxNumber);
            mdl.Birthday = ko.observable(obj.Birthday);
            mdl.Single = ko.observable(obj.Single);
            mdl.SocialSecurity = ko.observable(obj.SocialSecurity);
            mdl.DrivingLisence = ko.observable(obj.DrivingLisence);
            mdl.Rating = ko.observable(obj.Rating);
            mdl.LastUpdate = ko.observable(obj.LastUpdate).extend({ date: true });

            mdl.SocialData = ko.observable(obj.SocialData);
            mdl.Social = ko.computed(function () {
                return JSON.parse(mdl.SocialData() || "{}") || {};
            });
        }

        self.categoryModel = function () {
            this.Id = ko.observable(0);
            this.Name = ko.observable('');
        };
    },
    extend: function (self) {

        // Handle Properties
        // =================
            self.hover = ko.observable(new self.model());
            self.hoverRating = ko.observable();
            var stopEvents = false;
            self.updateHover = function (data) {
                stopEvents = true;
                self.hover(data);
                self.hoverRating(self.hover().Rating);
                stopEvents = false;
            };
            self.hoverRating.subscribe(function () {
                if (!stopEvents) {
                    var postData = {
                        id: self.hover().Id,
                        newRating: self.hoverRating()
                    };
                    $.post(self.api + self.options.updateRating + "?id=" + postData.id + "&newRating=" + postData.newRating,
                        { postData: postData },
                        function (data) {
                            if (arguments.length > 2 && arguments[2] != null && arguments[2].responseText != '')
                                postData = JSON.parse(arguments[2].responseText)
                            for (var i = 0, j = self.collection().length; i < j; i++)
                                if (self.collection()[i].Id == postData.Id)
                                    self.collection.replace(self.collection()[i], postData);
                        });
                }
            });

            self.Categories = ko.observableArray([]);
            self.tabsNewCategoryName = ko.observable('');
            self.tabsAddNewMode = ko.observable(false);
            $.get(self.cat_api + self.cat_options.getAll(), function (data) {
                self.Categories(data);
            });

            self.categoryId = ko.observable(0);
            self.categoryId.subscribe(function () {
                self.hover(new self.model());
                self.refresh();
            });

            self.tabsAddNewCat = function () { self.tabsAddNewMode(true); };
            self.tabsCancelNewCat = function () { self.tabsAddNewMode(false); };

            self.tabsAddNewMode.subscribe(function (newValue) {
                if (newValue == true) { self.tabsNewCategoryName(''); }
            });

            self.tabsSaveCategory = function () {
                var catData = ko.toJS(ko.utils.unwrapObservable(new self.categoryModel()));
                catData.Name = self.tabsNewCategoryName();

                $.post(self.cat_api + self.cat_options.add, catData, function (data) {
                    self.Categories.push(data);
                    self.tabsCancelNewCat();
                });
            };

        // Companies autocomplete
        // ======================

            // Update company after it is selected from the autocomplete list
            self.UpdateCompany = function (element, selectedItem, viewModel) {
                if (selectedItem != null)
                    $(element).val(selectedItem.FirstName);
                viewModel.CompanyId(selectedItem ? selectedItem.Id : null);
                viewModel.Company = null;
            };

            // render the company item for each company in the autocomplete list
            self.renderCompany = function (ul, item) {
                var picture = (item.ProfilePicture ? item.ProfilePicture : '/images/companyLogo.png');
                var name = item.FirstName + (item.LastName != null ? ' ' + item.LastName : '');
                var email = item.Email ? '<a href="mailto:' + item.Email + '">' + item.Email + '</a>' : '';
                return $("<li class='ac-big' />")
                    .data('item.autocomplete', item)
                    .append("<a><div class='float-left'><img src='" + picture + "' /></div><div>" + name + "</div></a>")
                    .appendTo(ul);
            },

            // A helper to save the selected compamy name from the autocomplete
            self.EditCompanyName = ko.observable('');
            self.NewCompany = ko.observable(false);

            // Open the add new company panel
            self.AddNewCompany = function () {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCompanyName = viewModel.EditCompanyName();
                viewModel.NewCompany(true);

                var $form = $('.company .add-form');
                $form.find('#comp-name').val(newCompanyName);
                $form.find('#comp-emal').val('');
                $form.find('#comp-pnum').val('');
            };

            // When clicking save and cancel in the new company panel
            self.saveCompany = function (item) {

                try
                {
                    var viewModel = ko.contextFor(event.srcElement).$parent;
                    var newCompanyName = viewModel.EditCompanyName();

                    // Get form concurrent values
                    var $form = $('.company .add-form');
                    var newCompanyName = $form.find('#comp-name').val();
                    var newCompanyEmail = $form.find('#comp-emal').val();
                    var newCompanyPhone = $form.find('#comp-pnum').val();

                    // Prepare data for sending to server
                    var compData = ko.toJS(ko.utils.unwrapObservable(new self.model()));
                    compData.FirstName = newCompanyName;
                    compData.Email = newCompanyEmail;
                    compData.PhoneNumber = newCompanyPhone;

                    // Get company category id
                    $.ajax({
                        url: viewModel.cat_api + viewModel.cat_options.getAll() + "?$filter=Name%20eq%20'Company'",
                        async: false,
                        success: function (data) { compData.CategoryId = data[0].Id; },
                        error: lz.showError
                    });

                    // Sending data for saving
                    $.post(viewModel.api + viewModel.options.add, compData, function (data) {
                        viewModel.NewCompany(false);
                        viewModel.collection.push(data);
                        viewModel.EditCompanyName(newCompanyName);
                    
                        // Setting new id in company Id field
                        ko.dataFor($('.company hidden[data-bind*=CompanyId]')[0]).CompanyId(data.Id);
                    });
                }
                catch (e) {
                    alert('There was a problem adding the company');
                }
            };
            self.cancelCompany = function () {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCompanyName = viewModel.EditCompanyName();
                viewModel.NewCompany(false);
            };

        // Category autocomplete
        // ======================

            // Update company after it is selected from the autocomplete list
            self.UpdateCategory = function (element, selectedItem, viewModel) {
                if (selectedItem != null)
                    $(element).val(selectedItem.Name);
                viewModel.CategoryId(selectedItem ? selectedItem.Id : null);
                viewModel.Category = null;
            };

            // Checks if the current edited profile is a company according to the selected category
            self.isCompany = function () {
                return self.select().CategoryId == self.CompanyCategoryId || self.select().CategoryId() == self.CompanyCategoryId;
            };
            self.Social = function () {
                return JSON.parse(self.select().SocialData() || "{}") || {};
            };
            self.SetSocial = function () {
                var $el = $(this);
                var currQtip = $el.closest('.qtip');
                var target = currQtip.data('qtip').options.position.target[0];
                var data = ko.dataFor(target);
                var social = $(target).attr('social');
                var socialData = JSON.parse(data.SocialData() || "{}") || {};
                currQtip.find("#social-url").val(socialData[social]);
            };
            self.UpdateSocial = function () {
                var $el = $(event.srcElement);
                var currQtip = $el.closest('.qtip');
                var target = currQtip.data('qtip').options.position.target[0];
                var data = ko.dataFor(target);
                var social = $(target).attr('social');
                var socialData = JSON.parse(data.SocialData() || "{}") || {};
                var newValue = currQtip.find("#social-url").val();
                if (newValue.indexOf("http") != 0) newValue = "http://" + newValue;
                socialData[social] = newValue;
                data.SocialData(JSON.stringify(socialData));

                currQtip.qtip('hide');
            };
            self.CancelForm = function () {
                $(event.srcElement).closest('.qtip').qtip('hide');
            };
            self.HSocial = function () {
                return JSON.parse(self.hover().SocialData || "{}") || {};
            };

            // render the company item for each company in the autocomplete list
            self.renderCategory = function (ul, item) {
                var name = item.Name;
                return $("<li />")
                    .data('item.autocomplete', item)
                    .append("<a><div>" + name + "</div></a>")
                    .appendTo(ul);
            },

            // A helper to save the selected compamy name from the autocomplete
            self.EditCategoryName = ko.observable('');
            self.NewCategory = ko.observable(false);

            self.AddNewCategory = function () {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCategoryName = viewModel.EditCategoryName();
                viewModel.NewCategory(true);

                var $form = $('.category .add-form');
                $form.find('#cat-name').val(newCategoryName);
                $form.find('#cat-emal').val('');
                $form.find('#cat-pnum').val('');
            };
            self.saveCategory = function (item) {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCategoryName = viewModel.EditCategoryName();

                // Prepare data for sending to server
                var catData = ko.toJS(ko.utils.unwrapObservable(new self.categoryModel()));
                catData.Name = newCategoryName;

                // Sending data for saving
                $.post(viewModel.cat_api + viewModel.cat_options.add, catData, function (data) {
                    viewModel.NewCategory(false);
                    //viewModel.collection.push(data);
                    viewModel.EditCategoryName(newCategoryName);

                    // Setting new id in company Id field
                    ko.dataFor($('.category hidden[data-bind*=CategoryId]')[0]).CategoryId(data.Id);

                    viewModel.Categories().push(data);
                });
            };
            self.deleteCategory = function (item) {

                $("<div title=\"Delete Confirmation\">" + self.msg.cat_removeConfirm(item) + "</div>").dialog({
                    resizable: false,
                    modal: true,
                    buttons: {
                        "Delete": function () {

                            var itemToRemove = ko.utils.unwrapObservable(ko.toJS(item));
                            var $this = $(this);
                            $.ajax({
                                url: self.cat_api + self.cat_options.remove + "?id=" + itemToRemove.Id,
                                type: "DELETE",
                                success: function (data) {

                                    for (var i = 0, j = self.Categories().length; i < j; i++)
                                        if (self.Categories()[i].Id == itemToRemove.Id) {
                                            self.Categories.remove(self.Categories()[i]);
                                            break;
                                        }

                                    if (self.categoryId() == itemToRemove.Id) {
                                        self.categoryId(0);
                                        self.categoryId.valueHasMutated();
                                    }

                                    $this.dialog("close");
                                    self.refresh();
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
            };
            self.cancelCategory = function () {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCategoryName = viewModel.EditCategoryName();
                viewModel.NewCategory(false);
            };

        // Countries Methods
        // =================

            self.selectedCountry = ko.observable('');
            self.selectedCountryName = ko.observable('');

            // Update company after it is selected from the autocomplete list
            self.UpdateCountry = function (element, selectedItem, viewModel) {
                if (selectedItem != null) {
                    $(element).val(selectedItem.n).data('item', selectedItem);
                    self.selectedCountry(selectedItem.i2);
                    self.selectedCountryName(selectedItem.n);
                    viewModel.State('');
                    viewModel.City('');
                    viewModel.Country(selectedItem.n);
                }
            };

            // render the company item for each company in the autocomplete list
            self.renderCountry = function (ul, item) {
                var name = item.n;
                return $("<li />")
                    .data('item.autocomplete', item)
                    .append("<a><div>" + name + "</div></a>")
                    .appendTo(ul);
            };

            self.filterCountry = function (item, search) {
                return item.n.toLowerCase().indexOf(search.toLowerCase()) === 0;
            };

        // City Methods
        // ============

            // Update company after it is selected from the autocomplete list
            self.UpdateCity = function (element, selectedItem, viewModel) {
                if (selectedItem != null) {
                    $(element).val(selectedItem.value).data('item', selectedItem);
                    viewModel.City(selectedItem.value);
                }
            };

            // render the company item for each company in the autocomplete list
            self.renderCity = function (ul, item) {
                var name = item.n;
                return $("<li />")
                    .data('item.autocomplete', item)
                    .append("<a><div>" + name + "</div></a>")
                    .appendTo(ul);
            };

        // State Methods
        // =============

            // Update company after it is selected from the autocomplete list
            self.UpdateState = function (element, selectedItem, viewModel) {
                if (selectedItem != null) {
                    $(element).val(selectedItem.value).data('item', selectedItem);
                    viewModel.State(selectedItem.value);
                }
            };

            self.filterState = function (item, search) {
                return item.toLowerCase().indexOf(search.toLowerCase()) === 0;
            };

            // render the company item for each company in the autocomplete list
            self.renderState = function (ul, item) {
                var name = item.label;
                return $("<li />")
                    .data('item.autocomplete', item)
                    .append("<a><div>" + name + "</div></a>")
                    .appendTo(ul);
            };

        // Helper Methods
        // ==============

            // Handle data before save (after the data was turned into JSON)
            self.prepareDataForSave = function (data) {
                data.Birthday = moment(data.Birthday).format();

                // Handle company contact type
                if (data.CategoryId == self.CompanyCategoryId) {
                    data.LastName = null;
                    data.DrivingLisence = null;
                    data.SocialSecurity = null;
                    data.Single = null;
                }
            };

            // Search for company images automatically when entering a company name
            self.updateImages = function (ctrl) {
                $('#searchcontrol').hide();
                return;
                var companyName = null;
                if (typeof (ctrl) == 'function')
                    companyName = ctrl();
                window.setTimeout(function () {
                    // Create a search control
                    var searchControl = new google.search.SearchControl();

                    // Add in a full set of searchers
                    searchControl.addSearcher(new google.search.ImageSearch());

                    // tell the searcher to draw itself and tell it where to attach
                    searchControl.draw(document.getElementById("searchcontrol"));

                    // execute an inital search
                    searchControl.execute(companyName != null ? companyName + " logo" : "");
                }, 10);
            };

            // Opens a dialog to enter a url for a contact picture
            self.changePicture = function () {

                var $el = $(this);
                var currQtip = $el.closest('.qtip');
                var target = currQtip.data('qtip').options.position.target[0];
                var data = ko.dataFor(target);
                var profilePicture = data.ProfilePicture();
                currQtip.find("#PictureUrl").val(profilePicture);
            };
            self.setPicture = function () {
                var $el = $(event.srcElement);
                var currQtip = $el.closest('.qtip');
                var target = currQtip.data('qtip').options.position.target[0];
                var data = ko.dataFor(target);
                var newProfilePicture = currQtip.find('#PictureUrl').val();
                data.ProfilePicture(newProfilePicture);

                currQtip.qtip('hide');
            };
    },

    // Bind actions after the view model base was initialized
    view: function (self) {

        // Saving old value to moniture consequent clicks on a tab
        var oldShowEditor = false;

        // Perform following actions each time the edit mode changes (revealing and removing items from the view)
        self.showEditor.subscribe(function (newValue) {

            // Update images (on every change??)
            self.updateImages();

            // Update company and category names to match the ones from the selected contact
            if (self.selected().Company != null)
                self.EditCompanyName(self.selected().Company.FirstName);
            else
                self.EditCompanyName('');

            if (self.selected().Category != null)
                self.EditCategoryName(self.selected().Category.Name);
            else
                self.EditCategoryName('');

            // Empty the selected hover element
            self.hover(new self.model());

            // Clicking twice on "Contacts" will force the category back to "All"
            if (!oldShowEditor && !newValue && self.categoryId() != 0)
                self.categoryId(0);

            // When adding new contact under category, set the default category to selected one
            if (newValue && self.categoryId() != 0 && self.isNew()) {
                for (var i = 0, j = self.Categories().length; i < j; i++)
                    if (self.Categories()[i].Id == self.categoryId()) {
                        self.select().CategoryId(self.categoryId());
                        self.EditCategoryName(self.Categories()[i].Name);
                    }
            }

            // Saving current showEditor value
            oldShowEditor = newValue;
        });

        // When the collection chagnes, remove the last previed contact
        self.collection.subscribe(function () {
            self.hover(new self.model());
        });
        //self.model.Company.subscribe(updateImages);
    }
});

$(function () {

    // When clicking on social links, enable changing the links (in edit mode)
    $(".vm-contacts").on("click_on", ".head .social .soc-link", function () {
        var data = ko.dataFor(this);
        var socialData = JSON.parse(data.SocialData()) || {};
        var $el = $(this);
        var social = $el.attr('social');

        $("#social-dialog #social-url").val(socialData[social]);
        var spcialDialogOpts = {
            modal: true,
            buttons: {
                "Ok": function(){
                    socialData[social] = $("#social-dialog #social-url").val();
                    data.SocialData(JSON.stringify(socialData));

                    $("#social-dialog").dialog("close");
                },
                "Cancel": function () { $("#social-dialog").dialog("close"); }
            },
            autoOpen: true
        };

        $('#social-dialog').dialog(spcialDialogOpts);
    });
});
// TODO: google images web service should be loaded dynamically into the page
//google.load('search', '1');
