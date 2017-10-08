const Nightmare = require('nightmare');
import { trimEnters } from './../../utils/stringUtils';

class OlxFlatDetailsPage {
  constructor($, url) {
    this.$ = $;
    this.url = url;
  }

  get title() {
    return this.$('.offer-titlebox h1').text();
  }

  get description() {
    return this.$('.clr p').text();
  }

  get region() {
    return this.$('.show-map-link').text();
  }

  get numberOfRooms() {
    return this.$('.details > tbody > tr:nth-child(2) > td:nth-child(1) > table > tbody > tr > td > strong').text();
  }

  get photos() {
    return this.$('.img-item .photo-glow img').map((index, element) => this.$(element).attr('src')).get();
  }

  phoneNumber() {
    const nightmare = Nightmare({ show: false });
    return new Promise((resolve, reject) => {
      nightmare
        .goto(this.url)
        .viewport(1500, 1500)
        .scrollTo(300, 0)
        .click('#contact_methods > li:nth-child(2) > div > span')
        .wait('#contact_methods .activated strong.xx-large')
        .evaluate(() => document.querySelectorAll('#contact_methods .activated strong.xx-large')[0].innerText)
        .then((numberOfPhone) => nightmare.end().then(() => resolve(numberOfPhone)))
        .catch((error) => reject(error));
    });
  }

  async toJson() {
    const phoneNumber = await this.phoneNumber();

    return {
      title: trimEnters(this.title),
      numberOfRooms: trimEnters(this.numberOfRooms),
      region: trimEnters(this.region),
      description: this.description,
      listOfPhoto: this.photos,
      phoneNumber
    }
  }
}

export default OlxFlatDetailsPage;
