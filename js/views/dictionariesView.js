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

        self.prepareDate = _.after(3, self.prepareDate);

        self.db.collection('services').find({})
                .toArray(function(err, result) {
            self.services = result;
            self.prepareDate();
        });

        self.db.collection('materials').find({})
                .toArray(function(err, result) {
            self.materials = result;
            self.prepareDate();
        });

        self.db.collection('dictGroups').find({})
                .toArray(function(err, result) {
            self.dictGroups = result;
            self.prepareDate();
        });
    },

    events: {
        'click #save': 'saveCustomer',
        'click .icon-cancel': 'remove',
        'click button.btn-positive': 'add',
        'click .tab-item': 'switchTab',
        'change input[type="color"][data-type="dictGroups"]': 'changeGroupColor',
        'change select': 'moveToGroup'
    },
    
    moveToGroup: function(e) {
        var self = this;
        var $target = $(e.target);
        var itemType = $target.parents('table').attr('data-type');
        var newGroupId = $target.val();
        var $row = $target.closest('tr').detach();
        var itemId = $row.attr('data-id');
        var newGroupHolderTable = $('div[data-id=' + itemType + '] div.groupHolder[group-id=' + newGroupId + '] tbody');
        
        newGroupHolderTable.append($row);
        
        self.db.collection(itemType).update({_id: itemId}, {$set: {group: newGroupId}}, function (err, res) {
        });
    },

    changeGroupColor: function(e) {
        var self = this;
        var id = $(e.target).closest('tr').attr('data-id');
        var color = $(e.target).val();
        
        $('h3[group-id=' + id + ']').css({'background': color});

        self.db.collection('dictGroups').update({_id: id}, {$set: {color: color}}, function (err, res) {
                self.eventChannel.trigger('groupUpdated');
        });
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

            if (collection === 'dictGroups') {
                self.updateNeeded = true;
            }
        });
    },

    add: function (e) {
        var self = this;
        var collection;
        var $tbody;
        var $parent;
        var params;
        var name;
        var price;
        var data;
        var group;

        collection = $(e.target).attr('data-type');
        group = $(e.target).attr('group-id');
        $tbody = $(e.target).closest('table').find('tbody');
        $parent = $(e.target).closest('tr');
        name = $parent.find('input.name').val();


        e.preventDefault();

        if (!name) {
            return alert('Name can\'t be empty');
        }

        if (collection === 'dictGroups') {

            params = {
                collection: collection,
                $tbody: $tbody,
                $parent: $parent,
                name: name
            };

            self.addGroup(params);

        } else {

            price = $parent.find('input.price').val() || 0;
            data = {
                name: name,
                price: price,
                group: group
            };

            self.db.collection(collection).insert(data, function(err, result) {
                $tbody.append(`<tr data-id="${result[0]._id.id}">
                <td>${name}</td>
                <td>${price}</td>
                <td><span class="icon icon-cancel"></span></td>
                </tr>`);
            });
        }

    },

    addGroup: function (params) {
        var self = this;

        var color = params.$parent.find('input.color').val() || '#808080';
            data = {
                name: params.name,
                color: color
            };

            self.db.collection(params.collection).insert(data, function(err, result) {
                params.$tbody.append(`<tr data-id="${result[0]._id.id}">
                <td>${params.name}</td>
                <td><input type="color" class="form-control color" value="${color}" data-type="dictGruops"></td>
                <td><span class="icon icon-cancel"></span></td>
                </tr>`);

                self.updateNeeded = true;
            });

    },

    switchTab: function (e) {
        var self = this;
        var $target = $(e.target);
        var tabName = $target.attr('data-id');
        e.preventDefault();

        if (self.updateNeeded) {
            self.tabName = tabName;
            self.initialize(self);
        } else {
            $('.tab-item').removeClass('active');
            $target.addClass('active');

            $('.tab-content').hide();
            $('.tab-content[data-id="' + tabName + '"]').show();
        }
    },

    prepareDate: function() {
        var self = this;
        var data = [];
        var m = [];
        var s = [];

        self.dictGroups.forEach(function(dictGroup) {

            for (var i = 0; i < self.services.length; i++) {
                if (self.services[i].group == dictGroup._id.id) {
                    s.push(self.services[i]);
                    self.services.splice(i, 1);
                    i--;
                }
            } 

            for (var i = 0; i < self.materials.length; i++) {
                if (self.materials[i].group == dictGroup._id.id) {
                    m.push(self.materials[i]);
                    self.materials.splice(i, 1);
                    i--;
                }
            } 

            data.push({
                id: dictGroup._id,
                color: dictGroup.color,
                name: dictGroup.name,
                services: s,
                materials: m
            });

            s = [];
            m = [];
        });

        data.unshift({
                id: -1,
                color: '#909090',
                name: "No Group",
                services: self.services,
                materials: self.materials
            });

        self.data = data;

        self.render();
    },

    render: function () {
        var self = this;
        var data = {
            services: self.services || [],
            materials: self.materials || [],
            dictGroups: self.dictGroups || [],
            data: self.data
        };

        self.$el.html(self.template(data));

        if (self.updateNeeded) {
            self.updateNeeded = false;
            $('div.tab-item[data-id="' + self.tabName + '"]').click();
        } else {
            $('div.tab-item').first().click();
        }


        $('div.accordion').accordion({
          heightStyle: "content"
        });
    }
});

module.exports = DictionariesView;
