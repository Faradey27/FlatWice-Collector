import needle from 'needle';
import tress from 'tress';
import fs from 'fs';
import progress from 'node-status';
import Url from 'url';
import Olx from './Resources/Olx';

const MAX_NUMBER_OF_FLATS_TO_COLLECT = 50;
const NUMBER_OF_QUEUES = 6;

class FlatCollector {
  flatsList = []

  constructor() {
    this.q = tress((url, callback) => this.collectDataAboutFlats(url, callback), NUMBER_OF_QUEUES);
    this.q.drain = this.onDataCollectionEnd;
    this.q.push(Olx.defaultUrl);
  }

  showProgressBar(max = MAX_NUMBER_OF_FLATS_TO_COLLECT) {
    this.totalNumberOfFlats = max;
    this.flatsProgress = progress.addItem('flat', {max: this.totalNumberOfFlats});
    progress.start({ pattern: 'Collection data: {uptime}  |  {spinner.cyan}  |  {flat.bar}'});
  }

  addFlatToList = async (olx, url) => {
    this.flatsProgress.inc(); // log progress
    const apartmentData = await olx.scrapeInfoAboutFlat(url);
    this.flatsList.push(apartmentData);
  }

  onDataCollectionEnd = () => {
    this.flatsProgress.inc(51);
    fs.writeFileSync('./results.json', JSON.stringify(this.flatsList, null, 4));
    process.exit(0);
  }

  loadPage = (url) => {
    return new Promise((resolve, reject) => {
      needle.get(url, (err, res) => {
        if (err) {
          reject(err);
        };
        resolve(res.body);
      })
    });
  }

  collectDataAboutFlats = async (url, cb) => {
    const pageBody = await this.loadPage(url);
    const olx = new Olx(pageBody);
    const title = olx.title;

    // if we have "title", we are on page of apartment
    if (title) {
      await this.addFlatToList(olx, url);
    } else {
      olx.listOfLinksToFlats
        .map(href => Url.resolve(Olx.defaultUrl, href))
        .forEach(relativeHref => this.q.push(relativeHref))
    }
    cb();
  }
}

const flatCollector = new FlatCollector();
flatCollector.showProgressBar();
