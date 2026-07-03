/**
 * Add More Mentors Script — 10 new diverse categories
 * Run: node scripts/addMoreMentors.js
 *
 * Categories: Portrait, Abstract, Comic Book, Fashion, Pixel Art,
 * Calligraphy, Caricature, Pastel, Botanical, Architecture
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Mentor = require('../models/Mentor');

const NEW_MENTORS = [
  {
    name: 'Elena Vasquez',
    bio: 'Master portrait artist with exhibitions in Paris, New York, and Tokyo. Trained at the Florence Academy of Art, Elena teaches the classical realism approach to portrait drawing — capturing soul through eyes, light, and shadow. Her students consistently win national portrait competitions.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=ElenaVasquez&backgroundColor=be185d',
    tags: ['portrait', 'pencil sketching', 'realistic drawing', 'figure drawing', 'charcoal art'],
    skills: ['portrait anatomy', 'charcoal shading', 'pencil rendering', 'facial proportions', 'skin tones'],
    teachingCategories: ['Portrait Art', 'Pencil Sketching', 'Realistic Drawing'],
    experience: 17,
    rating: 4.9,
    reviewCount: 521,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://elenavasquez.art' },
  },
  {
    name: 'Theo Nakashima',
    bio: 'Abstract expressionist and installation artist whose large-scale murals have been displayed in galleries across Europe and Asia. Theo teaches the language of color, emotion, and spontaneous mark-making — helping artists unlock total creative freedom beyond rules.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=TheoNakashima&backgroundColor=7e22ce',
    tags: ['abstract art', 'expressionism', 'modern art', 'color theory', 'mixed media', 'contemporary'],
    skills: ['acrylic abstraction', 'color blocking', 'texture techniques', 'canvas composition', 'mixed media collage'],
    teachingCategories: ['Abstract Art', 'Modern Art', 'Expressionism'],
    experience: 12,
    rating: 4.7,
    reviewCount: 198,
    socialLinks: { instagram: 'https://instagram.com', twitter: 'https://twitter.com' },
  },
  {
    name: 'Danny Rivera',
    bio: 'Former DC and Marvel comics colorist turned independent creator. Danny has inked and colored over 400 comic book pages professionally. He teaches dynamic panel layouts, superhero anatomy, ink hatching, and the secrets of sequential storytelling that publishers actually want.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=DannyRivera&backgroundColor=1d4ed8',
    tags: ['comic book art', 'superhero', 'manga panels', 'sequential art', 'inking', 'comics'],
    skills: ['panel composition', 'dynamic poses', 'ink hatching', 'speech bubble design', 'color flatting'],
    teachingCategories: ['Comic Art', 'Sequential Art', 'Inking'],
    experience: 15,
    rating: 4.8,
    reviewCount: 344,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://dannyrivera.comics' },
  },
  {
    name: 'Isabella Fontaine',
    bio: 'Renowned fashion illustrator for Vogue, Elle, and Chanel campaigns. Isabella bridges the worlds of high fashion and fine art, teaching the elegant elongated figure, fabric draping, and the distinctive style of runway illustration that lands real commercial clients.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=IsabellaFontaine&backgroundColor=db2777',
    tags: ['fashion illustration', 'runway art', 'figure drawing', 'editorial illustration', 'luxury design'],
    skills: ['fashion figure proportions', 'fabric rendering', 'Copic markers', 'editorial layout', 'fashion sketching'],
    teachingCategories: ['Fashion Illustration', 'Editorial Art', 'Figure Drawing'],
    experience: 11,
    rating: 4.8,
    reviewCount: 267,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://isabellafashionart.com' },
  },
  {
    name: 'Kazu Pixel',
    bio: 'Indie game developer and pixel art legend behind three cult-classic retro games on Steam. Kazu teaches the forgotten art of pixel-perfect sprite creation, 16-bit animation loops, retro color palettes, and building entire game worlds one pixel at a time.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=KazuPixel&backgroundColor=064e3b',
    tags: ['pixel art', 'retro gaming', '8-bit art', '16-bit art', 'sprite design', 'game art', 'indie game'],
    skills: ['sprite animation', 'pixel shading', 'isometric pixel art', 'tileset design', 'Aseprite'],
    teachingCategories: ['Pixel Art', 'Game Art', 'Retro Animation'],
    experience: 9,
    rating: 4.9,
    reviewCount: 412,
    socialLinks: { youtube: 'https://youtube.com', website: 'https://kazupixel.itch.io' },
  },
  {
    name: 'Amara Osei',
    bio: 'Master calligrapher and hand lettering artist who fuses West African Adinkra symbols with modern typography. Amara\'s work has appeared in Nike and Google campaigns. She teaches brush pen calligraphy, modern lettering composition, and building a signature typographic style.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=AmaraOsei&backgroundColor=92400e',
    tags: ['calligraphy', 'hand lettering', 'typography', 'brush pen', 'lettering art', 'script writing'],
    skills: ['brush lettering', 'pointed pen calligraphy', 'Procreate lettering', 'composition', 'flourishing'],
    teachingCategories: ['Calligraphy', 'Hand Lettering', 'Typography'],
    experience: 8,
    rating: 4.8,
    reviewCount: 289,
    socialLinks: { instagram: 'https://instagram.com', youtube: 'https://youtube.com' },
  },
  {
    name: 'Pete "Sketch" Morales',
    bio: 'Professional caricaturist who has sketched celebrities at red carpets and worked with Disney\'s character experience team. Pete teaches the art of exaggeration — how to find the essence of a face, amplify it perfectly, and create cartoon characters that are both recognizable and hilarious.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=PeteMorales&backgroundColor=d97706',
    tags: ['caricature', 'cartoon art', 'character design', 'exaggeration', 'humour illustration', 'editorial cartoon'],
    skills: ['face exaggeration', 'quick sketching', 'digital caricature', 'cartoon shading', 'expression design'],
    teachingCategories: ['Caricature', 'Cartoon Art', 'Character Design'],
    experience: 14,
    rating: 4.7,
    reviewCount: 176,
    socialLinks: { instagram: 'https://instagram.com', twitter: 'https://twitter.com' },
  },
  {
    name: 'Sophie Beaumont',
    bio: 'Soft pastel and gouache artist specializing in dreamy impressionist landscapes and floral still life. Sophie\'s work evokes warmth, nostalgia, and painterly softness. She teaches light color harmony, layering soft pastels, and building luminous paintings that feel like memories.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=SophieBeaumont&backgroundColor=9d174d',
    tags: ['pastel art', 'gouache', 'impressionism', 'landscape painting', 'floral art', 'soft art', 'still life'],
    skills: ['soft pastel blending', 'gouache painting', 'color harmony', 'floral composition', 'light and atmosphere'],
    teachingCategories: ['Pastel Art', 'Gouache', 'Impressionism'],
    experience: 10,
    rating: 4.8,
    reviewCount: 231,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://sophiebaumont.art' },
  },
  {
    name: 'Dr. Nadia Green',
    bio: 'Botanical illustrator for the Royal Botanic Gardens Kew and published author of two scientific illustration books. Nadia teaches hyper-accurate nature illustration using traditional ink and watercolor — perfect for artists who love detail, science, and the natural world.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=NadiaGreen&backgroundColor=166534',
    tags: ['botanical illustration', 'nature art', 'scientific illustration', 'plants', 'floral', 'ink drawing'],
    skills: ['stippling', 'ink line work', 'watercolor layering', 'plant anatomy', 'scientific accuracy'],
    teachingCategories: ['Botanical Art', 'Scientific Illustration', 'Nature Drawing'],
    experience: 19,
    rating: 4.9,
    reviewCount: 308,
    socialLinks: { website: 'https://botanicalkew.com', instagram: 'https://instagram.com' },
  },
  {
    name: 'Marco Stellini',
    bio: 'Architectural visualizer and urban sketcher who has worked on landmark projects across Italy, UAE, and Singapore. Marco teaches perspective drawing, architectural rendering, and the romantic tradition of urban sketching — capturing cities in ink and watercolor on location.',
    profileImage: 'https://api.dicebear.com/9.x/personas/svg?seed=MarcoStellini&backgroundColor=1e40af',
    tags: ['architecture art', 'perspective drawing', 'urban sketching', 'architectural rendering', 'technical drawing'],
    skills: ['1 & 2 point perspective', 'architectural line work', 'urban sketching', 'ink wash', '3D rendering basics'],
    teachingCategories: ['Architecture Art', 'Perspective Drawing', 'Urban Sketching'],
    experience: 16,
    rating: 4.8,
    reviewCount: 195,
    socialLinks: { instagram: 'https://instagram.com', website: 'https://stelliniarchitecture.com' },
  },
];

async function addMentors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let added = 0;
    let skipped = 0;

    for (const mentorData of NEW_MENTORS) {
      const exists = await Mentor.findOne({ name: mentorData.name });
      if (exists) {
        console.log(`⏭️  Skipping "${mentorData.name}" — already exists`);
        skipped++;
        continue;
      }
      await Mentor.create(mentorData);
      console.log(`🌱 Added: ${mentorData.name} (${mentorData.teachingCategories[0]})`);
      added++;
    }

    const total = await Mentor.countDocuments();
    console.log(`\n✅ Done! Added: ${added} | Skipped: ${skipped} | Total mentors in DB: ${total}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  }
}

addMentors();
