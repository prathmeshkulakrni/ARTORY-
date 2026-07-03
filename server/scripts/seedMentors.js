/**
 * Mentor Seed Script
 * Run: node scripts/seedMentors.js
 *
 * Seeds 10 diverse mentor profiles to power the AI recommendation demo.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Mentor = require('../models/Mentor');

const MENTORS = [
  {
    name: 'Alex Kim',
    bio: 'Professional anime and manga artist with 8+ years creating characters for indie games and webtoons. Specializes in dynamic poses, expressive faces, and the iconic anime aesthetic. My students consistently land illustration jobs within 6 months.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=AlexKim&backgroundColor=6366f1',
    tags: ['anime', 'manga', 'character design', 'webtoon', 'illustration'],
    skills: ['digital sketching', 'line art', 'character turnaround', 'expression sheets', 'Clip Studio Paint'],
    teachingCategories: ['Digital Art', 'Character Design', 'Anime & Manga'],
    experience: 8,
    rating: 4.9,
    reviewCount: 312,
    socialLinks: { instagram: 'https://instagram.com', youtube: 'https://youtube.com' },
  },
  {
    name: 'Sora Nakamura',
    bio: 'Cyberpunk and sci-fi concept artist who has worked on AAA video games and Netflix originals. Master of neon-drenched cityscapes, futuristic UI design, and dark digital aesthetics. I teach world-building through visual storytelling.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=SoraNakamura&backgroundColor=7c3aed',
    tags: ['cyberpunk', 'sci-fi', 'concept art', 'dark digital art', 'neon', 'futuristic', 'ui design'],
    skills: ['environment design', 'matte painting', 'photobashing', 'Photoshop', 'Blender'],
    teachingCategories: ['Concept Art', 'Environment Design', 'Game Art'],
    experience: 11,
    rating: 4.8,
    reviewCount: 208,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://artstation.com' },
  },
  {
    name: 'Mei Lin',
    bio: 'Award-winning watercolor artist blending traditional Chinese ink techniques with contemporary illustration. My dreamy, atmospheric landscapes have been featured in international art magazines and published book covers.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=MeiLin&backgroundColor=ec4899',
    tags: ['watercolor', 'traditional art', 'landscape', 'ink', 'chinese art', 'illustration'],
    skills: ['wet-on-wet watercolor', 'ink wash', 'composition', 'color mixing', 'botanical illustration'],
    teachingCategories: ['Traditional Art', 'Watercolor', 'Illustration'],
    experience: 14,
    rating: 4.9,
    reviewCount: 445,
    socialLinks: { instagram: 'https://instagram.com', youtube: 'https://youtube.com' },
  },
  {
    name: 'Carlos Vega',
    bio: 'Oil painting master and gallery exhibitor across Europe and Latin America. Expert in classical realism, portrait painting, and still life. My structured atelier-style approach takes absolute beginners to gallery-ready artists.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=CarlosVega&backgroundColor=d97706',
    tags: ['oil painting', 'classical art', 'realism', 'portrait', 'still life', 'atelier'],
    skills: ['glazing', 'impasto', 'value painting', 'color theory', 'classical drawing'],
    teachingCategories: ['Traditional Art', 'Oil Painting', 'Realism'],
    experience: 20,
    rating: 4.7,
    reviewCount: 189,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://carlosvega.art' },
  },
  {
    name: 'Zara Ahmed',
    bio: 'Digital illustrator and brand identity designer specializing in bold, geometric, and minimalist design. I help creatives build profitable design businesses while developing a distinctive visual voice that stands out in crowded markets.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=ZaraAhmed&backgroundColor=059669',
    tags: ['digital design', 'minimalism', 'geometric art', 'brand identity', 'graphic design', 'ui design'],
    skills: ['vector illustration', 'Adobe Illustrator', 'brand design', 'typography', 'logo design'],
    teachingCategories: ['Graphic Design', 'Digital Art', 'Brand Design'],
    experience: 7,
    rating: 4.8,
    reviewCount: 267,
    socialLinks: { instagram: 'https://instagram.com', twitter: 'https://twitter.com' },
  },
  {
    name: 'Ryu Tanaka',
    bio: 'Former senior character artist at a major Japanese game studio, now teaching full-time. I specialize in 3D character modeling, stylized game art, and the bridge between 2D concept and 3D execution. Zbrush wizard.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=RyuTanaka&backgroundColor=2563eb',
    tags: ['3d art', 'character design', 'game art', 'stylized', 'zbrush', 'sculpting'],
    skills: ['ZBrush sculpting', 'character rigging', 'texturing', 'Substance Painter', 'Maya'],
    teachingCategories: ['3D Art', 'Character Design', 'Game Art'],
    experience: 13,
    rating: 4.9,
    reviewCount: 356,
    socialLinks: { youtube: 'https://youtube.com', website: 'https://artstation.com' },
  },
  {
    name: 'Priya Sharma',
    bio: 'Children\'s book illustrator and visual development artist with a warm, whimsical style. Published across 12 countries. I teach the art of sequential storytelling, character consistency, and creating illustrations that evoke pure emotion.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=PriyaSharma&backgroundColor=db2777',
    tags: ['children illustration', 'whimsical', 'storybook', 'visual development', 'character design'],
    skills: ['character expression', 'color palettes', 'storyboarding', 'digital painting', 'Procreate'],
    teachingCategories: ['Illustration', 'Visual Development', 'Character Design'],
    experience: 9,
    rating: 4.8,
    reviewCount: 194,
    socialLinks: { instagram: 'https://instagram.com' },
  },
  {
    name: 'Marcus Webb',
    bio: 'Street art legend turned digital creator. Known for bold graffiti-inspired murals and urban art across three continents. I teach the raw energy of street culture applied to digital canvases — typography, color bombing, and urban storytelling.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=MarcusWebb&backgroundColor=dc2626',
    tags: ['street art', 'graffiti', 'urban art', 'typography', 'abstract', 'bold colors'],
    skills: ['lettering', 'mural design', 'Adobe Photoshop', 'color theory', 'composition'],
    teachingCategories: ['Digital Art', 'Illustration', 'Typography'],
    experience: 16,
    rating: 4.6,
    reviewCount: 142,
    socialLinks: { instagram: 'https://instagram.com', twitter: 'https://twitter.com' },
  },
  {
    name: 'Yuki Sato',
    bio: 'Concept artist and creature designer for Hollywood films. Masters the dark fantasy aesthetic — from terrifying monsters to enchanting mythological beings. I\'ll teach you to invent believable creatures with strong silhouettes and anatomy.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=YukiSato&backgroundColor=4c1d95',
    tags: ['creature design', 'dark fantasy', 'concept art', 'monsters', 'mythology', 'horror art'],
    skills: ['creature anatomy', 'silhouette design', 'dark painting', 'Photoshop', 'concept development'],
    teachingCategories: ['Concept Art', 'Character Design', 'Dark Fantasy'],
    experience: 12,
    rating: 4.9,
    reviewCount: 278,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://artstation.com' },
  },
  {
    name: 'Lena Müller',
    bio: 'Fine art photographer and digital photo manipulation artist. Specializes in surrealist compositing, light painting, and turning ordinary photos into extraordinary dreamscapes. Over 200k followers across social platforms.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=LenaMuller&backgroundColor=0891b2',
    tags: ['photography', 'photo manipulation', 'surrealism', 'digital compositing', 'light painting'],
    skills: ['Adobe Photoshop', 'Lightroom', 'compositing', 'color grading', 'creative retouching'],
    teachingCategories: ['Photography', 'Digital Art', 'Photo Manipulation'],
    experience: 10,
    rating: 4.7,
    reviewCount: 231,
    socialLinks: { instagram: 'https://instagram.com', youtube: 'https://youtube.com' },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await Mentor.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  ${existing} mentors already exist. Skipping seed.`);
      console.log('   To re-seed, run: Mentor.deleteMany({}) first.');
    } else {
      const inserted = await Mentor.insertMany(MENTORS);
      console.log(`🌱 Seeded ${inserted.length} mentors successfully!`);
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
