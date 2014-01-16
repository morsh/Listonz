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
                var phone = $dlg.find('#cnt-wg-new-phone').val();
                self.isNew(true);
                var newContact = ko.toJS(ko.utils.unwrapObservable(new self.model()));
                newContact.FirstName = firstName;
                newContact.LastName = lastName;
                newContact.Email = email;
                newContact.PhoneNumber = phone;

                self.save(newContact);
            };
            
            self.EditContact = function (item) {
                //lz.closeDlg(ctrl);
                window.location = '#/Contacts/' + item.Id();
            };
            self.DeleteContact = function (item) {
                //lz.closeDlg(ctrl);
                self.remove(item);
                event.cancelBubble = true;
            };
    }
});

