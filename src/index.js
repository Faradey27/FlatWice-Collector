const needle = require('needle');
const tress = require('tress');
const cheerio = require('cheerio');
const Nightmare = require('nightmare');
const resolve = require('url').resolve;
const fs = require('fs');

const BASIC_URL = 'https://www.olx.ua/nedvizhimost/arenda-kvartir/kiev/';
const NUMBER_OF_QUEUES = 10;
const results = [];

const saveInfoAboutPage = function($, title, numberOfPhone) {
  const description = $('.clr p').text();
  const region = $('.show-map-link').text();
  const countRoom = $('.details > tbody > tr:nth-child(2) > td:nth-child(1) > table > tbody > tr > td > strong').text();

  let listOfPhoto = [];
  $('.img-item .photo-glow img').each(function() {
    listOfPhoto.push($(this).attr('src'));
  });
  console.log('RESULT:', numberOfPhone);
  results.push({
    title: title.replace(/\n/g, '').trim(),
    date: description.replace(/\n/g, '').trim(),
    countRoom: countRoom.trim(),
    region: region.trim(),
    numberOfPhone,
    listOfPhoto
  });
}

const analizePageWithNightmare = function($, url, title) {
  // we need to create instance of Nightmare for every url 
  const nightmare = Nightmare({ show: false });
  return nightmare
    .goto(url)
    .viewport(1500, 1500)
    .scrollTo(300, 0)
    .click('#contact_methods > li:nth-child(2) > div > span')
    .wait('#contact_methods .activated strong.xx-large')
    .evaluate(() => {
      return document.querySelectorAll('#contact_methods .activated strong.xx-large')[0].innerText;
    })
    .then((numberOfPhone) => {
      // need use nightmare into "then"
      // otherwise, we can't use "end" after "then"
      return nightmare
        .end()
        .then(() => {
          saveInfoAboutPage($, title, numberOfPhone);
        });
    })
    .catch((error) => {
      console.error('Search failed:', error);
    });
}

const asyncScraping = function(url, cb) {
  new Promise((resolve) => {
    needle.get(url, (err, res) => {
      if (err) {
        throw err;
      }

      const $ = cheerio.load(res.body);
      resolve($);
    });
  })
  .then($ => {
    const title = $('.offer-titlebox h1').text();

    // if we have "title", we are on page of apartment
    if (title) {
      return analizePageWithNightmare($, url, title);
    } else {
      // save url for each page of apartment
      $('.wrap .offer h3 .linkWithHash').each(function() {
        q.push(resolve(BASIC_URL, $(this).attr('href')));
      });
      return;
    }
  })
  .then(() => {
    cb();
  });
}

const q = tress((url, callback) => {
  asyncScraping(url, callback);
}, NUMBER_OF_QUEUES);

q.drain = function() {
  require('fs').writeFileSync('./results.json', JSON.stringify(results, null, 4));
}

q.push(BASIC_URL);
