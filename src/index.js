const { webkit } = require('playwright');
const assert = require('assert');
const { createObjectCsvWriter } = require('csv-writer');


const url = 'https://www.imdb.com/user/ur34765497/ratings';
const filename = 'data/imdb.csv';
const keyOrder = ['title', 'range_year', 'genre', 'rating', 'user_rating', 'votes'];
const csvHeader = [
  { id: 'imdbid', title: 'Const' },
  { id: 'user_rating', title: 'Your Rating' },
  // { id: 'temp1', title: 'Date Added' },
  { id: 'title', title: 'Title' },
  // { id: 'temp2', title: 'Title Type' },
  // { id: 'temp3', title: 'Directors' },
  { id: 'rating', title: 'IMDb Rating' },
  // { id: 'temp4', title: 'Runtime (mins)' },
  { id: 'release_year', title: 'Year' },
  { id: 'genre', title: 'Genres' },
  { id: 'votes', title: 'Num Votes' },
];
const nextSelectorPath = '#ratings-container > div.footer.filmosearch > div > div > a.flat-button.next-page';


async function rawRecords(page) {
  return Promise.all([
    page.$$('div.lister-item-content > h3 > a:nth-child(3)'), // Titles
    page.$$('div.lister-item-content > h3 > span.lister-item-year.text-muted.unbold:nth-child(4)'), // Years
    page.$$('div.lister-item-content > p:nth-child(3) > span.genre'), // Genres
    page.$$('div.ipl-rating-widget > div:nth-child(1) > span.ipl-rating-star__rating'), // Population Ratings
    page.$$('div.ipl-rating-widget > div.ipl-rating-star.ipl-rating-star--other-user.small > span.ipl-rating-star__rating'),  // User Ratings
    page.$$('div.lister-item-content > p:nth-child(8) > span:nth-child(2)') // Number of Votes
  ]);
}


async function processRecords(ratings) {
  const N = ratings[0].length;
  for (let i = 1; i < ratings.length; i++) {
    assert.equal(N, ratings[i].length, `Mismatch in ${keyOrder[i]}, expected ${N}, got ${ratings[i].length}`);
  }

  const records = [];
  for (let j = 0; j < N; j++) {
    const url = await ratings[0][j].getAttribute('href')
    const txt = await Promise.all(keyOrder.map((_, i) => ratings[i][j].innerText()));

    let m = {};

    keyOrder.forEach((k, i) => {
      m[k] = txt[i];
    });

    m['release_year'] = parseInt(m['range_year'].match(/([0-9]){4}/g)[0], 10);
    m['rating'] = parseFloat(m['rating']);
    m['user_rating'] = parseFloat(m['user_rating']);
    m['votes'] = parseInt(m['votes'].split(',').join(''), 10);
    m['imdbid'] = url.split('/')[2]

    // m['temp1'] = ''
    // m['temp2'] = ''
    // m['temp3'] = ''
    // m['temp4'] = ''

    records.push(m);
  }

  return records;
}


async function generateRecords(page) {
  const rawRatings = await rawRecords(page);
  const ratings = await processRecords(rawRatings);

  const csvWriter = createObjectCsvWriter({header: csvHeader, path: filename, append: true });
  await csvWriter.writeRecords(ratings);

  return true;
}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


(async () => {
  const browser = await webkit.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);

  while (true) {
    await generateRecords(page);

    const nextDisabled = (await (await page.$(nextSelectorPath)).getAttribute('class')).indexOf('disabled') > -1;

    if (nextDisabled) {
      break;
    } else {
      const delay = Math.floor(Math.random() * 5000 + 2000);
      await sleep(delay);

      await page.click(nextSelectorPath);
      await page.waitForSelector(nextSelectorPath);
    }
  }

  await browser.close();
})();
