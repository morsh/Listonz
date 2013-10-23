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
    view: function (self) { }
});

$(function () {
    ko.applyBindings(lz.viewModel);
});