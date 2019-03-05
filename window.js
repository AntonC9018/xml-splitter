const xml = require('./xmlLogic');
var $ = jQuery = require('jquery');
const fs = require('fs')
require('jquery-ui-dist/jquery-ui')
// var M = require('materialize-css')
const noUiSlider = require('nouislider');
const EventEmitter = require('events');
const { shell, remote, ipcRenderer } = require('electron');
const app = remote.app


var path = app.getAppPath() + '\\raw';

var slidersActive = {
  messages: false,
  split: false,
  size: false
}

var sliders = {
  messages: null,
  split: null,
  size: null
}

var sliderOptions = {
  messages:
  {
    start: [25],
    step: 5,
    tooltips: [true],
    range: {
      'min': [5],
      '10%': [200, 50],
      '50%': [600, 100],
      'max': [1500]
    }
  },

  split:
  {
    start: [5],
    step: 1,
    tooltips: [true],
    range: {
      'min': [2],
      'max': [15]
    }
  },

  size:
  {
    start: [25],
    step: 1,
    tooltips: [true],
    range: {
      'min': [1],
      'max': [1200]
    }
  }
}


$(document).ready(function () {

  $('#open-folder').click(changeDir);

  ipcRenderer.on('path:set', (e, newpath) => {
    path = newpath;
    reset();
  });

  ipcRenderer.on('file:set', (e, xml) => {
    openToolbox(xml);
  });

  $('.popup').draggable({
    handle: '.card-title',
    cursor: 'grabbing'
  })

  $('.btn-start').click(processXml)

  $('.btn-cancel').click(() => closeToolbox())

  // set up sliders
  for (let key of Object.keys(sliders)) {

    // get the next slider div
    let slider = $(`#${key}-slider`).get(0);

    // create the slider with particular parameters
    noUiSlider.create(slider, sliderOptions[key]);

    sliders[key] = slider;

    // register checkbox checking
    $(`#${key}`).click(function () {
      slidersActive[key] = !slidersActive[key];
      // change state of the corresponding slider
      $(`#${key}-slider`).toggle();
      // and the field with its value
      $(`#${key}-value`).toggle();
    })

    // register changing of values
    slider.noUiSlider.on('update', () => {
      $(`#${key}-value span`).html(slider.noUiSlider.get())
    })

  }
  reset()

})

function reset() {
  let contents = $('#contents');
  contents.html('');

  $('.foldername').html(path)


  fs.readdir(path, (err, files) => {

    let documents = [];
    let folders = [];

    // split files in 2 categories
    for (let i = 0; i < files.length; i++) {
      if ( /(\.xml)$/i.test(files[i]) ) documents.push(files[i]);
      else folders.push(files[i]);
    }

    let tick = $('<i class="material-icons green right circle">done</i>')

    // loop through the array
    documents.forEach(n => {
      let li = $('<li>') // create an item in the list for each file
        .addClass('collection-item')
        .appendTo(contents)
        .append(
          $('<div>') // in it we have a container
            .addClass('valign-wrapper')
            .append(
              $('<img>') // picture of xml document
                .attr({
                  width: '30px',
                  height: '30px',
                  src: './assets/xml-icon.png'
                })

            )
            .append(
              $('<p>') // name of the file
                .addClass('filename')
                .text(n)
                .css('margin-left', '10px')
            )

        )
        .click(() => openToolbox(n))

        if (folders.includes( n.slice(0, n.length - 4) )) {
            li.find('div').append(tick.clone())
          }
    })
  })
}

var toolboxOpen = false;
var activeXml = null;

function closeToolbox(func) {
  toolboxOpen = false;
  activeXml = null;
  $('.popup').slideUp('fast', () => {
    if (func) func();
  })
}

function openToolbox(fname) {
  if (toolboxOpen) {
    return closeToolbox(() => openToolbox(fname));
  }
  toolboxOpen = true;
  activeXml = fname;
  $('.toolbox .filename').html(fname)
  $('.popup').slideDown('fast');
}

function processXml() {
  let params = {}

  for (let key of Object.keys(sliders)) {
    if (!slidersActive[key]) params[key] = 0;
    else params[key] = sliders[key].noUiSlider.get();
  }

  let em = xml.convert(path + '/' + activeXml, params);
  // console.log(em.on);

  // em.on('open', () => console.log('open'))
  // em.on('saved', (cl, sl) => console.log(cl, ' ', sl))
  em.on('done', () => done(activeXml))

}

function done(xml) {
  shell.openItem(path + '/' + xml.slice(0, xml.length - 4));
  reset();
}

function changeDir() {
  ipcRenderer.send('dialog')
}
