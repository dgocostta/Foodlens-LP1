// Cinematic food video defaults — Pexels & Mixkit free stock
// (Admin can override these in /admin → Media Management)
// Pexels URLs use the public videos CDN; Mixkit uses asset CDN.
// All curated as food/beverage content for the Cinema Menu demo.
export const DEFAULT_DISHES = [
  {
    id: 'd1',
    name: 'Sizzling Ribeye',
    price: '€48',
    tag: "Chef's Pick",
    desc: 'Dry-aged 35 days. Cast-iron seared. Smoked sea salt, charred shallot, pan jus.',
    video: 'https://videos.pexels.com/video-files/4253011/4253011-hd_1920_1080_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962fd?w=800&q=80',
  },
  {
    id: 'd2',
    name: 'Truffle Pappardelle',
    price: '€28',
    tag: 'Fine Dining',
    desc: 'Hand-rolled ribbons, 24-month parmesan, fresh black truffle shavings.',
    video: 'https://videos.pexels.com/video-files/3296279/3296279-hd_1920_1080_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
  },
  {
    id: 'd3',
    name: 'Sommelier Pour',
    price: '€14',
    tag: 'Pairing',
    desc: 'Hand-picked Tuscan red. Decanted at the table. Served at 17°C.',
    video: 'https://videos.pexels.com/video-files/2620043/2620043-hd_1920_1080_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  },
  {
    id: 'd4',
    name: 'Bistro Margherita',
    price: '€16',
    tag: 'House Favorite',
    desc: '72-hour dough, San Marzano tomato, buffalo mozzarella, garden basil.',
    video: 'https://videos.pexels.com/video-files/4252093/4252093-hd_1920_1080_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  },
  {
    id: 'd5',
    name: 'Molten Chocolate',
    price: '€12',
    tag: 'Dessert',
    desc: 'Dark Valrhona core, sea-salt caramel, vanilla bean gelato.',
    video: 'https://videos.pexels.com/video-files/3296278/3296278-hd_1920_1080_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
  },
]

// Kept for backward compatibility with any older imports
export const DEMO_DISHES = DEFAULT_DISHES

// Dedicated media for the pitch deck's "Solution" slide — independent of the homepage dishes.
export const DEFAULT_DECK = {
  name: 'Truffle Pappardelle',
  price: '€24',
  tag: "Chef's Pick",
  desc: 'Hand-rolled ribbons, 24-month parmesan, fresh black truffle.',
  video: 'https://videos.pexels.com/video-files/3296279/3296279-hd_1920_1080_25fps.mp4',
  poster: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
}
