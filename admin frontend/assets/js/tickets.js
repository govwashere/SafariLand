$(function () {
  'use strict';
  SL.crud({
    noun: 'Ticket',
    body: '#ticketRows', form: '#ticketForm', modal: 'ticketModal', title: '#ticketModalTitle',
    deleteModal: 'deleteTicketModal', template: 'ticketRowTpl',
    fields: ['name', 'price', 'description', 'guests'],
    attrs:  ['id', 'name', 'price', 'description', 'guests'],
    render: function ($tr, d) {
      $tr.find('.c-name').text(d.name);
      $tr.find('.c-price').text(d.price);
      var $list = $tr.find('.c-desc').empty();
      $.each(String(d.description).split('\n'), function (_, line) {
        line = $.trim(line);
        if (line) { $('<li>').text(line).appendTo($list); }
      });
    }
  });
});
