export interface TextSegment {
  text: string;
  href?: '/' | '/snow-road' | '/3d-sledding';
}

export interface ContentSection {
  heading: string;
  paragraphs: TextSegment[][];
}

export interface FaqItem {
  question: string;
  answer: TextSegment[];
}

export interface PageContent {
  path: '/' | '/snow-road' | '/3d-sledding';
  mode: 'home' | 'snowRoad' | 'sledding';
  gameName: 'Sled Rider 3D' | 'Snow Road 3D' | '3D Sledding';
  title: string;
  description: string;
  lead: string;
  sections: ContentSection[];
  faqHeading: string;
  faqs: FaqItem[];
}

export function plainText(segments: TextSegment[]): string {
  return segments.map((segment) => segment.text).join('');
}
