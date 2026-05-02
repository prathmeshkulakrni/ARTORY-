import { useState } from 'react';
import toast from 'react-hot-toast';
import { Flag } from 'lucide-react';
import api from '../services/api';

const reasons = [
  { value: 'fake-user', label: 'This is not real user' },
  { value: 'ownership', label: 'This art/comic is not created by this user' },
  { value: 'illegal', label: 'An illegal post' },
  { value: 'other', label: 'Other' }
];

export default function ReportButton({ targetType, targetId, compact = false }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('fake-user');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (reason === 'other' && (!details.trim() || details.trim().length > 100)) {
      toast.error('Describe the problem in 1 to 100 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reports', { targetType, targetId, reason, details });
      toast.success('Report submitted');
      setOpen(false);
      setReason('fake-user');
      setDetails('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={compact ? 'text-xs text-red-400 hover:text-red-300 flex items-center gap-1' : 'btn-outline text-red-400 border-red-500/40 hover:bg-red-500 hover:text-white flex items-center gap-2'}
      >
        <Flag size={compact ? 14 : 16} /> Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Report Content</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">X</button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {reasons.map((item) => (
                <label key={item.value} className="flex items-start gap-3 text-sm text-gray-300 p-3 rounded-xl border border-dark-border">
                  <input
                    type="radio"
                    name="report-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                    className="mt-1"
                  />
                  <span>{item.label}</span>
                </label>
              ))}

              {reason === 'other' && (
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 100))}
                  placeholder="Write the problem in 100 characters"
                  className="input h-24 resize-none"
                  required
                />
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
