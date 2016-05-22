var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');

var CalendarView = Backbone.View.extend({
    el: '#content-holder',
    initialize: function (options) {
        var self = this;
        var App;
        window.App = window.App || {};

        App = window.App;

        self.db = options.db;
        self.eventChannel = options.eventChannel;

        self.render();
    },

    render: function (model) {
        var self = this;

        self.$el.html('<div id="calendar"></div>');

        self.$el.find('#calendar').fullCalendar({
            defaultView: 'agendaWeek',
			editable: true,
            height: 'auto',
            defaultDate: '2014-06-12',
            header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,agendaWeek,agendaDay'
			},
            events: [
				{
					title: 'All Day Event',
					start: '2014-06-01'
				},
				{
					title: 'Long Event',
					start: '2014-06-07',
					end: '2014-06-10'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2014-06-09T16:00:00'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2014-06-16T16:00:00'
				},
				{
					title: 'Meeting',
					start: '2014-06-12T10:30:00',
					end: '2014-06-12T12:30:00'
				},
				{
					title: 'Lunch',
					start: '2014-06-12T12:00:00'
				},
				{
					title: 'Birthday Party',
					start: '2014-06-13T07:00:00'
				},
				{
					title: 'Click for Google',
					url: 'http://google.com/',
					start: '2014-06-28'
				}
			]
        });
    }
});

module.exports = CalendarView;
