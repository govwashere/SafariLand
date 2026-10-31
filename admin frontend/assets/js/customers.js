$(function () {
  'use strict';
  var $body = $('#customerRows'), mode = 'all';

  function sortRows() {
    var rows = $body.children('tr[data-row]').get();
    rows.sort(function (a, b) {
      var A = $(a), B = $(b);
      if (mode === 'top') { return (+B.attr('data-purchases')) - (+A.attr('data-purchases')); }
      if (mode === 'recent') { return String(B.attr('data-last')).localeCompare(String(A.attr('data-last'))); }
      return (+A.attr('data-order')) - (+B.attr('data-order'));
    });
    $.each(rows, function (_, r) { $body.append(r); });
    $body.append($body.children('.empty-row'));
  }

  SL.crud({
    noun: 'Customer',
    body: '#customerRows', form: '#customerForm', modal: 'customerModal', title: '#customerModalTitle',
    deleteModal: 'deleteCustomerModal', template: 'customerRowTpl', count: '#countAll',
    fields: ['name', 'email', 'contact', 'status'],
    attrs:  ['id', 'name', 'email', 'contact', 'purchases', 'status', 'last', 'order'],
    defaults: { status: 'Active' },
    prepare: function (d, $tr) {
      d.purchases = $tr ? $tr.attr('data-purchases') : 0;
      d.last      = $tr ? $tr.attr('data-last') : '';
      d.order     = $tr ? $tr.attr('data-order') : Date.now();
    },
    render: function ($tr, d) {
      $tr.find('.c-name').text(d.name);
      $tr.find('.c-email').text(d.email);
      $tr.find('.c-contact').text(d.contact);
      $tr.find('.c-purchases').text(d.purchases);
      $tr.find('.c-status').text(d.status);
    },
    after: sortRows
  });

  /* All Customers / Recent Purchases / Top Customers */
  $('.js-sort-tab').on('click', function () {
    var $t = $(this);
    $t.closest('.tabs').find('.tab').attr('aria-pressed', 'false');
    $t.attr('aria-pressed', 'true');
    mode = $t.attr('data-sort');
    sortRows();
  });

  /* Status filter menu */
  var $toggle = $('.js-filter-toggle'), $menu = $('#filterMenu');
  function closeMenu() { $menu.prop('hidden', true); $toggle.attr('aria-expanded', 'false'); }

  $toggle.on('click', function (e) {
    e.stopPropagation();
    var open = $menu.prop('hidden');
    $menu.prop('hidden', !open);
    $toggle.attr('aria-expanded', String(open));
  });
  $menu.on('click', '.filter-opt', function () {
    $menu.find('.filter-opt').attr('aria-pressed', 'false');
    $(this).attr('aria-pressed', 'true');
    SL.filters.status = $(this).attr('data-status');
    SL.applyFilters();
    closeMenu();
    $toggle.trigger('focus');
  });
  $(document).on('click', function (e) { if (!$(e.target).closest('.filter-wrap').length) { closeMenu(); } });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); } });
});
