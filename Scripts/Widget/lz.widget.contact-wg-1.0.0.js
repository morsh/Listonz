var vm = namespace("lz.viewModel");

vm.contactsWG = new vm.baseViewModel({
    api: function (self) {
        self.api = "/api/contacts/";
        self.options = {
            getAll: function () { return "GetContacts?$top=5" + '&$orderby=LastUpdate%20desc'; },
            add: "PostContact",
            update: "PutContact",
            remove: "DeleteContact",

            updateRating: 'UpdateRating'
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

        self.rowHoverQtip = function () {
            alert(0);
        };
    },
    extend: function (self) {

        // Handle Properties
        // =================
            self.hover = ko.observable(new self.model());
            var stopEvents = false;
            self.updateHover = function () {

                $('.qtip').each(function () { $(this).qtip('hide'); });

                var $qtip = $(this);
                var hoverData = ko.dataFor($qtip.data('qtip').target[0]);
                self.hover(hoverData);

                $qtip.find('.aaa').text(this.id);

            };
            self.EditContact = function (ctrl) {
                lz.closeDlg(ctrl);
                window.location = '#/Contacts/' + self.hover().Id;
            };
            self.DeleteContact = function (ctrl) {
                lz.closeDlg(ctrl);
                self.remove(self.hover());
            };
    }
});

