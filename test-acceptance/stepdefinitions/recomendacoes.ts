import {defineSupportCode} from 'cucumber';
import {$, browser, by, element, ElementArrayFinder} from 'protractor';

let chai = require('chai').use(require('chai-as-promised'));
let expect = chai.expect;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPlaylistCardByName(name) {
  const playlistCard = await element.all(by.name('playlist-card'))
                           .filter(
                               p => p.element(by.css('.card-title'))
                                        .getText()
                                        .then(text => text === name))
                           .first();
  return playlistCard;
}

async function changeButton(name) {
  const button = await getPlayButton(name);
  await browser.actions().mouseMove(button).perform();
  await browser.executeScript('arguments[0].click()', button.getWebElement());
}

async function getPlayButton(name) {
  const playlistCard = await getPlaylistCardByName(name);
  await browser.actions().mouseMove(playlistCard).perform();
  const overlay = await playlistCard.element(by.name('overlay'));
  await browser.actions().mouseMove(overlay).perform();
  const playButton = playlistCard.element(by.name('play-button'));
  return playButton;
}

async function buttonIsPlaying(name) {
  const playButton = await getPlayButton(name);
  const classList = await playButton.getAttribute('class');
  const playing = await classList.includes('playing');
  return playing;
}

async function getIcon(name, iconName) {
  const playlistCard = await getPlaylistCardByName(name);
  await browser.actions().mouseMove(playlistCard).perform();
  const optionsIcon = playlistCard.element(by.name('options-button'));
  await browser.actions().mouseMove(optionsIcon).perform();
  const icon = playlistCard.element(by.name(iconName));
  await browser.actions().mouseMove(icon).perform();
  return icon;
}

defineSupportCode(function({Given, When, Then}) {
  Given(/^I'm on the page "([^\"]*)"$/, async (name) => {
    await browser.get('http://localhost:4200/' + name.toString().toLowerCase());
    await expect(browser.getTitle()).to.eventually.equal(name.toString());
  });

  Given(/^a playlist "([^\"]*)" appears as recommended$/, async (name) => {
    const allplaylists: ElementArrayFinder = element.all(by.name('nome'));
    const playlist =
        await allplaylists.filter(p => p.getText().then(text => text === name));
    expect(await playlist.length).to.equal(1);
  })

  Given(
      /^the play-button of playlist "([^\"]*)" is a play button$/,
      async (name) => {
        const playingBeforeClick = await buttonIsPlaying(name);
        if (!playingBeforeClick) await changeButton(name);
        const playingAfterClick = await buttonIsPlaying(name);
        await expect(playingAfterClick).to.be.true;
      });


  Given(
      /^the play-button of playlist "([^\"]*)" is a pause button$/,
      async (name) => {
        const playingBeforeClick = await buttonIsPlaying(name);
        if (playingBeforeClick) await changeButton(name);
        const playingAfterClick = await buttonIsPlaying(name);
        await expect(playingAfterClick).to.be.false;
      })

  Given(
      /^I don't have the playlist "([^\"]*)" saved in my liked playlists$/,
      async (name) => {
        await browser.get('http://localhost:4200/minhas_playlists');
        const likedPlaylistDiv = await element(by.name('likedPlaylistsDiv'));
        const playlistCard =
            await likedPlaylistDiv.all(by.name('playlist-card'))
                .filter(
                    p => p.element(by.css('.card-title'))
                             .getText()
                             .then(text => text === name));
        await expect(await playlistCard.length).to.be.equal(0);
        await browser.get('http://localhost:4200/explorar');
      });

  When(/^I try to enter the playlist page "([^\"]*)"$/, async (name) => {
    const allplaylists = element.all(by.name('nome'));
    const playlist =
        await allplaylists.filter(p => p.getText().then(text => text === name))
            .first();
    await browser.executeScript(
        'arguments[0].click()', playlist.getWebElement());
  })

  When(
      /^I try to see the options of the playlist "([^\"]*)"$/, async (name) => {
        const playlistCard = await getPlaylistCardByName(name);
        await browser.actions().mouseMove(playlistCard).perform();
        const overlay = await playlistCard.element(by.name('overlay'));
        await browser.actions().mouseMove(overlay).perform();
      })

  When(/^I try to see the play of the playlist "([^\"]*)"$/, async (name) => {
    const playlistCard = await getPlaylistCardByName(name);
    const overlay = playlistCard.element(by.name('overlay'));
    await browser.actions().mouseMove(overlay).perform();
  })

  When(/^I try to share the playlist "([^\"]*)"$/, async (name) => {
    const shareIcon = await getIcon(name, 'Share');
    await browser.executeScript(
        'arguments[0].click()', shareIcon.getWebElement());
  })

  When(/^I try to like the playlist "([^\"]*)"$/, async (name) => {
    const likeIcon = await getIcon(name, 'Like');
    await browser.executeScript(
        'arguments[0].click()', likeIcon.getWebElement());
  })

  When(/^I click on the play-button of playlist "([^\"]*)"$/, async (name) => {
    await changeButton(name);
  })

  Then(/^I'm on the playlist page "([^\"]*)"$/, async (name) => {
    const playlistname = element.all(by.name('playlist-name'));
    const names = await playlistname.getText();
    expect(names).to.include(name);
  })

  Then(
      /^I see next to the playlist "([^\"]*)" the options "([^\"]*)", "([^\"]*)", "([^\"]*)"$/,
      async (name, op1, op2, op3) => {
        const playlistCard = await getPlaylistCardByName(name);
        const options = await playlistCard.all(by.css('.option'))
        const optionsmapped = await Promise.all(
            options.map(option => option.getAttribute('name')));
        const expectedOptions = [op1, op2, op3];

        for (const option of expectedOptions) {
          expect(optionsmapped).to.include(option);
        }
      });

  Then(
      /^the system shows a confirmation message that the link to the playlist "([^\"]*)" has been copied$/,
      async (name) => {
        const playlistCard = await getPlaylistCardByName(name);
        const confirmationMessage =
            await playlistCard.element(by.name('share-message'));
        expect(await confirmationMessage.isDisplayed()).to.be.true;
      });

  Then(
      /^the system shows a confirmation message that the playlist "([^\"]*)" was liked$/,
      async (name) => {
        const playlistCard = await getPlaylistCardByName(name);
        const confirmationMessage =
            await playlistCard.element(by.name('liked-message'));
        expect(await confirmationMessage.isDisplayed()).to.be.true;
      });

  Then(
      /^I see at least "([^\"]*)" recommended playlists$/,
      async (numberPlaylists) => {
        const playlists = await element.all(by.name('playlist-card'));
        const numberOfPlaylists = await playlists.length;
        expect(numberOfPlaylists)
            .to.be.at.least(parseInt(numberPlaylists.toString()));
      });

  Then(/^I'm still on the page "([^\"]*)"$/, async (name) => {
    await browser.get('http://localhost:4200/' + name.toString().toLowerCase());
    await expect(browser.getTitle()).to.eventually.equal(name.toString());
  });

  Then(/^I see the play of the playlist "([^\"]*)"$/, async (name) => {
    const button = await getPlayButton(name);
    await expect(await button.isDisplayed()).to.be.true;
  });

  Then(
      /^I see that the play-button of playlist "([^\"]*)" is a pause button$/,
      async (name) => {
        const playing = await buttonIsPlaying(name);
        await expect(playing).to.be.false;
      });

  Then(
      /^I see that the play-button of playlist "([^\"]*)" is a play button$/,
      async (name) => {
        const playing = await buttonIsPlaying(name);
        await expect(playing).to.be.true;
      });

  Then(
      /^the system has the playlist "([^\"]*)" saved in my liked playlists$/,
      async (name) => {
        await browser.get('http://localhost:4200/minhas_playlists');
        const likedPlaylistDiv = await element(by.name('likedPlaylistsDiv'));
        const playlistCard =
            await likedPlaylistDiv.all(by.name('playlist-card'))
                .filter(
                    p => p.element(by.css('.card-title'))
                             .getText()
                             .then(text => text === name))
                .first();
        await expect(await playlistCard.isDisplayed()).to.be.true;
      });
})