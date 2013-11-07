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
        self.UpdateCompany = function (element, selectedItem, viewModel) {
            if (selectedItem != null)
                $(element).val(selectedItem.FirstName);
            viewModel.CompanyId(selectedItem ? selectedItem.Id : null);
            viewModel.Company = null;
        };
        self.renderCompany = function (ul, item) {
            var picture = (item.ProfilePicture ? item.ProfilePicture : '/images/companyLogo.png');
            var name = item.FirstName + (item.LastName != null ? ' ' + item.LastName : '');
            var email = item.Email ? '<br/><a href="mailto:' + item.Email + '">' + item.Email + '</a>' : '';
            return $("<li style='display:inline-block'>")
                .data('item.autocomplete', item)
                .append("<a><div class='float-left'><img src='" + picture + "' /></div><div>" + name + email + "</div></a>")
                .appendTo(ul);
        },
        self.prepareDataForSave = function (data) {
            data.Birthday = moment(data.Birthday).format();
        };
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
        self.EditCompanyName = ko.observable('');
    }
});

//google.load('search', '1');

$(function () {
    ko.applyBindings(lz.viewModel);
});


/*
self.model = function (data) {
    this.Id = ko.observable(data ? data.Id : 0);
    this.FirstName = ko.observable(data ? data.FirstName : '');
    this.LastName = ko.observable(data ? data.LastName : '');

    this.CompanyId = ko.observable();
    this.Company = ko.observable(new function () {
        this.Id = ko.observable(data && data.Company ? data.Company.Id : 0);
        this.FirstName = ko.observable(data && data.Company ? data.Company.FirstName : '');
    }());
    this.Country = ko.observable(data ? data.Country : null);
    this.State = ko.observable(data ? data.State : '');
    this.City = ko.observable(data ? data.City : '');
    this.Street = ko.observable(data ? data.Street : '');
    this.Notes = ko.observable(data ? data.Notes : '');
    this.Category = ko.observable(data ? data.Category : '');
    this.Email = ko.observable(data ? data.Email : '');
    this.PhoneNumber = ko.observable(data ? data.PhoneNumber : '');
    this.MobileNumber = ko.observable(data ? data.MobileNumber : '');
    this.FaxNumber = ko.observable(data ? data.FaxNumber : '');
    this.Birthday = ko.observable(data ? data.Birthday : '');
    this.Single = ko.observable(data ? data.Single : '');
    this.SocialSecurity = ko.observable(data ? data.SocialSecurity : '');
    this.DrivingLisence = ko.observable(data ? data.DrivingLisence : '');
    this.Rating = ko.observable(data ? data.Rating : 0);
    this.LastUpdate = ko.observable(data ? data.LastUpdate : '');

    this.UpdateCompany = function (element, selectedItem, viewModel) {
        $(element).val(selectedItem.Company);
        viewModel.FirstName(selectedItem.FirstName);

    };
}*/