import 'dotenv/config';

import {
  addOrdinalSuffix,
  deleteAllFilesInDirectory,
  downloadFile,
} from './helpers';

import { chromium } from 'playwright';
import fs from 'fs';

const email = process.env.EMAIL;
const pnpPass = process.env.PNP_PASSWORD;
const lightPhonePass = process.env.LIGHT_PHONE_PASSWORD;

(async () => {
  deleteAllFilesInDirectory('./mp3s');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const mp3Urls = new Set();

  page.on('request', (request) => {
    const requestUrl = request.url();
    if (requestUrl.includes('ott') && requestUrl.includes('mp3')) {
      mp3Urls.add(requestUrl);
    }
  });

  const enterEmail = async () => {
    await page.getByLabel('Email').click();
    await page.getByLabel('Email').fill(email ?? '');
    await page.getByRole('button', { name: 'Sign In' }).click();
  };

  const monthsOfYear = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currDate = new Date();

  const lookupDate = `${monthsOfYear[currDate.getMonth()]}-${addOrdinalSuffix(
    currDate.getDate()
  )}`;

  await page.goto(`https://app.patristicnectar.org/discover/${lookupDate}`);
  await page.getByRole('button', { name: '' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Sign InOr RegisterAll$/ })
    .getByRole('button')
    .first()
    .click();
  await page.getByRole('link', { name: '« Back to Login' }).click();
  await enterEmail();
  const count = await page.getByLabel('Password').count();
  if (count === 0) await enterEmail();
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill(pnpPass ?? '');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: '' }).nth(1).click();

  // get download links
  let itemsRemaining = true;
  let x = 2;
  while (itemsRemaining) {
    const currItem = page.getByRole('button', { name: '' }).nth(x);
    if (await currItem.isVisible()) {
      currItem.click();
    } else {
      itemsRemaining = false;
    }
    x++;
  }

  let finishedGettingUrls = mp3Urls.size === x - 2;
  while (!finishedGettingUrls) {
    finishedGettingUrls = mp3Urls.size === x - 2;
    await page.waitForTimeout(1000);
  }

  for (const url of mp3Urls) {
    const u = url as string;
    await downloadFile(u, './mp3s');
  }
  const fileNames = fs.readdirSync('./mp3s');

  page.on('filechooser', async (fileChooser) => {
    await fileChooser.setFiles([...fileNames.map((fn) => `./mp3s/${fn}`)]);
  });

  await page.goto('https://dashboard.thelightphone.com/login');
  await page.getByLabel('Email').click();
  await page.getByLabel('Email').fill(email ?? '');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill(lightPhonePass ?? '');
  await page.getByText('Log in').click();
  await page.getByRole('link', { name: 'Phone' }).click();
  await page.getByText('+1 562 321').click();
  await page.getByText('Toolbox').click();
  await page.getByRole('link', { name: 'Music' }).click();
  // await page.getByRole('link', { name: 'Edit playlist' }).click();
  // await page.getByRole('link', { name: 'back button' }).click();
  await page.getByRole('link', { name: 'Add songs' }).click();
  await page.getByText('Click here or drag + drop').click();
  // await page.locator('body').setInputFiles([...fileNames.map(fn => `./mp3s/${fn}`)]);
  await page.getByRole('button', { name: 'upload songs' }).click();

  await page.waitForTimeout(3000);
  // await page.getByRole('link', { name: 'back button' }).click();
  // await page.getByRole('link', { name: 'Edit playlist' }).click();
  // await page
  //   .locator('#ember1091')
  //   .getByRole('button', { name: 'remove playlist item' })
  //   .click();
  // await page
  //   .locator('#ember1098')
  //   .getByRole('button', { name: 'remove playlist item' })
  //   .click();
  // await page
  //   .locator('#ember1105')
  //   .getByRole('button', { name: 'remove playlist item' })
  //   .click();

  await context.close();
  await browser.close();
})();
