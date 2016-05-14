var Backbone = require('backbone');
var dialog = require('electron').remote.dialog;
var fs = require('fs');
var fse = require('fs-extra')
var path = require('path')
var $ = require('jquery');
var _ = require('underscore');
var customerFormTemplate = fs.readFileSync('templates/customerForm.html', encoding = "utf8");

var CustomerFormView = Backbone.View.extend({
    el: '#content-holder',
    template: _.template(customerFormTemplate),
    initialize: function (options) {
        var self = this;
        var App;
        window.App = window.App || {};

        App = window.App;

        self.db = options.db;
        self.new = options.new;
        self.eventChannel = options.eventChannel;

        if (!self.new) {
            self.customerId = options.customerId;

            self.db.collection('customers').find({
                    _id: self.customerId
                })
                .toArray(function (err, model) {

                    if (!err) {
                        self.render(model[0]);
                    }
                });
        } else {
            self.render();
        }

    },

    events: {
        'click #save': 'saveCustomer',
        'click #cancel': 'cancel',
        'click #remove': 'remove',
        'click .tab-item': 'switchTab',
        'click #photo': 'choosePhoto'
    },

    saveCustomer: function (e) {
        var self = this;
        var data = {};
        var $el = self.$el;
        e.preventDefault();

        data.firstName = $.trim($el.find('#first-name').val());
        data.lastName = $.trim($el.find('#last-name').val());
        data.middleName = $.trim($el.find('#middle-name').val());
        data.dateOfBirth = $.trim($el.find('#date-of-birth').val());
        data.phoneNumber = $.trim($el.find('#phone-number').val());
        data.address = $.trim($el.find('#address').val());
        data.comments = $.trim($el.find('#comments').val());
        data.gender = $.trim($el.find('input[name=gender]:checked').val());
        data.photo = $.trim($el.find('#photo').attr('src'));

        if (self.new) {
            self.db.collection('customers').insert(data, function (err, res) {
                self.eventChannel.trigger('customerCreated', res[0]);
            });
        } else {
            self.db.collection('customers').update({_id: self.customerId}, data, function (err, res) {
                self.eventChannel.trigger('customerCreated', res[0]);
            });
        }

    },

    remove: function (e) {
        var self = this;
        e.preventDefault();

        self.db.collection('customers').remove({_id: self.customerId}, function (err, res) {
            self.eventChannel.trigger('customerCreated');
        });
    },

    cancel: function (e) {
        var self = this;
        e.preventDefault();

        self.remove();
    },

    switchTab: function (e) {
        var self = this;
        var $target = $(e.target);
        var tabName = $target.attr('data-id');
        e.preventDefault();

        $('.tab-item').removeClass('active');
        $target.addClass('active');

        $('.tab-content').hide();
        $('.tab-content[data-id="' + tabName + '"]').show();
    },

    choosePhoto: function (e) {
        var filters = [
            {
                name: 'Images',
                extensions: ['jpg', 'png', 'gif']
            },
        ];

        dialog.showOpenDialog({
            title: 'Choose Photo',
            filters: filters
        }, function (files) {
            var destPath = path.join('./data/photos/', path.basename(files[0]));
            fse.copy(files[0], destPath, function (err) {
                $(e.target).attr("src", destPath);
            });
        });
    },

    render: function (model) {
        var self = this;

        if (!model) {
            model = {
                firstName: '',
                lastName: '',
                middleName: '',
                dateOfBirth: '',
                phoneNumber: '',
                address: '',
                comments: '',
                gender: '',
                photo: './data/photos/Icon-user.png'
            };
        }

        model.newCustomer = self.new;

        self.$el.html(self.template(model));
    }
});

module.exports = CustomerFormView;
