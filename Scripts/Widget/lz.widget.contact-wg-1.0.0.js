var vm = namespace("lz.viewModel");

vm.contactsWG = new vm.baseViewModel({
    api: function (self) {
        self.widget.isWidget = true;
        self.api = "/api/contacts/";
        self.options = {
            getAll: function () { return "GetContacts?$top=" + self.widget.selectTop + '&$orderby=LastUpdate%20desc'; },
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

            this.SocialData = ko.observable('');
        }
    },
    view: function (self) {

        //self.showEditor.subscribe(self.updateImages);
        //self.model.Company.subscribe(updateImages);

        self.sort("LastUpdate");
        self.sortDir("desc");
    },
    extend: function (self) {

        // Handle Properties
        // =================
            self.hover = ko.observable(new self.model());
            var stopEvents = false;
            
            self.updateHover = function (data) {
                stopEvents = true;
                self.hover(data);
                stopEvents = false;
            };
            self.HSocial = function () {
                return JSON.parse(self.hover().SocialData || "{}") || {};
            };
            self.CancelForm = function () {
                $(event.srcElement).closest('.qtip').qtip('hide');
            };
            self.newContact = function () {

                $('.qtip').each(function () { $(this).qtip('hide'); });

                var $qtip = $(this);
                var hoverData = ko.dataFor($qtip.data('qtip').target[0]);
                self.hover(hoverData);

                $qtip.find('.aaa').text(this.id);

            };

            self.addContact = function (ctrl) {
                
                // Check for validation rules
                var validationResult = self.validationContext.Validate();
                if (!validationResult.valid) {
                    // Oh boy, you're in troubleeeeee!
                    self.validationErrors(validationResult.messages);
                    return;
                }

                self.CancelForm();

                var $dlg = $(ctrl).closest('.dialog');
                var firstName = $dlg.find('#cnt-wg-new-fn').val();
                var lastName = $dlg.find('#cnt-wg-new-ln').val();
                var email = $dlg.find('#cnt-wg-new-email').val();
                self.isNew(true);
                var newContact = ko.toJS(ko.utils.unwrapObservable(new self.model()));
                newContact.FirstName = firstName;
                newContact.LastName = lastName;
                newContact.Email = email;

                self.save(newContact);
            };
            
            self.EditContact = function (item) {
                //lz.closeDlg(ctrl);
                window.location = '#/Contacts/' + item.Id;
            };
            self.DeleteContact = function (item) {
                //lz.closeDlg(ctrl);
                self.remove(item);
                event.cancelBubble = true;
            };
    }
});

