import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API_BASE from '../config/api';

// Homepage "Latest News" box, ported from the Vietnam tree. Content is managed
// from the admin dashboard (/announcements) and served publicly from
// GET /announcements. Important items are pinned to the top by the API.
// Renders nothing until at least one announcement is published.
const AnnouncementsSection = () => {
  const [items, setItems] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/announcements`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => { if (!cancelled) { setItems(Array.isArray(data) ? data : []); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Nothing published yet: don't render an empty box.
  if (loaded && items.length === 0) return null;

  const COLLAPSED_COUNT = 4;
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hasMore = items.length > COLLAPSED_COUNT;

  const fmtDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return ''; }
  };

  const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  };

  const RowContent = ({ item }) => (
    <>
      {/* animated left accent bar on hover */}
      <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-gradient-to-b from-[#0096b1] to-[#2b5356] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
      {/* icon chip */}
      <span className="shrink-0 grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0096b1]/10 to-[#2b5356]/10 text-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        {item.icon || '✦'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-base md:text-lg text-gray-800 transition-colors group-hover:text-[#0096b1] ${item.is_important ? 'font-bold' : 'font-medium'}`}>
            {item.title || item.content}
          </span>
          {item.is_important && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#eb7e37] bg-[#eb7e37]/10 rounded-full px-2 py-0.5">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4v5l3 3-1 1-4-1-4 4v-2l4-4-1-4 3-3h4z" /></svg>
              Important
            </span>
          )}
        </div>
        {item.created_at && <div className="text-xs text-gray-400 mt-0.5">{fmtDate(item.created_at)}</div>}
      </div>
      {/* arrow */}
      <span className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-gray-300 transition-all duration-300 group-hover:text-white group-hover:bg-[#0096b1] group-hover:translate-x-0.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
      </span>
    </>
  );

  const rowClass = "group relative flex items-center gap-4 px-5 md:px-7 py-4 transition-colors hover:bg-gradient-to-r hover:from-[#0096b1]/[0.06] hover:to-transparent";

  return (
    <div className="max-w-4xl mx-auto px-4 relative z-10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white rounded-[28px] border border-gray-100 overflow-hidden shadow-[0_24px_70px_-24px_rgba(0,150,177,0.35)]"
      >
        {/* decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#0096b1]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#eb7e37]/10 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center gap-3.5 px-6 md:px-8 py-5 bg-gradient-to-r from-[#0096b1] via-[#0d8ba3] to-[#2b5356] text-white overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_-20%,white,transparent_40%)]" />
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
            className="relative grid place-items-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          </motion.div>
          <div className="relative">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-wide leading-tight">Latest News</h2>
            <div className="flex items-center gap-1.5 text-xs text-white/85 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Updated regularly
            </div>
          </div>
        </div>

        {/* List */}
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="relative divide-y divide-gray-50"
        >
          {visibleItems.map(item => (
            <motion.li key={item.announcement_id} variants={itemVariants}>
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className={rowClass}>
                  <RowContent item={item} />
                </a>
              ) : (
                <Link to={`/news/${item.announcement_id}`} className={rowClass}>
                  <RowContent item={item} />
                </Link>
              )}
            </motion.li>
          ))}
        </motion.ul>

        {/* Footer / View all */}
        {hasMore && (
          <div className="relative p-4 border-t border-gray-50">
            <button
              onClick={() => setExpanded(!expanded)}
              className="group w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-base font-semibold text-[#0096b1] bg-[#0096b1]/[0.06] hover:bg-[#0096b1]/10 transition-colors"
            >
              {expanded ? 'Show less' : `View all (${items.length})`}
              <svg className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AnnouncementsSection;
