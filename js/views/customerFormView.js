var Backbone = require('backbone');
var dialog = require('electron').remote.dialog;
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra')
var path = require('path')
var $ = require('jquery');
var _ = require('underscore');
var customerFormTemplate = fs.readFileSync(path.join(__dirname, '/../../templates/customerForm.html'), encoding = "utf8");

var CustomerFormView = Backbone.View.extend({
    el: '#content-holder',
    template: _.template(customerFormTemplate),
    initialize: function (options) {
        var self = this;
        var App;
        window.App = window.App || {};

        App = window.App;

        self.options = options;
        self.db = options.db;
        self.new = options.new;
        self.eventChannel = options.eventChannel;

        self.render = _.after(3, self.render);

        if (!self.new) {
            self.customerId = options.customerId;

            self.db.collection('customers').find({_id: self.customerId}).toArray(function (err, model) {
                self.db.collection('plans').find({customerId: self.customerId}).toArray(function(err, result) {
                        self.plans = result;
                        self.model = model[0];

                        self.db.collection('visits').find({customerId: self.customerId}).sort({
                                visitDate: -1,
                                visitTime: -1
                            }).toArray(function(err, result) {
                            self.visits = result;
                            self.render();
                        });
                    });
                });
        } else {
            self.render();
        }

        self.db.collection('services').find({})
                .toArray(function(err, result) {
            self.services = result;
            self.render();
        });

        self.db.collection('materials').find({})
                .toArray(function(err, result) {
            self.materials = result;
            self.render();
        });

    },

    events: {
        'click #save': 'saveCustomer',
        'click #cancel': 'cancel',
        'click #remove': 'remove',
        'click .tab-item': 'switchTab',
        'click #photo': 'choosePhoto',
        'click .plan-remove': 'removePlan',
        'click .visit-remove': 'removeVisit',
        'click button.btn-positive': 'addPlan',
        'change select' : 'calculatePrice',
        'click .add-history': 'addVisit',
        'click #save-visit': 'saveVisit',
        'click #cancel-visit': 'cancelVisit',
        'click .treatment-move': 'treatmentMove'
    },

    treatmentMove: function(e) {
        var self = this;
        var $target = $(e.target).closest('tr');
        var $parentTable = $target.closest('table')
        var oppTable = $parentTable.siblings('table');
        var parentTable = $parentTable.attr('data-type');
        var $total = $('#visit-total input');
        var total = parseInt($total.val());
        var price = parseInt($target.find('td.plan-price').html());

        e.preventDefault();

        $target.detach();
        oppTable.append($target);

        $total.val(total + (parentTable === 'plans' ? price : -price));
    },

    removeVisit: function(e) {
        var self = this;
        var visitId = $(e.target).attr('data-id');

        self.db.collection('visits').find({_id: visitId}).toArray(function(err, result) {

            self.db.collection('plans').insert(result[0].done, function() {

                self.db.collection('visits').remove({_id: visitId}, function() {

                    self.initialize(self.options);

                });

            });

            self.db.collection('plans').remove({_id: {$in: plansToSave}});
        });

        e.preventDefault();
    },

    addVisit: function(e) {
        var self = this;
        var newHistoryElement = $('.new-history-element');

        newHistoryElement.show();

        e.preventDefault();
    },

    saveVisit: function(e) {
        var self = this;
        var $parent = $('.new-history-element div');
        var $tr;
        var treatmentId;
        var plansToSave = $.map($('table[data-type="done"] tr'), function (tr) {
            $tr = $(tr);
            treatmentId = $tr.attr('data-id');
            return treatmentId;
        });
        var newVisit = {
            visitDate: $('#visit-date').val(),
            visitTime: $('#visit-time').val(),
            total: parseInt($('#visit-total input').val()) || 0,
            comment: $('#visit-comments').val(),
            customerId: self.customerId
        };

        self.db.collection('plans').find({_id: {$in: plansToSave}}).toArray(function(err, result) {
            newVisit.done = result;

            self.db.collection('visits').insert(newVisit, function() {
                self.initialize(self.options);
            });

            self.db.collection('plans').remove({_id: {$in: plansToSave}});
        });

        e.preventDefault();
    },

    cancelVisit: function(e) {
        var self = this;
        var newHistoryElement = $('.new-history-element');

        e.preventDefault();

        self.initialize(self.options);
    },

    removePlan: function (e) {
        var self = this;
        var collection = $(e.target).closest('table').attr('data-type');
        var id = $(e.target).closest('tr').attr('data-id');

        e.preventDefault();

        self.db.collection(collection).remove({_id: id}, function(err, result) {
            $(e.target).closest('tr').remove();
        });

        self.initialize(self.options);
    },

    calculatePrice: function (e) {
        var self = this;
        var $select = $('select').find(":selected");
        var $parent = $(e.target).closest('tr');
        var $price = $parent.find('input.price');
        var price = 0;

        $select.each(function() {
            price += parseInt($(this).val());
        });

        $price.val(price);
    },

    addPlan: function (e) {
        var self = this;
        var collection = $(e.target).attr('data-type');
        var $tbody = $(e.target).closest('table').find('tbody');
        var $parent = $(e.target).closest('tr');
        var service = $parent.find('#service').find(":selected").text();
        var material = $parent.find('#material').find(":selected").text();
        var comment = $parent.find('input.comment').val();
        var price = $parent.find('input.price').val() || 0;
        var data = {
            service: service,
            material: material,
            comment: comment,
            price: price,
            customerId: self.customerId
        }

        e.preventDefault();

        self.db.collection(collection).insert(data, function(err, result) {
            $tbody.append(`<tr>
            <td>${service}</td>
            <td>${material}</td>
            <td>${comment}</td>
            <td>${price}</td>
            <td><span class="icon icon-cancel"></span></td>
            </tr>`);
        });

        self.initialize(self.options);
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
        data.phoneNumber = $.trim($el.find('#phone-number').val());
        data.nextVisit = $.trim($el.find('#next-visit-date').val());
        data.nextVisitTime = $.trim($el.find('#next-visit-time').val());
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
        var $target = $(e.target || e);
        var tabName = $target.attr('data-id');
        e.preventDefault && e.preventDefault();

        self.$currentTab = $target;

        $('.tab-item').removeClass('active');
        $target.addClass('active');

        $('.tab-content').hide();
        $('.tab-content[data-id="' + tabName + '"]').show();
    },

    restoreTab: function() {
        var self = this;
        var $target = self.$currentTab

        $target.click();
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
            var destPath = path.join('./data/photos/', (Date.now() + path.basename(files[0])));
            fse.copy(files[0], destPath, function (err) {
                $(e.target).attr("src", destPath);
            });
        });
    },

    render: function () {
        var self = this;
        var model = self.model;

        model = model || {};

        model.firstName = model.firstName || '';
        model.lastName = model.lastName || '';
        model.middleName = model.middleName || '';
        model.dateOfBirth = model.dateOfBirth || '';
        model.phoneNumber = model.phoneNumber || '';
        model.nextVisit = model.nextVisit || '';
        model.nextVisitTime = model.nextVisitTime || '';
        model.address = model.address || '';
        model.comments = model.comments || '';
        model.gender = model.gender || '';
        model.photo = model.photo || './data/photos/Icon-user.png';

        model.plans = self.plans || [];
        model.visits = self.visits || [];
        model.materials = self.materials || [];
        model.services = self.services || [];

        model.newCustomer = self.new;

        self.$el.html(self.template(model));

        self.switchTab(self.$currentTab || $('div.tab-item').first());
    }
});

module.exports = CustomerFormView;
