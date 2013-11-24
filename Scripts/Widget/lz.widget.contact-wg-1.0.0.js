﻿var vm = namespace("lz.viewModel");

vm.contactsWG = new vm.baseViewModel({
    api: function (self) {
        self.api = "/api/contacts/";
        self.options = {
            getAll: function () { return "GetContacts?$top=3" + (self.categoryId() == 0 ? '' : '&$filter=CategoryId eq ' + self.categoryId()); },
            add: "PostContact",
            update: "PutContact",
            remove: "DeleteContact",
            removeConfirm: "Are you sure you want to delete this contact?",

            updateRating: 'UpdateRating'
        };

        self.cat_api = "/api/contactscategories/";
        self.cat_options = {
            getAll: function () { return "Get"; },
            add: "Post",
            update: "Put",
            remove: "Delete",
            removeConfirm: "Are you sure you want to delete this category?"
        };

    },
    model: function (self) {
        self.model = function () {
            this.Id = ko.observable(0);
            this.UserId = ko.observable(0);
            this.FirstName = ko.observable('');
            this.LastName = ko.observable('');
            this.ProfilePicture = ko.observable('');

            this.CompanyId = ko.observable();
            this.Company = ko.observable({
                Id: ko.observable(),
                FirstName: ko.observable('')
            });
            this.Country = ko.observable();
            this.State = ko.observable('');
            this.City = ko.observable('');
            this.Street = ko.observable('');
            this.Notes = ko.observable(''); 
            this.CategoryId = ko.observable();
            this.Category = ko.observable({
                Id: ko.observable(),
                Name: ko.observable('')
            });

            this.Email = ko.observable('');
            this.PhoneNumber = ko.observable('');
            this.MobileNumber = ko.observable('');
            this.FaxNumber = ko.observable('');
            this.Birthday = ko.observable('');
            this.Single = ko.observable('');
            this.SocialSecurity = ko.observable('');
            this.DrivingLisence = ko.observable('');
            this.Rating = ko.observable(0);
            this.LastUpdate = ko.observable('').extend({ date: true });

            this.isCompany = ko.computed(function () {
                return this.Category == "Company";
            }, this);

            this.FB = ko.computed(function () {
                return true;
            }, this);
        }

        self.categoryModel = function () {
            this.Id = ko.observable(0);
            this.Name = ko.observable('');
        };
    },
    view: function (self) {

        self.showEditor.subscribe(self.updateImages);
        self.showEditor.subscribe(function () {
            if (self.selected().Company != null)
                self.EditCompanyName(self.selected().Company.FirstName);
            else
                self.EditCompanyName('');

            if (self.selected().Category != null)
                self.EditCategoryName(self.selected().Category.Name);
            else
                self.EditCategoryName('');
        });
        //self.model.Company.subscribe(updateImages);

        var oldShowEditor = false;
        self.showEditor.subscribe(function (newValue) {
            if (!oldShowEditor && self.categoryId() != 0)
                self.categoryId(0);

            oldShowEditor = newValue;
        });
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

            self.tabsChangeAddMode = function (addMode) {
                self.tabsAddNewMode(addMode);
                self.tabsNewCategoryName('');
            };

            self.tabsSaveCategory = function () {
                var catData = ko.toJS(ko.utils.unwrapObservable(new self.categoryModel()));
                catData.Name = self.tabsNewCategoryName();

                $.post(self.cat_api + self.cat_options.add, catData, function (data) {
                    self.Categories.push(data);
                    self.tabsChangeAddMode(false);
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

            self.AddNewCompany = function () {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCompanyName = viewModel.EditCompanyName();
                viewModel.NewCompany(true);

                var $form = $('.company .add-form');
                $form.find('#comp-name').val(newCompanyName);
                $form.find('#comp-emal').val('');
                $form.find('#comp-pnum').val('');
            };
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
                });
            };
            self.deleteCategory = function (item) {

                if (confirm(self.cat_options.removeConfirm)) {
                    var isSelected = $(event.srcElement).closest('li').hasClass('selected');
                    var itemToRemove = ko.utils.unwrapObservable(ko.toJS(item));
                    $.ajax({
                        url: self.cat_api + self.cat_options.remove + "?id=" + itemToRemove.Id,
                        type: "DELETE",
                        success: function (data) {

                            for (var i = 0, j = self.Categories().length; i < j; i++)
                                if (self.Categories()[i].Id == itemToRemove.Id)
                                    self.Categories.remove(self.Categories()[i]);

                            if (isSelected) {
                                self.categoryId(0);
                                self.categoryId.valueHasMutated();
                            }
                        },
                        error: lz.showError
                    });
                }
            };
            self.cancelCategory = function () {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCategoryName = viewModel.EditCategoryName();
                viewModel.NewCategory(false);
            };

        // Countries Methods
        // =================

            self.selectedCountry = ko.observable('');

            // Update company after it is selected from the autocomplete list
            self.UpdateCountry = function (element, selectedItem, viewModel) {
                if (selectedItem != null) {
                    $(element).val(selectedItem.n).data('item', selectedItem);
                    self.selectedCountry(selectedItem.i2);
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

            self.selectedState = ko.observable('');

            // Update company after it is selected from the autocomplete list
            self.UpdateState = function (element, selectedItem, viewModel) {
                if (selectedItem != null) {
                    $(element).val(selectedItem.name).data('item', selectedItem);
                    viewModel.State(selectedItem.name);
                    self.selectedState(selectedItem.abb);
                }
            };

            self.filterState = function (item, search) {
                return item.name.toLowerCase().indexOf(search.toLowerCase()) === 0;
            };

            // render the company item for each company in the autocomplete list
            self.renderState = function (ul, item) {
                var name = item.name;
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
            var srcElement = event.srcElement;
            $("#dialog-picture").find('#PictureUrl').val(ko.dataFor(srcElement).ProfilePicture());
            $("#dialog-picture").dialog({
                autoOpen: true,
                height: 'auto',
                width: 'auto',
                modal: true,
                buttons: {
                    "Set Picture": function () {
                        var newProfilePicture = $(this).find('#PictureUrl').val();
                        ko.dataFor(srcElement).ProfilePicture(newProfilePicture);
                        $(this).dialog("close");
                    },
                    Cancel: function () { $(this).dialog("close"); }
                },
                close: function () { }
            });
        };
    }
});

// TODO: google images web service should be loaded dynamically into the page
//google.load('search', '1');
