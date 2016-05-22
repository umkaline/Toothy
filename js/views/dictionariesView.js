var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var dictionariesTemplate = fs.readFileSync(path.join(__dirname, '/../../templates/dictionariesForm.html'), encoding = "utf8");

var DictionariesView = Backbone.View.extend({
    el: '#content-holder',
    template: _.template(dictionariesTemplate),
    initialize: function (options) {
        var self = this;
        var App;

        window.App = window.App || {};
        App = window.App;

        self.db = options.db;
        self.eventChannel = options.eventChannel;

        self.render = _.after(2, self.render);

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
        'click .icon-cancel': 'remove',
        'click button.btn-positive': 'add',
        'click .tab-item': 'switchTab'
    },

    saveCustomer: function (e) {
        var self = this;


    },

    remove: function (e) {
        var self = this;
        var collection = $(e.target).closest('table').attr('data-type');
        var id = $(e.target).closest('tr').attr('data-id');

        e.preventDefault();

        self.db.collection(collection).remove({_id: id}, function(err, result) {
            $(e.target).closest('tr').remove();
        });
    },

    add: function (e) {
        var self = this;
        var collection = $(e.target).attr('data-type');
        var $tbody = $(e.target).closest('table').find('tbody');
        var $parent = $(e.target).closest('tr');
        var name = $parent.find('input.name').val();
        var price = $parent.find('input.price').val() || 0;
        var data = {
            name: name,
            price: price
        }

        e.preventDefault();

        if (!name) {
            return alert('Name can\'t be empty');
        }

        self.db.collection(collection).insert(data, function(err, result) {
            $tbody.append(`<tr>
            <td>${name}</td>
            <td>${price}</td>
            <td><span class="icon icon-cancel"></span></td>
            </tr>`);
        });
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

    render: function () {
        var self = this;
        var data = {
            services: self.services || [],
            materials: self.materials || []
        };

        self.$el.html(self.template(data));

        $('div.tab-item').first().click();
    }
});

module.exports = DictionariesView;
