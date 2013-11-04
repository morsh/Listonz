﻿var vm = namespace("lz.viewModel");

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
            this.SocialDecurity = ko.observable('');
            this.DrivingLisence = ko.observable('');
            this.LastUpdate = ko.observable('');
        }
    },
    view: function (self) { }
});

$(function () {
    ko.applyBindings(lz.viewModel);
});