import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { FocusCards } from '@/components/ui/focus-cards';
import ImageViewerModal from '../components/ImageViewerModal';

const API_BASE = 'http://localhost:5000';
const cats = ['all','painting','digital','sketch','calligraphy','sculpture','photography','comic'];

export default function Explore() {
  const [artworks, setArtworks] = useState([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const navigate = useNavigate();

  const fetch_ = async () => {
    setLoading(true);
    try {
      let res;
      if (search) res = await api.get(`/artwork/search?q=${search}`);
      else if (cat === 'all') res = await api.get('/artwork/feed?limit=30');
      else res = await api.get(`/artwork/category/${cat}`);
      setArtworks(res.data.artworks || res.data || []);
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [cat]);

  const cards = useMemo(() => {
    return artworks.map(a => ({
      title: a.title,
      src: a.imageUrl?.startsWith('http') ? a.imageUrl : `${API_BASE}${a.imageUrl}`,
      onClick: () => setSelectedArtwork(a)
    }));
  }, [artworks]);

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      <div className="flex-shrink-0 z-20 relative">
        <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
        <p className="text-gray-400 mb-6">Discover art across categories</p>
        <form onSubmit={e=>{e.preventDefault();fetch_();}} className="relative mb-6">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search artworks..." className="input pl-12 py-3.5" />
        </form>
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {cats.map(c=>(
            <button key={c} onClick={()=>{setCat(c);setSearch('');}}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${cat===c?'bg-primary text-white':'bg-dark-card text-gray-400 hover:text-white border border-dark-border'}`}>
              {c.charAt(0).toUpperCase()+c.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 relative mt-4 pb-20">
        {loading ? <div className="flex justify-center py-20 z-20 relative"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
        : artworks.length===0 ? <div className="text-center py-20 card z-20 relative"><p className="text-gray-400">No artworks found</p></div>
        : (
          <div className="w-full">
            <FocusCards cards={cards} />
          </div>
        )}
      </div>
      <ImageViewerModal isOpen={!!selectedArtwork} onClose={() => setSelectedArtwork(null)} artwork={selectedArtwork} />
    </div>
  );
}
