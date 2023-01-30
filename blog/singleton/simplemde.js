var showdown  = require('showdown');

function getInstance() {
    const converter = new showdown.Converter();
}
    text      = '# hello, markdown!',
    html      = converter.makeHtml(text);

module.exports = {}