var CustomersListView = require('./js/views/customersListView');
var CustomerFormView = require('./js/views/customerFormView');
var DictionariesView = require('./js/views/dictionariesView');
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
var path = require('path');
var _ = require('underscore');
var Engine = require('tingodb')();
var db = new Engine.Db(path.join(__dirname, '/data/db'), {});

var App;
var eventChannel = {};

require('fullcalendar');
//require('jquery-ui');
//require('bootstrap');
//require('transition');
//require('collapse');
//require('./node_modules/bootstrap-datetimepicker/src/js/bootstrap-datetimepicker');

// db.collection('customers').createIndex({_id: 1, firstName: 1, lastName: 1, middleName: 1});

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

$("#dictionaries").click(function (e) {
    var self = this;
    var options = {};
    e.preventDefault();

    options.db = db;
    options.eventChannel = eventChannel;

    App.contentView && App.contentView.undelegateEvents();
    App.contentView = new DictionariesView(options);
});
