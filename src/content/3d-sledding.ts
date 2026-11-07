import type { PageContent } from './types';

export const sledding: PageContent = {
  path: '/3d-sledding',
  mode: 'sledding',
  gameName: '3D Sledding',
  title: '3D Sledding – Play Free Downhill Sledding Game Online',
  description: 'Play 3D Sledding free online. Ride a sled downhill through trees and jumps, chain combos and beat your best distance. Touch and keyboard ready.',
  lead: '3D Sledding is the downhill run: steeper slopes, bigger jumps and flag gates, and a combo counter that rewards clean lines.',
  sections: [
    { heading: 'How to Play 3D Sledding', paragraphs: [[
      { text: 'This is the downhill version of the full ' },
      { text: 'Sled Rider 3D', href: '/' },
      { text: ' game. You drop in from the top of a steep slope instead of settling into a flat run, so the sled is fast from the first second and keeps accelerating until you either land cleanly or lose it. Hold the left or right half of the screen to lean, swipe up to jump, and use arrows or A and D plus the space bar on a keyboard. Passing through a flag gate cleanly adds to a combo counter; crashing into a gate post, a tree or a rock ends the run. Jumps are the main decision: they give you speed and airtime, but landing while still leaning is how most runs end. Your best distance is saved in this browser.' },
    ]] },
    { heading: 'Jumps, Flag Gates and Combo Scoring', paragraphs: [[
      { text: 'Three things decide a good run here, and they pull against each other. Jumps give speed, and a clean landing keeps it, but a jump taken at the wrong angle lands you off line. Flag gates sit in pairs and are worth more when you pass through the middle rather than clipping a post. The combo counter rises with each clean gate and each clean landing, and it resets the moment you touch something, which makes a cautious line worth less than a fast one that keeps the multiplier alive. A landing after more than half a second in the air adds a flat bonus. The practical trade: take gates that sit on your line, skip the ones that demand a hard correction, and keep the combo running rather than collecting one big score early.' },
    ]] },
    { heading: 'Choosing Your Line on a Steep Slope', paragraphs: [[
      { text: 'On a steep drop the inside line is shorter, and the outside line is safer — that is the whole decision. Hitting the inside of a bend costs less time but leaves almost no room to correct, so it only works when the next obstacle is already visible. When trees block the inside, drift to the outside early and accept the extra distance; you will arrive at the next gate at a better angle anyway. Do not chase every gate. Two clean gates with the combo alive beat four clipped ones that reset it.' },
    ]] },
    { heading: 'More 3D Sledding Games', paragraphs: [[
      { text: 'Two other runs use the same controls with a different feel. ' },
      { text: 'Snow Road 3D', href: '/snow-road' },
      { text: ' puts the sled on a single icy lane with a much denser field of hazards. The open-slope game on the home page is the gentlest place to learn the controls.' },
    ]] },
  ],
  faqHeading: '3D Sledding FAQ',
  faqs: [
    { question: 'What is a downhill sledding game?', answer: [{ text: 'A downhill sledding game is built around gravity rather than an endless flat run: you start at the top of a slope, speed builds as you drop, and the decisions are about line, airtime and landing. This page follows that model, with jumps, flag gates and a steep drop from the first second.' }] },
    { question: 'How does the combo scoring work in 3D Sledding?', answer: [{ text: 'Every clean flag gate and every clean landing raises the combo counter, and the counter multiplies the points you earn. Touching a tree, a rock or a gate post resets it to zero. That is why a fast line that keeps the counter alive scores more than a slow line that collects gates one at a time.' }] },
    { question: 'Is 3D Sledding the same as the sled riding game on the home page?', answer: [
      { text: 'No. The ' },
      { text: 'sled riding game', href: '/' },
      { text: ' on the home page is an endless run across a wide slope, and its score is built from distance and gifts. This page starts at the top of a steep hill, and its score is built from flag gates, landings and a combo multiplier that resets when you touch anything. The two runs share the controls and nothing else, and your records are saved separately for each one.' },
    ] },
    { question: 'Does 3D Sledding work offline?', answer: [{ text: 'No. There is no offline mode and no installable app. You need a connection to open the page and load the game files. Your best distance is stored in the browser, so it is still there the next time you open the page with a connection.' }] },
  ],
};
