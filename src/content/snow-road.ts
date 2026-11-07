import type { PageContent } from './types';

export const snowRoad: PageContent = {
  path: '/snow-road',
  mode: 'snowRoad',
  gameName: 'Snow Road 3D',
  title: 'Snow Road 3D – Play the Free Snow Road Driving Game Online',
  description: 'Play Snow Road 3D free online. Steer your sled down a narrow icy road, dodge obstacles and set a new distance record on phone or desktop.',
  lead: 'Snow Road 3D puts your sled on a narrow icy road: one wrong line and you are off the edge, so read the bends early and keep your speed under control.',
  sections: [
    { heading: 'How to Play Snow Road 3D', paragraphs: [[
      { text: 'In the full ' },
      { text: 'Sled Rider 3D', href: '/' },
      { text: ' run the slope is wide and the trees are the danger; here the road itself is the danger. You start already moving, the lane is barely wider than the sled, and there is no second lane to recover into. Hold the left or right half of the screen to lean, and swipe up to hop a fallen log. A keyboard works the same way: arrows or A and D to steer, space to jump, R to restart. Anything that touches the sled — a tree, a rock, the wooden edge markers — ends the run, and the distance you reached is compared with the record saved in this browser. Runs here are shorter than on the open slope, often under thirty seconds, because the road forgives very little.' },
    ]] },
    { heading: 'Road Hazards and Obstacle Patterns', paragraphs: [[
      { text: 'Hazards arrive in three shapes, and once you recognise them the road stops feeling random. Single trees sit close to one edge and leave a clear gap on the other side. Rock clusters spread across the middle and force you to commit to an edge early rather than late. Log stacks come with a jump ramp in front of them, so the answer is to hop instead of steer. The road also narrows in stages rather than all at once, which gives you a short stretch of straight ice to line the sled up again. Memorising the order takes a few runs; after that the page turns into a rhythm game.' },
    ]] },
    { heading: 'Controls and Speed Management', paragraphs: [[
      { text: 'Every input costs speed. A small lean keeps most of your momentum and shifts the sled a little; a long hold scrubs speed off quickly and leaves you slow exactly when you want to be fast. The habit that saves runs is a series of short taps instead of one long press, aiming to be straight again before the next bend arrives. Jumping is cheaper than steering when a log is in the way, and landing straight keeps your speed, while landing while still leaning bleeds it away. A clean stretch between hazards counts as a perfect section and adds a small bonus, so a smooth line is worth more than a frantic one. Watch the road ahead rather than the sled.' },
    ]] },
    { heading: 'More 3D Sledding Games', paragraphs: [[
      { text: 'Two other runs share the controls but not the feel. ' },
      { text: '3D Sledding', href: '/3d-sledding' },
      { text: ' is the steep downhill option, with jumps, flag gates and a combo counter. The open-slope game on the home page is the easiest of the three. Card links to both sit at the foot of this page.' },
    ]] },
  ],
  faqHeading: 'Snow Road 3D FAQ',
  faqs: [
    { question: 'What makes Snow Road 3D different from the sled game on the home page?', answer: [{ text: 'The lane. On the open slope you can drift wide and recover; here the road is barely wider than the sled, the obstacle field is denser, and the speed curve climbs faster. Runs are shorter and more about precision than about collecting gifts.' }] },
    { question: 'How do I avoid hitting the trees on the icy road?', answer: [{ text: 'Read the bend before you reach it and correct with short taps instead of one long hold. Long holds scrub your speed and leave you slow in the middle of a turn. When a log sits in your lane, jump rather than steer, and land straight so you keep your momentum.' }] },
    { question: 'Is there a distance record on this page?', answer: [{ text: 'Yes, and it is kept separately from the record on the home page, so a good snow road run does not overwrite your open-slope best. The record is stored in this browser rather than on a server, so it stays with this device and this browser only.' }] },
    { question: 'Can I play Snow Road 3D with a keyboard?', answer: [{ text: 'Yes. Arrows or A and D steer, the space bar jumps and R restarts after a crash. Keyboard and touch share the same physics, so a line that works with keys works with a thumb, and you can switch between them mid-session without reloading.' }] },
  ],
};
