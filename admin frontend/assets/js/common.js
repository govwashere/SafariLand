/* Shared behaviour: modals, toast, filtering, validation and a small CRUD helper. */
(function ($) {
  'use strict';

  var SL = window.SL = { filters: { category: '*', status: '*' } };
  var lastTrigger = null, toastTimer;

  /* ---------- Modals ---------- */
  SL.openModal = function (id, trigger) {
    lastTrigger = trigger || document.activeElement;
    var $m = $('#' + id).addClass('is-open').attr('aria-hidden', 'false');
    $('body').addClass('modal-open');
    setTimeout(function () {
      $m.find('input:not([type=hidden]), select, textarea, .btn').first().trigger('focus');
    }, 40);
  };

  SL.closeModal = function () {
    $('.modal-overlay.is-open').removeClass('is-open').attr('aria-hidden', 'true');
    $('body').removeClass('modal-open');
    if (lastTrigger && $.contains(document.documentElement, lastTrigger)) { $(lastTrigger).trigger('focus'); }
    lastTrigger = null;
  };

  $(document)
    .on('click', '.js-close', SL.closeModal)
    .on('mousedown', '.modal-overlay', function (e) { if (e.target === this) { SL.closeModal(); } })
    .on('keydown', function (e) {
      var $open = $('.modal-overlay.is-open');
      if (!$open.length) { return; }
      if (e.key === 'Escape') { SL.closeModal(); return; }
      if (e.key !== 'Tab') { return; }
      var $f = $open.find('input:not([type=hidden]):visible, select:visible, textarea:visible, button:visible');
      if (!$f.length) { return; }
      var first = $f[0], last = $f[$f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

  /* ---------- Toast ---------- */
  SL.toast = function (msg) {
    var $t = $('#toast').text(msg).addClass('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $t.removeClass('is-visible'); }, 2600);
  };

  /* ---------- Form validation ---------- */
  SL.resetForm = function ($form) {
    $form[0].reset();
    $form.find('.has-error').removeClass('has-error').find('.field-error').remove();
    $form.find('[aria-invalid]').removeAttr('aria-invalid');
  };

  SL.validate = function ($form) {
    var firstBad = null;
    SL.resetFormErrors($form);
    $form.find('input:not([type=hidden]):not([type=file]), select, textarea').each(function () {
      var empty = !$.trim(this.value), msg = '';
      if (this.required && empty) { msg = 'This field is required.'; }
      else if (!empty && !this.checkValidity()) { msg = 'Enter a valid value.'; }
      if (!msg) { return; }
      $(this).attr('aria-invalid', 'true').closest('.field').addClass('has-error').append($('<span class="field-error">').text(msg));
      firstBad = firstBad || this;
    });
    if (firstBad) { firstBad.focus(); }
    return !firstBad;
  };

  SL.resetFormErrors = function ($form) {
    $form.find('.has-error').removeClass('has-error').find('.field-error').remove();
    $form.find('[aria-invalid]').removeAttr('aria-invalid');
  };

  /*Filtering (tabs + search boxes + status)*/
  SL.applyFilters = function () {
    var terms = $('.js-search').map(function () { return $.trim(this.value).toLowerCase(); }).get().filter(Boolean);
    var shown = 0;
    $('.data tbody tr[data-row]').each(function () {
      var $r = $(this);
      var ok = (SL.filters.category === '*' || $r.attr('data-category') === SL.filters.category) &&
               (SL.filters.status === '*' || $r.attr('data-status') === SL.filters.status);
      if (ok) {
        var text = $r.text().toLowerCase();
        ok = terms.every(function (t) { return text.indexOf(t) > -1; });
      }
      $r.toggle(ok);
      if (ok) { shown++; }
    });
    $('.empty-row').prop('hidden', shown > 0);
  };

  $(document)
    .on('input', '.js-search', SL.applyFilters)
    .on('click', '.js-filter-tab', function () {
      var $t = $(this);
      $t.closest('.tabs').find('.tab').attr('aria-pressed', 'false');
      $t.attr('aria-pressed', 'true');
      SL.filters.category = $t.attr('data-filter');
      SL.applyFilters();
    });

  /* CRUD helper (front-end only)*/
  SL.crud = function (cfg) {
    var $body = $(cfg.body), $form = $(cfg.form), $editing = null, $deleting = null;

    function readRow($tr) {
      var d = {};
      $.each(cfg.attrs, function (_, k) { d[k] = $tr.attr('data-' + k) || ''; });
      return d;
    }
    function writeRow($tr, d) {
      $.each(cfg.attrs, function (_, k) { $tr.attr('data-' + k, d[k] == null ? '' : d[k]); });
      cfg.render($tr, d);
    }
    function bump(n) {
      if (!cfg.count) { return; }
      var $c = $(cfg.count);
      $c.text(Math.max(0, (parseInt($c.text(), 10) || 0) + n));
    }
    function openForm(trigger, $tr) {
      $editing = $tr || null;
      SL.resetForm($form);
      $(cfg.title).text(($tr ? 'Edit ' : 'Add ') + cfg.noun);
      var d = $tr ? readRow($tr) : (cfg.defaults || {});
      $.each(cfg.fields, function (_, k) { $form.find('[name="' + k + '"]').val(d[k] == null ? '' : d[k]); });
      SL.openModal(cfg.modal, trigger);
    }

    $('.js-add').on('click', function () { openForm(this); });
    $body.on('click', '.js-edit', function () {
      openForm(this, $(this).closest('tr')); });
    $body.on('click', '.js-delete', function () {
      $deleting = $(this).closest('tr');
      SL.openModal(cfg.deleteModal, this);
    });

    $('#' + cfg.deleteModal).on('click', '.js-confirm-delete', function () {
      if (!$deleting) { return; }
      // Back-end hook: send the delete request here, then remove the row
      $deleting.remove();
      $deleting = null;
      bump(-1);
      SL.applyFilters();
      SL.closeModal();
      SL.toast(cfg.noun + ' deleted.');
    });

    $form.on('input change', '.has-error input, .has-error select, .has-error textarea', function () {
      $(this).removeAttr('aria-invalid').closest('.field').removeClass('has-error').find('.field-error').remove();
    });

    $form.on('submit', function (e) {
      e.preventDefault();
      if (!SL.validate($form)) { return; }
      var d = {};
      $.each(cfg.fields, function (_, k) { d[k] = $.trim($form.find('[name="' + k + '"]').val()); });
      if (cfg.prepare) { cfg.prepare(d, $editing, $form); }
      // Back-end hook: send the save request here (the new id would come from the server)
      if ($editing) {
        d.id = $editing.attr('data-id');
        writeRow($editing, d);
      } else {
        d.id = 'new-' + Date.now();
        var $tr = $(document.getElementById(cfg.template)
          .content.firstElementChild.cloneNode(true));
        writeRow($tr, d);
        $tr.insertBefore($body.find('.empty-row'));
        bump(1);
      }
      if (cfg.after) { cfg.after(); }
      SL.applyFilters();
      SL.closeModal();
      SL.toast(cfg.noun + ' saved.');
    });

    if (/[?&]add=1\b/.test(location.search)) { openForm(null); }
  };

  /* Dashboard date */
  $('#todayDate').text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));

  $(SL.applyFilters);
})(jQuery);
