import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, BookOpen, Flame, Compass, Award, TrendingUp, 
  MessageSquare, Plus, Sparkles, Utensils, Thermometer, MapPin, 
  Bookmark, Dna, Send, Check, Loader2, Info, Heart
} from 'lucide-react';
import { supabase } from '../supabase';
import { callOpenRouter } from '../services/openRouterService';

interface RecommendedBottle {
  name: string;
  region: string;
  price: string;
  description: string;
  image: string;
}

interface GrapeData {
  name: string;
  slug: string;
  flag: string;
  badge: string;
  bannerImage: string;
  summary: string;
  history: string;
  originYear: string;
  flavors: string[];
  aromaWheel: { [key: string]: string[] };
  profile: {
    body: number; // out of 5
    acidity: number; // out of 5
    tannins: number; // out of 5
    sweetness: number; // out of 5
  };
  foodPairings: { food: string; description: string; emoji: string }[];
  servingTemp: string;
  regions: { name: string; description: string }[];
  recommendedBottles: RecommendedBottle[];
  similarGrapes: { name: string; slug: string; reason: string }[];
  promptSuggestions: string[];
}

const GRAPES_KNOWLEDGE: Record<string, GrapeData> = {
  'pinotage': {
    name: "Pinotage",
    slug: "pinotage",
    flag: "🇿🇦",
    badge: "South Africa's signature grape",
    bannerImage: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200",
    summary: "Born in 1925 by crossing Pinot Noir and Cinsaut, Pinotage is South Africa's proud signature red grape. It yields deep, complex wines bursting with character, blending wild berries, earthy spices, and structured tannins.",
    history: "Created by Professor Abraham Izak Perold at Stellenbosch University. He wanted to combine the elegant, delicate fruit flavors of Pinot Noir with the robust, heat-loving, disease-resistant qualities of Cinsaut (locally known as Hermitage). The four seeds he planted in his garden became the anchor of South Africa's modern red wine heritage.",
    originYear: "1925",
    flavors: ["Blackberry", "Plum", "Smoky Cedar", "Dark Chocolate", "Rich Tobacco", "Hint of Banana"],
    aromaWheel: {
      "Dark Fruits": ["Blackberry", "Rich Plum", "Dark Cherry"],
      "Earthy & Oak": ["Toasted Cedar", "Leather", "Smoke"],
      "Spices": ["Black Pepper", "Liquorice", "Clove"]
    },
    profile: {
      body: 4.5,
      acidity: 3.5,
      tannins: 4.2,
      sweetness: 1.2
    },
    foodPairings: [
      { food: "Traditional Braai", description: "The charred, smoky profile of grilled meats mirrors Pinotage’s rustic smoke notes perfectly.", emoji: "🔥" },
      { food: "Ostrich & Game Meats", description: "Lean game steaks are elevated by the wine’s robust, wild berry structure.", emoji: "🥩" },
      { food: "Spiced Venison Pie", description: "Baking spices inside pastry pair beautifully with the sweet oak and berry undertones.", emoji: "🥧" }
    ],
    servingTemp: "16-18°C (60-64°F) - slightly cool to emphasize dark berry fruit and mellow the rich smoky undertones.",
    regions: [
      { name: "Stellenbosch", description: "Rich, highly-structured clay-dominant soils yielding long-aging benchmark collector wines." },
      { name: "Swartland", description: "Dry-land bush vines producing rustic, deeply concentrated styles with rich organic spices." },
      { name: "Paarl & Wellington", description: "Warmer valleys bringing out opulent black cherry, chocolate, and ripe round mouthfeel." }
    ],
    recommendedBottles: [
      {
        name: "Kanonkop Pinotage",
        region: "Stellenbosch, South Africa",
        price: "R 550",
        description: "The gold-standard benchmark Pinotage. Elegant oak, wild bramble berry, and outstanding structural cellaring capacity.",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400"
      },
      {
        name: "Diemersfontein Coffee Pinotage",
        region: "Wellington, South Africa",
        price: "R 230",
        description: "The original coffee-style Pinotage. Heavily toasted oak staves develop legendary roasted bean and dark chocolate aromas.",
        image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400"
      },
      {
        name: "Fairview Pinotage",
        region: "Paarl, South Africa",
        price: "R 185",
        description: "A gorgeous, highly approachable entry-point. Rich red berries, hints of baking spice, and smooth, round velvet finish.",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400"
      }
    ],
    similarGrapes: [
      { name: "Syrah / Shiraz", slug: "shiraz", reason: "Shares the bold black-pepper spiciness and robust charred oak appreciation." },
      { name: "Cabernet Sauvignon", slug: "cabernet-sauvignon", reason: "Matches in full black fruit concentration and high age-worthy tannin profile." }
    ],
    promptSuggestions: [
      "Recommend a premium Pinotage under R400",
      "Why does some Pinotage taste like coffee or chocolate?",
      "How long can I cellar a good Stellenbosch Pinotage?"
    ]
  },
  'chenin-blanc': {
    name: "Chenin Blanc",
    slug: "chenin-blanc",
    flag: "🇿🇦",
    badge: "The versatile Cape workhorse",
    bannerImage: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200",
    summary: "South Africa's most widely planted grape, historically called 'Steen'. Known for outstanding versatility, modern Chenin ranges from crisp, mineral-heavy bone-dry styles to deeply immersive, wild-fermented barrel white wines representing top luxury status.",
    history: "Sourced originally from the Loire Valley, France. It was brought to South African shores in 1655 by Jan van Riebeeck. In the warm Cape climate, it adapted spectacularly, becoming the country's dominant grape and cementing the global benchmark for multi-layered tropical whites.",
    originYear: "1655",
    flavors: ["Green Apple", "Wild Honey", "Golden Quince", "Tropical Pineapple", "Citrus Peel", "Toasted Almond"],
    aromaWheel: {
      "Crisp Fruits": ["Green Apple", "White Peach", "Lemon Zest"],
      "Sweet Florals": ["Honeyed Beeswax", "Jasmine Blossom", "Ginger"],
      "Barrel Nuances": ["Toasted Brioche", "Vanilla", "Flinty wet stone"]
    },
    profile: {
      body: 3.2,
      acidity: 4.8,
      tannins: 0.0,
      sweetness: 1.5
    },
    foodPairings: [
      { food: "Cape Malay Chicken Curry", description: "Off-dry Chenin's subtle honey notes and crisp acidity handle aromatic Eastern spices gracefully.", emoji: "🍛" },
      { food: "Fresh Seafood Platter", description: "Steamed mussels or braised linefish match Chenin's wet stone mineral and lemon peel profile.", emoji: "🦐" },
      { food: "Crispy Pork Belly", description: "High natural acidity cuts through the pork fat richness, while baked apple notes pair elegantly.", emoji: "🥓" }
    ],
    servingTemp: "8-12°C (46-54°F) - well-chilled for crisp styles, slightly warmer for rich barrel-matured whites.",
    regions: [
      { name: "Swartland", description: "Deeply acclaimed dry-farmed old vineyards creating massive body, stone fruit richness, and granite minerality." },
      { name: "Stellenbosch", description: "Outstanding fruit balance with yellow orchard fruit, polished acid lines, and integrated oak spice." },
      { name: "Breedekloof", description: "Generous sunshine leading to rich honey, tropical pineapple, and easily approachable profiles." }
    ],
    recommendedBottles: [
      {
        name: "Ken Forrester The FMC Chenin",
        region: "Stellenbosch, South Africa",
        price: "R 750",
        description: "An icon of barrel-fermented Cape luxury. Unbelievably rich—displaying baked apples, sweet honey, and vanilla cream.",
        image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400"
      },
      {
        name: "Badenhorst Secateurs Chenin",
        region: "Swartland, South Africa",
        price: "R 170",
        description: "Crafted from old bush vines. Flinty green orchard fruits with incredible depth, beeswax flavor, and pristine integrity.",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400"
      },
      {
        name: "DeMorgenzon DMZ Chenin",
        region: "Stellenbosch, South Africa",
        price: "R 190",
        description: "Bright, fresh, and un-oaked style. Features white peach, green melon, and electric citrus acidity.",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400"
      }
    ],
    similarGrapes: [
      { name: "Chardonnay", slug: "chardonnay", reason: "Matches in medium-to-high body versatility and highly receptive nature to toast oak barrel aging." },
      { name: "Sauvignon Blanc", slug: "sauvignon-blanc", reason: "Shares the incredibly high, refreshing fruit acidity and crisp green fruit highlights." }
    ],
    promptSuggestions: [
      "Recommend a Swartland old-vine Chenin Blanc",
      "What is the difference between oaked and unoaked Chenin?",
      "Can Chenin Blanc age in a wine cellar?"
    ]
  },
  'shiraz': {
    name: "Shiraz / Syrah",
    slug: "shiraz",
    flag: "🍷",
    badge: "Bold, spicy, and robust",
    bannerImage: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1200",
    summary: "Reflecting South Africa's diverse soils, Cape Shiraz spans opulent, rich New World styles showing dark plush fruits to elegant, white-pepper mineral classic Syrah. One of the top-performing reds of the subcontinent.",
    history: "Originally originating from the Rhône Valley of France. Sourced and planted in warm soils of the Swartland and Paarl, the grape thrived, offering highly concentrated skin tannins and striking notes of black pepper that gained global cult status.",
    originYear: "1890s",
    flavors: ["Blackberry", "White Pepper", "Smoked Char", "Plum Jam", "Fresh Lavender", "Saddle Leather"],
    aromaWheel: {
      "Spicy & Floral": ["Coarse Black Pepper", "Lavender Buds", "Anise Star"],
      "Dark Fruit": ["Huckleberry", "Mashed Blackberry", "Black Cherry"],
      "Savory": ["Cured Meats", "Earthy Musk", "Toasted Oak"]
    },
    profile: {
      body: 4.6,
      acidity: 3.8,
      tannins: 4.0,
      sweetness: 1.1
    },
    servingTemp: "16-18°C (60-64°F) - ideal red vault temperature.",
    foodPairings: [
      { food: "Sticky BBQ Ribs", description: "Basting sauces and charred caramelized ribs are elevated by the wine’s heavy smoke and plum jam.", emoji: "🍖" },
      { food: "Rosemary Grilled Lamb Chops", description: "Heavy fat contents in lamb are effortlessly cut by robust tannins, while rosemary pairs with herbal Syrah notes.", emoji: "🐑" },
      { food: "Slow-Cooked Oxtail Stew", description: "Rich beef collagen and garlic stew sauces find complete alignment with Shiraz's robust body.", emoji: "🍲" }
    ],
    regions: [
      { name: "Swartland", description: "Legendary home of revolutionary natural Syrahs. Expresses intense ground black pepper and deep mineral gravel notes." },
      { name: "Stellenbosch", description: "Produces structured, elegantly proportioned profiles loaded with rich blackcurrant, cedar, and polished finish." },
      { name: "Tulbagh", description: "Encircled by massive hot mountain ranges creating highly robust, ink-colored dark wines packed with oak chocolate." }
    ],
    recommendedBottles: [
      {
        name: "Mullineux Syrah",
        region: "Swartland, South Africa",
        price: "R 430",
        description: "A benchmark masterpiece. Intense aromatics of black pepper, purple violets, and gravelly granite mineral tannins.",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400"
      },
      {
        name: "Saronsberg Shiraz",
        region: "Tulbagh, South Africa",
        price: "R 390",
        description: "Opulent, intense, and heavily awarded. Brimming with toasted vanilla, dark cocoa, sweet plums, and lush velvety finish.",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400"
      }
    ],
    similarGrapes: [
      { name: "Pinotage", slug: "pinotage", reason: "Shares the smoky, bold-spiced red character and rich compatibility with fire cooking." },
      { name: "Cabernet Sauvignon", slug: "cabernet-sauvignon", reason: "Offers matching deep-dark tannin structures and dark fruit concentration." }
    ],
    promptSuggestions: [
      "What makes Swartland Shiraz so famous globally?",
      "What is the difference between Shiraz and Syrah labels?",
      "Good BBQ food pairings for Shiraz"
    ]
  },
  'cabernet-sauvignon': {
    name: "Cabernet Sauvignon",
    slug: "cabernet-sauvignon",
    flag: "👑",
    badge: "Full-bodied king of red wines",
    bannerImage: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=1200",
    summary: "As South Africa's most highly prized red variety, Cabernet Sauvignon dominates decomposed granite mountain slopes, particularly in Stellenbosch. It yields deeply structured, world-class aging candidates loaded with cassis and graphite wood tones.",
    history: "Born of an accidental crossing between Cabernet Franc and Sauvignon Blanc in Bordeaux during the 17th century. It took immediately to Stellenbosch's maritime cooling mountain valleys, serving as the stellar anchor of South Africa's premium red portfolio.",
    originYear: "1600s",
    flavors: ["Blackcurrant", "Cigar Box Cedar", "Mint Leaf", "Dark Cocoa", "Graphite Mineral", "Sweet Vanilla"],
    aromaWheel: {
      "Berries": ["Classic Cassis", "Ripe Blackberry", "Blueberry"],
      "Wood & Herbal": ["Tobacco Leaf", "Aromatic Eucalyptus / Mint", "Cedarwood"],
      "Earth & Roast": ["Graphite Pencil", "Espresso", "Dark Cocoa"]
    },
    profile: {
      body: 5.0,
      acidity: 4.0,
      tannins: 4.8,
      sweetness: 1.0
    },
    servingTemp: "18°C (64°F) - room-cool to allow complex tannins to resolve and open.",
    foodPairings: [
      { food: "Flame-Broiled Ribeye Steak", description: "High intramuscular ribeye fat binds to the intense wine tannins, leaving a velvety fruit sensation on the palate.", emoji: "🥩" },
      { food: "Roasted Beef Tenderloin", description: "Juicy, rare beef pairs spectacularly with the structured cassis and fresh mint aromas.", emoji: "🍽️" },
      { food: "Aged Cheddar or Gruyère", description: "Sharp, rich proteins break down structured young Cabernet tannins elegantly.", emoji: "🧀" }
    ],
    regions: [
      { name: "Stellenbosch (Golden Triangle)", description: "The uncontested capital of South African Cabernet, yielding structural graphite, rich blackcurrant, and epic age limits." },
      { name: "Jonkershoek Valley", description: "Enclosed mountain ward bringing deep soil moisture, resulting in extremely concentrated dark berries and rich forest pine aromas." }
    ],
    recommendedBottles: [
      {
        name: "Rust en Vrede Estate Cabernet",
        region: "Stellenbosch, South Africa",
        price: "R 460",
        description: "A profound Stellenbosch monument. Structured blackcurrant fruit, graphite minerality, and fine, powdery classic tannins.",
        image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400"
      },
      {
        name: "Stark-Condé Three Pines Cabernet",
        region: "Jonkershoek Valley, South Africa",
        price: "R 410",
        description: "Indulgent and complex. Full of dark plums, roasted cocoa, volcanic soil spice, and a spectacular silk texture.",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400"
      }
    ],
    similarGrapes: [
      { name: "Merlot", slug: "merlot", reason: "Its sister grape, sharing rich chocolate-cherry profiles with a softer, plush mouthfeel." },
      { name: "Shiraz", slug: "shiraz", reason: "Matches in high-bodied dark berry complexity with a touch more pepper spice." }
    ],
    promptSuggestions: [
      "Why is Stellenbosch considered outstanding for Cabernet?",
      "How many years should I cellar a premium SA Cabernet?",
      "Best cheese board items for Cabernet Sauvignon"
    ]
  },
  'merlot': {
    name: "Merlot",
    slug: "merlot",
    flag: "🌿",
    badge: "Soft, velvety, & approachable",
    bannerImage: "https://images.unsplash.com/photo-1528822838807-fc6ff3d3ef59?q=80&w=1200",
    summary: "Renowned for its plush, velvet mouthfeel, South African Merlot produces incredibly supple, friendly wines loaded with red cherry, sweet plum, and rich milk chocolate. It acts as both a stellar single variety and the essential softening blending partner.",
    history: "Originally originating in Bordeaux, France, where it is the most planted variety. Sourced and cultivated extensively across South African slate-heavy valleys to deliver premium, early-drinking reds with outstanding structure.",
    originYear: "1780s",
    flavors: ["Baked Red Cherry", "Ripe Plum", "Milk Chocolate", "Fresh Bay Leaf", "Vanilla Pod"],
    aromaWheel: {
      "Red Fruits": ["Plush Plum", "Bing Cherry", "Raspberry Candy"],
      "Sweet Oak": ["Milk Chocolate", "Vanilla Oak", "Sweet Toffee"],
      "Leafy Herbs": ["Dried Bay Leaf", "Green Herbs", "Tea Leaves"]
    },
    profile: {
      body: 3.6,
      acidity: 3.5,
      tannins: 3.2,
      sweetness: 1.1
    },
    servingTemp: "16-18°C (60-64°F) - perfect for unlocking the signature velvety tannins.",
    foodPairings: [
      { food: "Herb-Roasted Chicken", description: "Approachable fruits and mild tannins beautifully complement lean, savory roasted chicken skins.", emoji: "🍗" },
      { food: "Pasta Bolognese", description: "Tomato-based meat sauces match the red cherry fruits and pleasant softness of Merlot.", emoji: "🍝" },
      { food: "Pan-Seared Duck Breast", description: "Rich, gamier poultry oils match Merlot’s velvety texture and red plum sweet glaze notes.", emoji: "🦆" }
    ],
    regions: [
      { name: "Stellenbosch", description: "Deep clay pockets allow grapes to ripen evenly, securing a perfect balance of cocoa and plush plum structure." },
      { name: "Franschhoek Valley", description: "Brings forward highly aromatic, elegant herb profiles paired with lush, juicy red cherries." }
    ],
    recommendedBottles: [
      {
        name: "Meerlust Merlot",
        region: "Stellenbosch, South Africa",
        price: "R 470",
        description: "Benchmark luxury Merlot. Rich fennel, deep dark plums, dark chocolate, and a silky, structured backbone.",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400"
      },
      {
        name: "Hartenberg Merlot",
        region: "Stellenbosch, South Africa",
        price: "R 285",
        description: "Velvety, soft and gorgeous. Rich plum and elegant culinary spices backed by very fine, round tannins.",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400"
      }
    ],
    similarGrapes: [
      { name: "Cabernet Sauvignon", slug: "cabernet-sauvignon", reason: "Offers matching black fruit notes but with a firmer, more tannic mountain structure." },
      { name: "Chardonnay", slug: "chardonnay", reason: "In the white family, mimics the round, soft, buttery mouthfeel profile." }
    ],
    promptSuggestions: [
      "What is the difference between Merlot and Cabernet Sauvignon?",
      "Recommend a soft, accessible South African Merlot",
      "Which foods highlight Merlot's rich chocolate notes?"
    ]
  },
  'chardonnay': {
    name: "Chardonnay",
    slug: "chardonnay",
    flag: "⭐",
    badge: "Rich, buttery, or crisp elegance",
    bannerImage: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200",
    summary: "From the cool-climate maritime sea breeze of Hemel-en-Aarde to limestone-rich, butter-accented barrel-aged icons of Robertson, South African Chardonnay represents a world-class white wine level.",
    history: "Hailing originally from Burgundy, France. Finding its home across the Western Cape’s cooling coastal valleys, it developed unique tropical characteristics whilst maintaining pristine Old World citrus complexity and flinty wet stone structure.",
    originYear: "1880s",
    flavors: ["Yellow Apple", "Toasted Butter", "Fresh Lemon Peel", "Baked Peach", "Madagascar Vanilla", "Cold Flint"],
    aromaWheel: {
      "Deciduous Fruit": ["Yellow Apple", "White Peach", "Ripe Nectarine"],
      "Bakery & Brine": ["Toasted Brioche", "Chalky Limestone", "Flinty wet river stone"],
      "Dairy & Toast": ["Melted Salted Butter", "Caramelized Vanilla", "Pecan"]
    },
    profile: {
      body: 4.0,
      acidity: 4.1,
      tannins: 0.0,
      sweetness: 1.4
    },
    servingTemp: "10-14°C (50-57°F) - richer oaked styles taste best slightly warmer than crisp whites.",
    foodPairings: [
      { food: "Garlic Butter Grilled Lobster", description: "Oaked Chardonnay’s toasted butter and vanilla completely echo rich, sweet lobster fats.", emoji: "🦞" },
      { food: "Rich Fettuccine Alfredo", description: "High natural acidity handles cream sauces effortlessly, cleansing the tongue after each bite.", emoji: "🍝" },
      { food: "Crispy Cedar-Plank Salmon", description: "Oat wood flavors and sweet salmon oils blend harmoniously with baked peach and lemon zest notes.", emoji: "🐟" }
    ],
    regions: [
      { name: "Hemel-en-Aarde Valley", description: "Extreme cool climate valleys producing high class, mineral-focused, oyster shell-dry elegant white masterpieces." },
      { name: "Robertson", description: "Limestone-dominant soils producing buttery, rich, sun-drenched, oak-fermented tropical blockbusters." },
      { name: "Stellenbosch", description: "Balanced, multi-layered whites showing beautiful lemon blossom, baked spices, and high cellaring potential." }
    ],
    recommendedBottles: [
      {
        name: "Hamilton Russell Chardonnay",
        region: "Hemel-en-Aarde, South Africa",
        price: "R 795",
        description: "South Africa's internationally acclaimed masterpiece. Phenomenally complex—dry pear, wet gravel, crisp citrus, and integrated oak.",
        image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400"
      },
      {
        name: "Springfield Methode Ancienne",
        region: "Robertson, South Africa",
        price: "R 490",
        description: "Old school wild-yeast unfiltered luxury. Incredibly rich, displaying heavy toasted butter, roasted pecans, and vanilla bean.",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400"
      }
    ],
    similarGrapes: [
      { name: "Chenin Blanc", slug: "chenin-blanc", reason: "Shares the rich barrel texture potential and beautiful tropical fruit versatility." },
      { name: "Viognier", slug: "viognier", reason: "Offers matching deep gold color and heavy yellow peach and vanilla undertones." }
    ],
    promptSuggestions: [
      "Tell me about cool-climate SA Chardonnay from Hemel-en-Aarde",
      "Why does Chardonnay taste buttery?",
      "Best seafood pairings for oaked Chardonnay"
    ]
  }
};

interface Props {
  slug: string;
  onBack: () => void;
  onSelectWine: (wine: any) => void;
}

const navigateToPath = (path: string) => {
  if (`${window.location.pathname}${window.location.search}` === path) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
  }
  window.dispatchEvent(new Event('popstate'));
};

export default function GrapeKnowledgePage({ slug, onBack, onSelectWine }: Props) {
  const grape = GRAPES_KNOWLEDGE[slug.toLowerCase()] || GRAPES_KNOWLEDGE['pinotage'];
  const [activeAromaCategory, setActiveAromaCategory] = useState<string>(Object.keys(grape.aromaWheel)[0]);
  
  // Interactive Custom Bottle creation & Supabase Sync
  const [isAddingToCellar, setIsAddingToCellar] = useState(false);
  const [customBottleName, setCustomBottleName] = useState(`${grape.name} Reserve`);
  const [customBottleEstate, setCustomBottleEstate] = useState('');
  const [customBottleVintage, setCustomBottleVintage] = useState('2022');
  const [customBottlePrice, setCustomBottlePrice] = useState('R 280');
  const [addSuccess, setAddSuccess] = useState(false);

  // Sommelier Chat Box state
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { 
      role: 'model', 
      text: `Greetings wine lover! I am your AI Sommelier. Ask me anything about ${grape.name}—its history, perfect cellaring times, or premium SA producers!` 
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory]);

  const handleAskAi = async (customQuery?: string) => {
    const queryToUse = customQuery || aiChatQuery;
    if (!queryToUse.trim() || isAiLoading) return;

    const userMessage = { role: 'user' as const, text: queryToUse };
    setAiChatHistory(prev => [...prev, userMessage]);
    setAiChatQuery('');
    setIsAiLoading(true);

    try {
      const systemPrompt = `You are a world-class Master Sommelier specializing in South African wine heritage. 
      The current context is the grape varietal: ${grape.name} (${grape.badge}).
      Answer the user's question clearly, concisely, and with elegant sommelier expertise. Highlight local South African vineyards or pairing contexts where relevant.`;

      const responseText = await callOpenRouter({
        prompt: queryToUse,
        systemPrompt,
        temperature: 0.7
      });

      setAiChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err) {
      console.error(err);
      setAiChatHistory(prev => [...prev, { role: 'model', text: "Forgive me, my cellar registers are briefly offline. Please try again in a moment." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateVirtualBottle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in or complete your profile to add to your personal cellar.");
        return;
      }

      const { error } = await supabase.from('cellar').insert({
        user_id: user.id,
        name: customBottleEstate ? `${customBottleEstate} ${customBottleName}` : `${grape.name} Reserve`,
        vintage: customBottleVintage || '2022',
        region: grape.regions[0]?.name || 'South Africa',
        grape: grape.name,
        status: 'Hold (Peak Window ✨)',
        status_color: 'text-gold-500',
        image: grape.bannerImage,
        rating: 94,
        price: customBottlePrice || 'R 320',
        notes: `Directly collected via Sommelier AI ${grape.name} Knowledge vault.`,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setIsAddingToCellar(false);
      }, 2000);
    } catch (err) {
      console.error("Save virtual bottle error:", err);
      alert("Unable to add this bottle to your live cellar. Please try again.");
      setIsAddingToCellar(false);
    }
  };

  return (
    <div className="pb-36 bg-wine-950 min-h-screen text-ivory">
      {/* Dynamic Hero Banner */}
      <div className="relative h-80 w-full overflow-hidden">
        <img 
          src={grape.bannerImage} 
          alt={grape.name} 
          className="absolute inset-0 w-full h-full object-cover brightness-50 contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-wine-950/70 to-wine-950 z-1" />
        
        {/* Navigation Floating Header */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10 w-[calc(100%-3rem)]">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-ivory hover:bg-black/60 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold-500/20 bg-wine-950/80 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-450 animate-pulse" />
            <span className="text-[9px] tracking-[0.15em] font-mono text-gold-400 font-bold uppercase">AI Sommelier Encyclopedia</span>
          </div>
        </div>

        {/* Hero Title details */}
        <div className="absolute bottom-6 left-6 right-6 z-10 text-left max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{grape.flag}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-md border border-gold-500/20 font-bold">
              {grape.badge}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-white mb-2 leading-none">
            {grape.name}
          </h1>
          <p className="text-xs text-gray-300 italic font-serif">Original cultivation track dated circa {grape.originYear}</p>
        </div>
      </div>

      <div className="px-6 space-y-8 max-w-4xl mx-auto -mt-2">
        {/* Dynamic AI Wine Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 bg-gradient-to-br from-wine-900/60 to-wine-950/90 rounded-2xl border border-glass-border/30 relative"
        >
          <div className="absolute -top-3 left-6 px-3 py-1 bg-gold-500 text-wine-950 text-[10px] font-mono font-bold tracking-wider rounded-md uppercase shadow-lg">
            AI Wine Summary
          </div>
          <p className="text-base text-gray-200 font-serif leading-relaxed italic md:text-lg pt-2">
            "{grape.summary}"
          </p>

          <div className="mt-5 pt-5 border-t border-white/5 flex flex-wrap gap-2">
            {grape.flavors.map((flv, idx) => (
              <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gold-300">
                🫐 {flv}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Origin & History & Profile Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin & History */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-base text-gold-400 font-mono uppercase tracking-wide mb-3 flex items-center gap-2">
                <BookOpen size={16} /> Origin & History
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed font-serif">
                {grape.history}
              </p>
            </div>
            <div className="mt-4 p-3.5 bg-wine-950/40 rounded-xl border border-white/5 flex justify-between items-center text-xs">
              <span className="text-gray-400">First Root Origin</span>
              <span className="font-mono text-gold-450 font-bold text-sm tracking-widest">{grape.originYear}</span>
            </div>
          </div>

          {/* Body / Acidity / Tannins Profile Sliders */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base text-gold-400 font-mono uppercase tracking-wide mb-4 flex items-center gap-2">
              <Dna size={16} /> Structural Taste Profile
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-serif leading-relaxed">
              Analyzing the physiological characteristics of grape skins, pip tannins and fermented acidity.
            </p>

            <div className="space-y-4">
              <ProfileGauge label="Body / Alcohol Weight" value={grape.profile.body} description="Viscosity, weight, and mouthfeel density." />
              <ProfileGauge label="Fruit Acidity" value={grape.profile.acidity} description="Crispness, crisp tension, and saliva generation." />
              <ProfileGauge label="Skin Tannins" value={grape.profile.tannins} description="Drying grasp, astringency, and cellaring shelf-life." />
              <ProfileGauge label="Base Sweetness" value={grape.profile.sweetness} description="Residual sugars after secondary fermentation." />
            </div>
          </div>
        </div>

        {/* Aroma Wheel Component */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base text-gold-400 font-mono uppercase tracking-wide mb-1 flex items-center gap-2">
            💡 Dynamic Aroma Wheel Map
          </h3>
          <p className="text-xs text-gray-400 mb-6 font-serif">Click through the primary aroma molecules to see specific grape characteristics.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category selection */}
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {Object.keys(grape.aromaWheel).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveAromaCategory(cat)}
                  className={`px-4 py-3 rounded-xl border text-xs font-serif font-bold text-left transition-all whitespace-nowrap md:whitespace-normal ${
                    activeAromaCategory === cat 
                      ? 'bg-gold-500 text-wine-950 border-gold-500 shadow-[0_4px_12px_rgba(198,169,107,0.25)]' 
                      : 'bg-wine-950/60 border-white/5 text-gray-400 hover:border-white/10'
                  }`}
                >
                  ⚜️ {cat}
                </button>
              ))}
            </div>

            {/* Display list detailing selected segment */}
            <div className="md:col-span-2 bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center min-h-[140px]">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 mb-2">Selected Bouquet Elements</span>
              <div className="grid grid-cols-2 gap-3">
                {grape.aromaWheel[activeAromaCategory]?.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 text-sm text-gray-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-450 shadow-[0_0_8px_rgba(198,169,107,0.5)]" />
                    <span className="font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Food Pairings & Service Temp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pairings */}
          <div className="glass-panel p-6 rounded-2xl md:col-span-2">
            <h3 className="text-base text-gold-400 font-mono uppercase tracking-wide mb-4 flex items-center gap-2">
              <Utensils size={16} /> Sommelier Food Pairings
            </h3>
            <div className="space-y-4">
              {grape.foodPairings.map((pair, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-wine-950/40 border border-white/5 rounded-xl p-3">
                  <span className="text-2xl mt-0.5">{pair.emoji}</span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white mb-0.5">{pair.food}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-serif">{pair.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Temperature */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between bg-gradient-to-b from-wine-900/40 to-wine-950/90 relative overflow-hidden">
            <div className="absolute top-0 right-0 py-2 px-3 bg-blue-500/10 border-l border-b border-blue-500/25 text-blue-400 text-[9px] font-mono tracking-wider rounded-bl-xl font-bold">
              IDEAL SERVICE
            </div>
            <div>
              <h3 className="text-base text-gold-400 font-mono uppercase tracking-wide mb-3 flex items-center gap-2">
                <Thermometer size={16} /> Serving Heat
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-serif pt-1">
                Optimizing chemical molecules and skin esters through precise cellar temperature.
              </p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 mt-4 text-center">
              <span className="text-xs text-gray-500 block uppercase font-mono tracking-widest mb-1 font-bold">Vault Standard</span>
              <span className="text-lg font-mono font-black text-blue-400">{grape.servingTemp.split(' - ')[0]}</span>
              <span className="text-[10px] text-gray-400 font-serif italic block mt-1 leading-tight">{grape.servingTemp}</span>
            </div>
          </div>
        </div>

        {/* Top Wine Regions */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base text-gold-400 font-mono uppercase tracking-wide mb-4 flex items-center gap-2">
            <MapPin size={16} /> Key South African Terrorist Wards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {grape.regions.map((reg, i) => (
              <div key={i} className="bg-wine-950/55 p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-serif font-bold text-white mb-1.5 flex items-center gap-1.5">
                  🇿🇦 {reg.name}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-serif">{reg.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Bottles */}
        <div>
          <h3 className="text-lg font-serif font-bold px-1 mb-4">🏆 Highly-Rated SA {grape.name} Bottles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {grape.recommendedBottles.map((btl, i) => (
              <div 
                key={i} 
                onClick={() => onSelectWine({
                  name: btl.name,
                  region: btl.region.split(',')[0],
                  vintage: "2021",
                  grape: grape.name,
                  price: btl.price,
                  notes: btl.description,
                  rating: 94,
                  image: btl.image
                })}
                className="glass-panel rounded-2xl overflow-hidden cursor-pointer group hover:border-gold-500/30 transition-all flex flex-col h-full bg-wine-950/45"
              >
                <div className="h-44 w-full relative overflow-hidden bg-wine-900/30">
                  <img src={btl.image} alt={btl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-gold-400 px-2 py-1 rounded text-xs font-mono font-bold">
                    {btl.price}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-serif font-bold text-base text-white group-hover:text-gold-400 transition-colors leading-snug line-clamp-1">{btl.name}</h4>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">{btl.region}</span>
                    <p className="text-xs text-gray-400 font-serif leading-relaxed mt-1.5 line-clamp-3 italic">"{btl.description}"</p>
                  </div>
                  <span className="text-[10px] text-gold-400 font-mono font-bold uppercase tracking-wider block pt-2 border-t border-white/5">Tap to view details</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Chat: Ask Cupido AI */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-gold-500/10 bg-wine-950/20" id="ask-sommelier-ai-grape">
          <div className="p-5 border-b border-white/5 bg-gradient-to-r from-wine-950 via-wine-900/60 to-wine-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-gold-500/30 rounded-full flex items-center justify-center bg-black/45">
                <Heart className="w-4.5 h-4.5 text-pink-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-white">Ask Cupido AI about {grape.name}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Romantic coupling & pairing expert</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          </div>

          {/* Interactive Chat History and dynamic AI response streaming */}
          <div className="h-64 overflow-y-auto p-5 space-y-4 bg-black/15">
            {aiChatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-serif leading-relaxed shadow-sm ${
                  chat.role === 'user' 
                    ? 'bg-gold-500 text-wine-950 font-bold rounded-tr-none' 
                    : 'bg-wine-900/80 border border-white/5 text-gray-200 rounded-tl-none'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-wine-900/50 border border-white/5 text-gray-400 max-w-[85%] rounded-2xl rounded-tl-none p-3.5 text-xs font-mono flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-500" />
                  <span>Sommelier is consulting the taste logs...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="p-3 border-t border-white/5 bg-wine-950/45 flex flex-wrap gap-1.5 overflow-x-auto">
            {grape.promptSuggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleAskAi(sug)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 transition-colors whitespace-nowrap font-serif"
              >
                💡 {sug}
              </button>
            ))}
          </div>

          {/* Prompt Entry Box */}
          <div className="p-3 border-t border-white/5 bg-wine-950/80 flex gap-2">
            <input
              type="text"
              value={aiChatQuery}
              onChange={(e) => setAiChatQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
              placeholder={`Query Sommelier on ${grape.name} cellaring limits or terroir...`}
              className="flex-1 bg-wine-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <button
              onClick={() => handleAskAi()}
              disabled={isAiLoading || !aiChatQuery.trim()}
              className="px-4.5 bg-gold-500 hover:bg-gold-400 text-wine-950 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-gold-500"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Similar Grapes */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base text-gold-400 font-mono uppercase tracking-wide mb-3 flex items-center gap-2">
            🍷 Similar Grapes to Explore
          </h3>
          <p className="text-xs text-gray-400 mb-6 font-serif">If you enjoy {grape.name}, our sommelier recommends these dynamic alternatives.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grape.similarGrapes.map((sim, idx) => (
              <div key={idx} className="bg-wine-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-gold-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                    🍇 {sim.name}
                  </h4>
                  <p className="text-xs text-gray-400 font-serif leading-relaxed mb-4">"{sim.reason}"</p>
                </div>
                <button
                  onClick={() => navigateToPath(`/grapes/${sim.slug}`)}
                  className="py-2.5 bg-wine-900/60 hover:bg-wine-900 border border-white/10 text-ivory text-[10px] uppercase font-mono tracking-widest rounded-xl transition-colors font-bold"
                >
                  View {sim.name} Profile
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic & Secure Virtual Bottle Cellar Insertion Workspace */}
        <div className="glass-panel p-6 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-wine-950 to-wine-900/30 text-center relative overflow-hidden">

          <h3 className="text-xl font-serif font-bold text-white mb-2">🎁 Cellar Your Own Virtual {grape.name}</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6 font-serif">
            Instantly formulate and register an custom artisanal {grape.name} bottle into your digital cellar ledger.
          </p>

          {!isAddingToCellar ? (
            <button
              onClick={() => setIsAddingToCellar(true)}
              className="px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-450 hover:from-gold-500 hover:to-gold-350 text-wine-950 font-serif font-black rounded-xl text-sm shadow-[0_4px_20px_rgba(198,169,107,0.25)] transition-all"
            >
              Collect Custom virtual {grape.name} Bottle
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-black/25 rounded-2xl p-5 border border-white/5 space-y-4 max-w-sm mx-auto text-left"
            >
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1 font-mono">Artisanal Estate Name</label>
                <input
                  type="text"
                  placeholder="e.g. Simonsig, Rustenberg, Meerlust"
                  value={customBottleEstate}
                  onChange={(e) => setCustomBottleEstate(e.target.value)}
                  className="w-full bg-wine-900/80 border border-white/10 rounded-lg p-2.5 text-xs text-ivory focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1 font-mono">Custom Label / Reserve</label>
                <input
                  type="text"
                  placeholder="e.g. Red Label, Grand Reserve"
                  value={customBottleName}
                  onChange={(e) => setCustomBottleName(e.target.value)}
                  className="w-full bg-wine-900/80 border border-white/10 rounded-lg p-2.5 text-xs text-ivory focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1 font-mono">Vintage</label>
                  <select
                    value={customBottleVintage}
                    onChange={(e) => setCustomBottleVintage(e.target.value)}
                    className="w-full bg-wine-900/80 border border-white/10 rounded-lg p-2.5 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  >
                    {["2024", "2023", "2022", "2021", "2020", "2019", "2018"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1 font-mono">Est Price</label>
                  <input
                    type="text"
                    value={customBottlePrice}
                    onChange={(e) => setCustomBottlePrice(e.target.value)}
                    className="w-full bg-wine-900/80 border border-white/10 rounded-lg p-2.5 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setIsAddingToCellar(false)}
                  className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-gray-400 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVirtualBottle}
                  className="flex-1 py-2.5 bg-gold-500 text-wine-950 font-serif font-black rounded-xl text-xs hover:bg-gold-450 transition-all flex items-center justify-center gap-1"
                >
                  {addSuccess ? (
                    <>
                      <Check size={14} /> Collected!
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Add to Ledger
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}

function ProfileGauge({ label, value, description }: { label: string; value: number; description: string }) {
  // Calculate percentage out of 5
  const pct = (value / 5) * 100;
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="font-serif font-bold text-gray-200">{label}</span>
        <span className="font-mono text-gold-450 font-bold">{value}/5</span>
      </div>
      <div className="h-2 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-gold-600 to-gold-450 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-gray-500 font-serif block mt-1 leading-snug">{description}</span>
    </div>
  );
}
