const cheerio = require('cheerio');

const trimEnters = require('../../utils/trimEnters');

class OlxApartmentPage {
  constructor(body) {
    this.$ = cheerio.load(body);
  }

  getTitleOfApartmentPage() {
    return this.$('.offer-titlebox h1').text();
  }

  getLinksApartment(cb) {
    const $ = this.$;
    $('.wrap .offer h3 .linkWithHash').each(function() { cb(this, $) });
  }

  scrapeInfoFromApartmentPage() {
    const $ = this.$;
    const title = this.getTitleOfApartmentPage();
    const description = $('.clr p').text();
    const region = $('.show-map-link').text();
    const countRoom = $('.details > tbody > tr:nth-child(2) > td:nth-child(1) > table > tbody > tr > td > strong').text();
    let listOfPhoto = [];
    $('.img-item .photo-glow img').each(function() {
      listOfPhoto.push($(this).attr('src'));
    });

    return {
      title: trimEnters(title),
      countRoom: trimEnters(countRoom),
      region: trimEnters(region),
      description,
      listOfPhoto
    };
  }
}

module.exports = OlxApartmentPage;
