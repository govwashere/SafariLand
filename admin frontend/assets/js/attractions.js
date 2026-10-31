$(function () {
  'use strict';
  var PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="58"><rect width="100" height="58" fill="#d9d9d9"/></svg>');

  SL.crud({
    noun: 'Attraction',
    body: '#attractionRows', form: '#attractionForm', modal: 'attractionModal', title: '#attractionModalTitle',
    deleteModal: 'deleteAttractionModal', template: 'attractionRowTpl', count: '#countAll',
    fields: ['name', 'category', 'price', 'minage', 'minheight', 'duration', 'status', 'description'],
    attrs:  ['id', 'name', 'category', 'price', 'minage', 'minheight', 'duration', 'status', 'description', 'image'],
    defaults: { status: 'Open' },
    prepare: function (d, $tr, $form) {
      var file = $form.find('[name="image"]')[0].files[0];
      d.image = file ? URL.createObjectURL(file) : ($tr ? $tr.attr('data-image') : '');
    },
    render: function ($tr, d) {
      $tr.find('.c-name').text(d.name);
      $tr.find('.c-category').text(d.category);
      $tr.find('.c-price').text(d.price);
      $tr.find('.c-status').text(d.status);
      $tr.find('.thumb').attr({ src: d.image || PLACEHOLDER, alt: d.name });
    }
  });
});
