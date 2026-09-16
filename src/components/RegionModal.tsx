import React from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Grape, Building2 } from 'lucide-react';

const regionData: Record<string, any> = {
  "Stellenbosch": {
    name: "Stellenbosch",
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=800&auto=format&fit=crop",
    description: "The historical heart of South African wine, known for its mountainous terrain, diverse soils, and world-class Cabernet Sauvignon and Bordeaux blends.",
    grapes: ["Cabernet Sauvignon", "Shiraz", "Chenin Blanc", "Pinotage"],
    wineries: ["Meerlust", "Kanonkop", "Rust en Vrede", "Waterford Estate"],
    characteristics: "Full-bodied, structured reds with excellent aging potential. Whites are often rich and complex."
  },
  "Franschhoek": {
    name: "Franschhoek",
    image: "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?q=80&w=800&auto=format&fit=crop",
    description: "The 'French Corner' of the Cape, famous for its culinary scene, breathtaking valley views, and exceptional Cap Classique (sparkling wine).",
    grapes: ["Chardonnay", "Pinot Noir", "Semillon", "Syrah"],
    wineries: ["Haute Cabrière", "Boekenhoutskloof", "La Motte", "Chamonix"],
    characteristics: "Elegant, refined wines. Exceptional sparkling wines (MCC) and old-vine Semillon."
  },
  "Swartland": {
    name: "Swartland",
    image: "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=800&auto=format&fit=crop",
    description: "A vast, rugged region that has become the epicenter of South Africa's natural and independent wine movement, focusing on dry-farmed old vines.",
    grapes: ["Chenin Blanc", "Syrah", "Cinsault", "Grenache"],
    wineries: ["Sadie Family Wines", "Mullineux", "Badenhorst", "Porseleinberg"],
    characteristics: "Textural, terroir-driven wines with natural acidity and complex, savory profiles."
  },
  "Hemel-en-Aarde": {
    name: "Hemel-en-Aarde",
    image: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=800&auto=format&fit=crop",
    description: "Meaning 'Heaven and Earth', this cool-climate maritime region is renowned for producing South Africa's finest Pinot Noir and Chardonnay.",
    grapes: ["Pinot Noir", "Chardonnay", "Sauvignon Blanc"],
    wineries: ["Hamilton Russell", "Bouchard Finlayson", "Newton Johnson", "Creation"],
    characteristics: "Elegant, cool-climate styles with bright acidity, minerality, and finesse."
  }
};

export default function RegionModal({ regionName, onClose }: { regionName: string, onClose: () => void }) {
  const data = regionData[regionName] || regionData["Stellenbosch"];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[60] bg-wine-900 overflow-y-auto hide-scrollbar"
    >
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Hero Image */}
      <div className="h-[40vh] relative">
        <img 
          src={data.image} 
          alt={data.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-900/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 relative z-10 pb-32">
        <div className="inline-flex items-center gap-2 bg-glass border border-glass-border backdrop-blur-md px-3 py-1.5 rounded-full mb-4">
          <MapPin size={16} className="text-gold-500" />
          <span className="text-xs font-medium tracking-wide text-gold-500">Wine Region</span>
        </div>
        
        <h1 className="text-4xl font-serif font-semibold mb-4">{data.name}</h1>
        <p className="text-lg text-gray-300 font-serif leading-relaxed mb-8">{data.description}</p>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Grape className="text-gold-500" size={20} />
              Key Varietals
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.grapes.map((grape: string) => (
                <span key={grape} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-ivory">
                  {grape}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Building2 className="text-gold-500" size={20} />
              Notable Wineries
            </h3>
            <ul className="space-y-3">
              {data.wineries.map((winery: string) => (
                <li key={winery} className="flex items-center gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div>
                  {winery}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-gold-500/20">
            <h3 className="text-sm uppercase tracking-widest text-gold-500 mb-2">Tasting Profile</h3>
            <p className="text-ivory font-serif leading-relaxed">{data.characteristics}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
