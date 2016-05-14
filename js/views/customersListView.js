var Backbone = require('backbone');
var remote = require('electron').remote;
var fs = remote.require('fs');
var $ = require('jquery');
var _ = require('underscore');
var customersListTemplate = fs.readFileSync('./templates/customersList.html', encoding = "utf8");
var CustomerFormView = require('./customerFormView');

var CustomersListView = Backbone.View.extend({
    el: '#customer-list ul',
    template: _.template(customersListTemplate),
    initialize: function (options) {
        var self = this;
        var App;

        window.App = window.App || {};
        App = window.App;

        self.db = options.db;
        self.eventChannel = options.eventChannel;
        self.search = _.debounce(self.search, 1000);

        self.refreshList();

        self.eventChannel.on('customerCreated', self.refreshList, self);

    },

    events: {
        'keyup #search': 'search',
        'click .list-group-item': 'openCustomer'
    },

    refreshList: function(model) {
        var self = this;

        self.db.collection('customers').find({}, {
            photo: 1,
            firstName: 1,
            lastName: 1,
            phoneNumber: 1
        })
        .toArray(function (err, res) {
            if (err) {
                return console.log(err);
            }
            self.models = res;
            self.render();

            if (model) {
                self.openCustomer(null, model._id.toString());
            } else {
                self.openCustomer(null, res[0]._id.toString());
            }
        });
    },

    search: function (e) {
        var filter = {};
        var self = this;
        var searchValue = $.trim(e.target.value);

        if (searchValue !== '') {
            filter["$or"] = [
                {
                    firstName: {
                        $regex: searchValue,
                        $options: 'i'
                    }
            },
                {
                    lastName: {
                        $regex: searchValue,
                        $options: 'i'
                    }
            }
        ];
        } else {
            filter = {};
        }

        self.db.collection('customers').find(filter, {
                photo: 1,
                firstName: 1,
                lastName: 1,
                phoneNumber: 1
            })
            .toArray(function (err, res) {
                if (err) {
                    return console.log(err);
                }
                self.models = res;
                self.render(res);
            });
    },

    openCustomer: function (e, id) {
        var self = this;
        var options = {};
        var customerId = id || $(e.target).closest('li').attr('data-id');
        e && e.preventDefault();

        options.new = false;
        options.db = self.db;
        options.customerId = customerId;
        options.eventChannel = self.eventChannel;

        App.contentView && App.contentView.undelegateEvents();
        App.contentView = new CustomerFormView(options);
    },

    render: function () {
        var self = this;

        self.$el.find('li.list-group-item').remove();

        self.$el.append(self.template({
            models: self.models
        }));
    }
});

module.exports = CustomersListView;
