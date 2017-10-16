const cheerio = require('cheerio');
import OlxFlatDetailsPage from './OlxFlatDetailsPage'

class Olx {
  static defaultUrl = 'https://www.olx.ua/nedvizhimost/arenda-kvartir/kiev/';

  constructor(body, url = Olx.defaultUrl) {
    this.$ = cheerio.load(body);
    this.url = url;
  }

  get title(){
    return this.$('.offer-titlebox h1').text();
  }

  get countPages() {
    return this.$('.item.fleft:nth-last-child(2) a span').text();
  }

  get listOfLinksToFlats() {
    return this.$('.wrap .offer h3 .linkWithHash').map((index, element) => this.$(element).attr('href')).get();
  }

  scrapeInfoAboutFlat = (url) => {
    const flat = new OlxFlatDetailsPage(this.$, url);
    return flat.toJson();
  }
}

export default Olx;
