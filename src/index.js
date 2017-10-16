import needle from 'needle';
import tress from 'tress';
import fs from 'fs';
import progress from 'node-status';
import Url from 'url';
import Olx from './Resources/Olx';

const MAX_NUMBER_OF_FLATS_TO_COLLECT = 100;
const NUMBER_OF_QUEUES = 1;
const INITIAL_PAGE_OF_FLAT_LIST = 2;
const NUMBER_OF_PAGES = 2;

class FlatCollector {
  flatsList = []

  constructor() {
    this.q = tress((url, callback) => this.collectDataAboutFlats(url, callback), NUMBER_OF_QUEUES);
    this.q.drain = this.onDataCollectionEnd;
    this.q.push(Olx.defaultUrl);
    this.isNeedNextFlatsList = true;
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

        const body = res && res.body;
        resolve(body);
      })
    });
  }

  addNextPageOfFlatList(olx, countPages) {
    if (this.isNeedNextFlatsList) {
      for(let page = INITIAL_PAGE_OF_FLAT_LIST; page <= NUMBER_OF_PAGES; page++) {
        this.q.push(`${Olx.defaultUrl}?page=${page}`)
      }
      this.isNeedNextFlatsList = false;
    }
  }

  collectDataAboutFlats = async (url, cb) => {
    const pageBody = await this.loadPage(url);
    const olx = new Olx(pageBody);
    const title = olx.title;

    // if we have "title", we are on page of apartment
    if (title) {
      await this.addFlatToList(olx, url);
    } else {
      this.addNextPageOfFlatList(olx, NUMBER_OF_PAGES);
      olx.listOfLinksToFlats
        .map(href => Url.resolve(Olx.defaultUrl, href))
        .forEach(relativeHref => this.q.push(relativeHref));
    }
    cb();
  }
}

const flatCollector = new FlatCollector();
flatCollector.showProgressBar();
