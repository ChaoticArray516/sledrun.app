import type { PageContent } from './types';

export const home: PageContent = {
  path: '/',
  mode: 'home',
  gameName: 'Sled Rider 3D',
  title: 'Sled Rider 3D – Play Free Snow Sledding Game Online',
  description: 'Play Sled Rider 3D free online. An original 3D snow sledding game with touch and keyboard controls, no download and no signup. Free on any device.',
  lead: 'Sled Rider 3D is a free 3D sledding game you play right in the browser — steer a sled down an endless snow run, dodge trees and rocks, and collect gifts for extra points.',
  sections: [
    { heading: 'How to Play Sled Rider 3D', paragraphs: [[
      { text: 'Once the slope loads, press Play to start the run. Hold the left or right half of the screen to lean that way, and swipe up to hop over a low rock or a fallen log. On a keyboard, the arrow keys or A and D do the steering, and the space bar jumps. There is nothing to install and only one Play button between you and the slope. If you clip a tree or a rock, the run ends, the distance you covered is checked against your best, and the slope resets in about a second. A single run usually lasts anywhere from ten seconds to a couple of minutes, depending on how long you keep a clean line.' },
    ]] },
    { heading: 'Keyboard and Touch Controls', paragraphs: [[
      { text: 'Touch and keyboard are both first-class here, not a fallback. On a phone the screen is split down the middle: press and hold the left side to steer left, the right side to steer right, and lift your thumb to stop turning. A short upward swipe anywhere on the canvas jumps. On a laptop, use the arrow keys or A and D, tap the space bar to jump, and press R to restart. The canvas fills the full height of the screen, including the strip under the browser toolbar on iOS, so the controls never end up under a notch or a home bar.' },
    ]] },
    { heading: 'Distance, Score and Gifts', paragraphs: [[
      { text: 'Distance is the backbone of the score: every metre you survive adds to it, and the sled gets faster the longer you stay upright. Gifts are scattered along the slope and each one adds a flat bonus, so a slightly riskier line that collects three gifts usually beats a careful line that collects none. The trade is obvious — gifts sit near trees and rocks. Your best distance and best score are stored on the device you play on rather than on a server, which means the record survives a closed tab but not a cleared browser cache.' },
    ]] },
    { heading: 'Tips to Ride Further', paragraphs: [[
      { text: 'Three habits carry most runs. First, ride the middle of the slope: trees crowd the edges, and the middle leaves room to correct. Second, look at the top of the screen rather than at the sled — by the time an obstacle reaches the sled, the decision is already too late. Third, start turning before you need to. Once the sled is moving fast, a late turn is a wide turn, and a wide turn is a tree. Gifts are worth chasing only when the path to them is already clear. When you want a steeper drop with jumps and gates, the ' },
      { text: 'downhill sledding game', href: '/3d-sledding' },
      { text: ' page is the place to start.' },
    ]] },
    { heading: 'Play More Sledding Games', paragraphs: [[
      { text: 'There are two more runs on this site, and both play in the browser with no install. ' },
      { text: 'Snow Road 3D', href: '/snow-road' },
      { text: ' squeezes the slope into one icy lane with a denser field of obstacles, while ' },
      { text: '3D Sledding', href: '/3d-sledding' },
      { text: ' trades the flat run for a steep drop, jumps and flag gates. Pick the ' },
      { text: 'narrow snow road game', href: '/snow-road' },
      { text: ' when you want precision; pick the downhill page when you want airtime.' },
    ]] },
  ],
  faqHeading: 'Sled Rider 3D FAQ',
  faqs: [
    { question: 'Is Sled Rider 3D really free to play?', answer: [{ text: 'Yes. The whole game loads in the browser and there is no paid version, no locked slope and no upgrade screen. You are never asked for a card or an email. Play as often as you like.' }] },
    { question: 'Do I need to download anything or create an account?', answer: [{ text: 'No download and no account. There is no signup, no email confirmation and no password to remember. Your best distance, best score and gift count are saved in the browser you play in, so they survive closing the tab, and they disappear if you clear your browser data.' }] },
    { question: 'Does Sled Rider 3D work on phones and tablets?', answer: [{ text: 'Yes. The game fills the full height of the screen on phones, including the strip under the browser toolbar on iOS, and it is built for current versions of the major browsers. Steering is a hold on the left or right half of the screen and a swipe up to jump.' }] },
    { question: 'Can I play at school or at work?', answer: [{ text: "The game runs in a modern browser and does not require a download, but whether it opens on a school or workplace network depends on that network's own rules. We do not offer anything designed to get around filters, and we would rather you play somewhere the game is allowed." }] },
    { question: 'How do I beat my best distance?', answer: [{ text: 'Ride the middle of the slope, look at the top of the screen instead of at the sled, and start each turn before you need to. Gifts are only worth a detour when the path to them is already clear. Your best distance is shown on the score bar and is stored in this browser.' }] },
  ],
};
