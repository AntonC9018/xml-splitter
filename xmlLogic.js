// import XmlReader from 'xml-reader';
// import XmlQuery from 'xml-query';
// import * as xmlPrint from 'xml-printer';
// import fs from 'fs'

const XmlReader = require('xml-reader');
const XmlQuery = require('xml-query');
const XmlPrint = require('xml-printer');
const fs = require('fs');
const Path = require('path');

const EventEmitter = require('events');

function type() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
}

function convert(path, { size, messages, split }) {

  size *= 1000;
  if (!size && !messages && !split) size = 50000;
  if (split) size = 0;

  const emitter = new EventEmitter();

  console.log(emitter);
  let _f = Path.basename(path);
  const folderName = _f.slice(0, _f.length - 4);
  const dirname = Path.dirname(path);
  const outputFolder = dirname + '/' + folderName;

  fs.mkdir(outputFolder, (err) => {
    if (err) {
      // emitter.emit('error', err);
    } else {
      emitter.emit('folder')
    }
  });

  const reader = XmlReader.create();

  reader.on('done', data => {

    emitter.emit('parsed')

    const xq = XmlQuery(data); // turn text into ast

    // get the wrapper tag
    const wrapper = xq.find('SADBEL_Interop').ast[0];
    // query all messages
    const msgs = xq.find('SadbelCustomsStatusMessage').ast;
    // query the header
    const header = xq.find('Header').ast;

    let i = 1;

    let startLength = msgs.length;

    wrapper.children = [];

    if (split) {
      messages = Math.ceil(msgs.length / split) + 1;
    }

    while (msgs.length !== 0) {
      // prepend header tag to messages
      msgs.unshift(header);

      let batch;

      if (!size) {
        // get n messages
        batch = msgs.splice(0, messages);
        wrapper.children = batch;
      }

      else {
        // get n byte messages of messages
        batch = cutBytes(size, messages, msgs);
        wrapper.children = [{ type: 'text', value: batch, children: [] }];
      }


      let xml = type() + XmlPrint.print(wrapper, { escapeText: false });

      const strings = Buffer.from(xml)

      const len = msgs.length;

      fs.writeFile(`${outputFolder}/${i++}.xml`, strings, 'utf-8', (err, data) => {
        // if (err) emitter.emit('error', err)
        console.log('wrote');
        emitter.emit('saved', len, startLength);
        if (len === 0) emitter.emit('done')
      })
    }
  });

  fs.readFile(path, 'utf8', (err, xml) => {
    emitter.emit('open');
    reader.parse(xml);
  });

  return emitter;
}

function cutBytes(size, messages, arr) {

  if (!messages) messages = Infinity;

  let result = '';

  for (let i = 0; i < messages; i++) {
    // keep looping until limit is met
    if (result.length >= size || arr.length === 0) return result;
    // cut the first element
    let el = arr.shift();
    // turn element into string
    let str = XmlPrint.print(el);

    result += str;
  }

  return result;
}

module.exports = {
  convert,
  cutBytes,
  type
}
