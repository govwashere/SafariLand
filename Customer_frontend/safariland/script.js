/* =====================================================
   SafariLand – jQuery behaviour (front end only)
   Each block only runs if its page elements exist.
   ===================================================== */
$(function () {

  /* ---------------------------------------------------
     MY TICKETS – Active / Past tabs
     --------------------------------------------------- */
  $('.tab[data-tab]').on('click', function () {
    var showActive = $(this).data('tab') === 'active';

    $('.tab').removeClass('active');
    $(this).addClass('active');

    $('#tab-active').toggleClass('is-hidden', !showActive);
    $('#tab-past').toggleClass('is-hidden', showActive);
  });


  /* ---------------------------------------------------
     PARK TICKETS – quantity buttons + continue
     --------------------------------------------------- */
  var $qty = $('.qty');

  if ($qty.length) {
    var MAX_PER_PASS = 10;

    $qty.on('click', 'button', function () {
      var $input = $(this).siblings('input');
      var n = parseInt($input.val(), 10) || 0;

      n += $(this).hasClass('plus') ? 1 : -1;
      $input.val(Math.min(MAX_PER_PASS, Math.max(0, n)));

      $('#pass-error').prop('hidden', true);
    });

    // Need at least one ticket to go to the payment page.
    // The chosen quantities travel in the link, e.g. payment.html?general=2&family=0&vip=1
    $('#continue').on('click', function (e) {
      var total = 0;
      var params = [];

      $qty.each(function () {
        var n = parseInt($(this).find('input').val(), 10) || 0;
        total += n;
        params.push($(this).data('pass') + '=' + n);
      });

      if (total === 0) {
        e.preventDefault();
        $('#pass-error').prop('hidden', false);
        return;
      }

      $(this).attr('href', 'payment.html?' + params.join('&'));
    });
  }


  /* ---------------------------------------------------
     PAYMENT – input formatting + validation
     --------------------------------------------------- */
  var $payForm = $('#payment-form');

  if ($payForm.length) {

    // --- Order summary, built from the quantities in the link ---
    // Prices in Rs (the Family price is an assumption – change it as needed)
    var PRICES = { general: 400, family: 1200, vip: 1800 };
    var LABELS = { general: 'General Pass', family: 'Family Pass', vip: 'VIP Pass' };
    var SERVICE_FEE = 100;
    var MAX_PER_PASS_PAY = 10;

    var urlParams = new URLSearchParams(window.location.search);
    var order = {};
    var ticketCount = 0;

    $.each(PRICES, function (key) {
      var n = parseInt(urlParams.get(key), 10);
      order[key] = isNaN(n) ? 0 : Math.min(MAX_PER_PASS_PAY, Math.max(0, n));
      ticketCount += order[key];
    });

    // Opened directly (no tickets in the link)? Show the sample order from the design
    if (ticketCount === 0) { order = { general: 1, family: 0, vip: 1 }; }

    var rs = function (n) { return 'Rs ' + n.toLocaleString('en-US'); };
    var subtotal = 0;

    $.each(PRICES, function (key, price) {
      if (order[key] < 1) { return; }

      var amount = order[key] * price;
      subtotal += amount;

      $('<div class="line"></div>')
        .append($('<span></span>').text(LABELS[key] + ' x ' + order[key]))
        .append($('<span></span>').text(rs(amount)))
        .appendTo('#order-lines');
    });

    $('#subtotal').text(rs(subtotal));
    $('#fee').text(rs(SERVICE_FEE));
    $('#total').text(rs(subtotal + SERVICE_FEE));


    // --- Live formatting while typing ---
    $('#card').on('input', function () {
      var digits = $(this).val().replace(/\D/g, '').slice(0, 16);
      $(this).val(digits.replace(/(.{4})/g, '$1 ').trim());
    });

    $('#expiry').on('input', function () {
      var digits = $(this).val().replace(/\D/g, '').slice(0, 4);
      $(this).val(digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits);
    });

    $('#cvv').on('input', function () {
      $(this).val($(this).val().replace(/\D/g, '').slice(0, 4));
    });


    // --- Validation helpers ---
    var showError = function ($input, message) {
      var $group = $input.closest('.pay-field');
      $input.addClass('invalid');
      $group.find('.field-error').remove();
      $('<small class="field-error"></small>').text(message).appendTo($group);
    };

    var clearError = function ($input) {
      $input.removeClass('invalid');
      $input.closest('.pay-field').find('.field-error').remove();
    };

    // Remove an error as soon as the person starts fixing the field
    $payForm.find('.input-lg').on('input', function () { clearError($(this)); });

    var isExpired = function (value) {
      var parts = value.split('/');
      var month = parseInt(parts[0], 10);
      var year = 2000 + parseInt(parts[1], 10);
      var now = new Date();
      return year < now.getFullYear() ||
             (year === now.getFullYear() && month < now.getMonth() + 1);
    };

    $payForm.on('submit', function (e) {
      e.preventDefault(); // nothing is sent anywhere – this is front-end only

      var $holder = $('#holder'), $card = $('#card'), $expiry = $('#expiry'), $cvv = $('#cvv');
      var valid = true;

      $payForm.find('.input-lg').each(function () { clearError($(this)); });

      if (!/^[A-Za-z][A-Za-z .'-]{2,}$/.test($.trim($holder.val()))) {
        showError($holder, 'Enter the name shown on the card.');
        valid = false;
      }
      if ($card.val().replace(/\s/g, '').length !== 16) {
        showError($card, 'Card number must be 16 digits.');
        valid = false;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test($expiry.val())) {
        showError($expiry, 'Use the format MM/YY.');
        valid = false;
      } else if (isExpired($expiry.val())) {
        showError($expiry, 'This card has expired.');
        valid = false;
      }
      if (!/^\d{3,4}$/.test($cvv.val())) {
        showError($cvv, 'CVV must be 3 or 4 digits.');
        valid = false;
      }

      if (!valid) {
        $payForm.find('.invalid').first().trigger('focus');
        return;
      }

      window.location.href = 'confirmation.html';
    });
  }


  /* ---------------------------------------------------
     MY PROFILE – edit, live name, password check, photo preview
     --------------------------------------------------- */
  var $editBtn = $('#edit-btn');

  if ($editBtn.length) {
    var editing = false;

    // "Edit" unlocks the personal information fields
    $editBtn.on('click', function () {
      editing = !editing;
      $('#personal-form .field').prop('readonly', !editing);
      $(this).text(editing ? 'Done' : 'Edit');
      if (editing) { $('#fullname').trigger('focus'); }
    });

    // The name in the top bar follows the Full Name field as you type
    $('#fullname').on('input', function () {
      $('#topbar-name').text($.trim($(this).val()));
    });

    // Password form
    $('#password-form').on('submit', function (e) {
      e.preventDefault();

      var current = $('#current-pw').val();
      var next = $('#new-pw').val();
      var confirm = $('#confirm-pw').val();
      var $msg = $('#pw-msg').removeClass('ok error');

      if (!current || !next || !confirm) {
        $msg.addClass('error').text('Please fill in all three password fields.');
      } else if (next.length < 8) {
        $msg.addClass('error').text('New password must be at least 8 characters.');
      } else if (next !== confirm) {
        $msg.addClass('error').text('New password and confirmation do not match.');
      } else {
        $msg.addClass('ok').text('Your changes have been saved.');
        this.reset();
      }
    });

    // Change Photo – choose an image and preview it in the circles
    $('.btn-photo').on('click', function () { $('#photo-input').trigger('click'); });

    $('#photo-input').on('change', function () {
      var file = this.files && this.files[0];
      if (!file || file.type.indexOf('image/') !== 0) { return; }

      var reader = new FileReader();
      reader.onload = function (ev) {
        $('#profile-avatar, #topbar-avatar')
          .addClass('has-photo')
          .css('background-image', 'url("' + ev.target.result + '")');
      };
      reader.readAsDataURL(file);
    });
  }

});
