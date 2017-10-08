const needle = require('needle');
const tress = require('tress');
const cheerio = require('cheerio');
const Nightmare = require('nightmare');
const resolve = require('url').resolve;
const fs = require('fs');

const OlxApartmentPage = require('./page_resources/olx/olxApartmentPage');

const BASIC_URL = 'https://www.olx.ua/nedvizhimost/arenda-kvartir/kiev/';
const NUMBER_OF_QUEUES = 10;
const results = [];

const saveInfoAboutPage = function(olx, numberOfPhone) {
  const apartmentData = olx.scrapeInfoFromApartmentPage();
  const data = Object.assign({}, apartmentData, { numberOfPhone });

  console.log('RESULT:', numberOfPhone, data.title);
  
  results.push(data);
}

const collectMetadataAboutApartments  = function(olx, url) {
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
          saveInfoAboutPage(olx, numberOfPhone);
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

      const olx = new OlxApartmentPage(res.body);
      resolve(olx);
    });
  })
  .then(olx => {
    const title = olx.getTitleOfApartmentPage();

    // if we have "title", we are on page of apartment
    if (title) {
      return collectMetadataAboutApartments (olx, url);
    } else {
      // save url for each page of apartment
      const putLinkInArr = function(self, $) {
        q.push(resolve(BASIC_URL, $(self).attr('href')));
      };
      olx.getLinksApartment(putLinkInArr);
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
