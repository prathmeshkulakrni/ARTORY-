import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Filter, IndianRupee, Plus, Search, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';

const categories = ['All', 'Sketching', 'Digital Art', 'Painting', 'Anime Art', 'Logo Design', 'Portrait', 'Calligraphy', 'Comics', 'Other'];
const statuses = ['Open', 'Pending', 'Done', 'Closed', 'All'];

export default function MarketplaceFeed() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: 'All', status: 'Open', minBudget: '', maxBudget: '', sort: 'latest' });
  const [query, setQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== 'All') params.set(key, value);
      if (key === 'status' && value === 'All') params.set(key, value);
    });
    setLoading(true);
    api.get(`/marketplace/requests?${params.toString()}`)
      .then(res => setRequests(res.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(req =>
      req.title.toLowerCase().includes(q) ||
      req.description.toLowerCase().includes(q) ||
      req.category.toLowerCase().includes(q)
    );
  }, [requests, query]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Art Request Marketplace</h1>
          <p className="text-gray-400 mt-1">Find custom art briefs, apply with your samples, and work through private project chat.</p>
        </div>
        <Link to="/marketplace/create" className="btn-primary inline-flex items-center justify-center gap-2">
          <Plus size={18} /> Create Request
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-surface/30 p-4 shadow-2xl">
        <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative xl:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0c0d0f] pl-9 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/60" placeholder="Search requests..." />
          </div>
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0c0d0f] px-4 py-3 text-sm text-white outline-none focus:border-primary/60">
            {categories.map(category => <option key={category}>{category}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0c0d0f] px-4 py-3 text-sm text-white outline-none focus:border-primary/60">
            {statuses.map(status => <option key={status}>{status}</option>)}
          </select>
          <input type="number" min="0" value={filters.minBudget} onChange={e => setFilters({ ...filters, minBudget: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0c0d0f] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/60" placeholder="Min budget" />
          <input type="number" min="0" value={filters.maxBudget} onChange={e => setFilters({ ...filters, maxBudget: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0c0d0f] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/60" placeholder="Max budget" />
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
          <SlidersHorizontal size={15} />
          <button onClick={() => setFilters({ ...filters, sort: 'latest' })} className={filters.sort === 'latest' ? 'text-primary font-semibold' : 'hover:text-white'}>Latest requests</button>
          <span>/</span>
          <button onClick={() => setFilters({ ...filters, sort: 'budget-high' })} className={filters.sort === 'budget-high' ? 'text-primary font-semibold' : 'hover:text-white'}>Highest budget</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filteredRequests.length === 0 ? (
        <div className="card text-center py-16">
          <Filter size={34} className="mx-auto text-gray-600 mb-3" />
          <p className="text-white font-semibold">No matching requests</p>
          <p className="text-sm text-gray-500 mt-1">Try changing category, status, or budget filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map(request => (
            <Link key={request._id} to={`/marketplace/requests/${request._id}`} className="card block p-5 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <span className="badge bg-primary/10 text-primary border border-primary/20">{request.category}</span>
                <span className={`badge ${request.status === 'Open' ? 'bg-green-500/10 text-green-300' : request.status === 'Done' ? 'bg-blue-500/10 text-blue-300' : 'bg-amber-500/10 text-amber-300'}`}>
                  {request.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-4 line-clamp-2">{request.title}</h2>
              <p className="text-sm text-gray-400 mt-2 line-clamp-3">{request.description}</p>
              <div className="flex flex-wrap gap-3 mt-5 text-sm text-gray-300">
                <span className="flex items-center gap-1.5"><IndianRupee size={15} /> {request.budget.min.toLocaleString()} - {request.budget.max.toLocaleString()}</span>
                <span className="flex items-center gap-1.5"><CalendarDays size={15} /> {new Date(request.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-dark-border">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {request.creator?.username?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-sm text-gray-400">{request.creator?.username}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
