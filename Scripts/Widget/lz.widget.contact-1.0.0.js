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
            this.Category = ko.observable('');
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
        }
    },
    view: function (self) {

        self.showEditor.subscribe(self.updateImages);
        self.showEditor.subscribe(function () {
            if (self.selected().Company != null)
                self.EditCompanyName(self.selected().Company.FirstName);
            else
                self.EditCompanyName('');
        });
        //self.model.Company.subscribe(updateImages);
    },
    extend: function (self) {

        // Handle Properties
        // =================

            self.Categories = ko.observableArray(['Company', 'Artist', 'Venue', 'Service Provider', 'Other']).sort();

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
                return $("<li style='display:inline-block'>")
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
                compData.Category = 'Company';

                // Sending data for saving
                $.post(viewModel.api + viewModel.options.add, compData, function (data) {
                    viewModel.NewCompany(false);
                    viewModel.collection.push(data);
                    viewModel.EditCompanyName(newCompanyName);
                    
                    // Setting new id in company Id field
                    ko.dataFor($('.company hidden[data-bind*=CompanyId]')[0]).CompanyId(data.Id);
                });
            };
            self.cancelCompany = function () {
                var viewModel = ko.contextFor(event.srcElement).$parent;
                var newCompanyName = viewModel.EditCompanyName();
                viewModel.NewCompany(false);
            };

        // Countries Methods
        // =================
        // http://ws.geonames.org/search?q=&country=IL

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
