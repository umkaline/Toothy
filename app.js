var CustomersListView = require('./js/views/customersListView');
var CustomerFormView = require('./js/views/customerFormView');
var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var Engine = require('tingodb')();
var db = new Engine.Db('./data/db', {});

var App;
var eventChannel = {};

_.extend(eventChannel, Backbone.Events);
window.App = window.App || {};
App = window.App;

customersListView = new CustomersListView({
    db: db,
    eventChannel: eventChannel
});

$("#new-customer").click(function (e) {
    var self = this;
    var options = {};
    e.preventDefault();

    options.new = true;
    options.db = db;
    options.eventChannel = eventChannel;

    App.contentView && App.contentView.undelegateEvents();
    App.contentView = new CustomerFormView(options);
});
