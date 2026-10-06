import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    Play, Search, ChevronLeft, ChevronRight, Lock, Wrench, Mic, Star, BookOpen, Volume2,
} from 'lucide-react';
import Navbar from './Navbar';
import API_BASE from '../config/api';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import Seo from './Seo';

const toAbsoluteUrl = (u) => (u && u.startsWith('/')) ? `${API_BASE}${u}` : u;

// The four Speaking branches (ported from the VN tree). 'documents' is the existing
// public materials list below, unchanged.
const SECTIONS = [
    { key: 'mock', label: 'Mock Test', icon: Mic,
      blurb: 'Take a mock test with an AI examiner' },
    { key: 'forecast', label: 'Forecast Topics', icon: Star,
      blurb: 'Practise forecast topics' },
    { key: 'lessons', label: 'Pronunciation Lessons', icon: Volume2,
      blurb: 'Learn pronunciation lesson by lesson' },
    { key: 'documents', label: 'Documents', icon: BookOpen,
      blurb: 'Browse Speaking materials' },
];

// Animated bars on the hero card + the "new" tag next to the title.
const PAGE_CSS = `
@keyframes spk-bar { 0%, 100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
.spk-bar { animation: spk-bar 1.15s ease-in-out infinite; transform-origin: center; }

@keyframes spk-tag-sway { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(-4deg); } }
@keyframes spk-tag-sheen { 0% { transform: translateX(-140%) skewX(-18deg); } 55%, 100% { transform: translateX(320%) skewX(-18deg); } }
@keyframes spk-tag-in { from { opacity: 0; transform: rotate(-16deg) translateX(-10px); } to { opacity: 1; transform: rotate(-7deg); } }
.spk-tag {
  position: relative;
  overflow: hidden;
  transform-origin: left center;
  border-radius: 11px;
  clip-path: polygon(0% 50%, 19px 0%, 100% 0%, 100% 100%, 19px 100%);
  animation: spk-tag-in .45s ease-out both, spk-tag-sway 4.5s ease-in-out .45s infinite;
}
.spk-tag-sheen {
  position: absolute; top: 0; bottom: 0; left: 0; width: 34%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
  animation: spk-tag-sheen 3.8s ease-in-out 1s infinite;
}
@media (prefers-reduced-motion: reduce) {
  .spk-bar, .spk-tag, .spk-tag-sheen { animation: none; }
  .spk-tag { transform: rotate(-7deg); }
  .spk-tag-sheen { display: none; }
}
`;

// Shown only when the backend gate (/student/speaking/access) closes Speaking.
const SpeakingMaintenance = ({ onBack }) => (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#eb7e37]/10 flex items-center justify-center mx-auto mb-5">
                <Wrench className="text-[#eb7e37]" size={30} strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-[#2b5356] mb-3">Feature update in progress</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
                Speaking is being upgraded. We will reopen it as soon as it is ready;
                Listening, Reading and Writing work as usual.
            </p>
            <button
                onClick={onBack}
                className="px-6 py-2.5 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90] transition-colors"
            >
                Back to home
            </button>
        </div>
    </div>
);

const Speaking_Fe = () => {
    const navigate = useNavigate();
    const [userStatus, setUserStatus] = useState({
        role: localStorage.getItem('role'),
        isVIP: false
    });
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [username, setUsername] = useState('');
    const dropdownRef = useRef(null);
    const topicsPerPage = 6;
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const selectedPart = params.get('part') || 'part1';
    // Hub section: ?section=documents opens the materials list directly.
    const initialSection = SECTIONS.some((sec) => sec.key === params.get('section'))
        ? params.get('section') : 'mock';
    const [section, setSection] = useState(initialSection);
    const [gate, setGate] = useState('open');   // open | locked

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        const currentUser = localStorage.getItem('username');
        if (currentUser) {
            setUsername(currentUser);
        }

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                if (!token) {
                    const materialsResponse = await fetch(`${API_BASE}/public/speaking/materials?part=part1`);
                    if (materialsResponse.ok) {
                        const data = await materialsResponse.json();
                        const formatted = data.map(m => ({
                            id: m.material_id,
                            title: m.title || 'Untitled',
                            part_type: m.part_type,
                            pdf_url: toAbsoluteUrl(m.pdf_url),
                            created_at: m.created_at || new Date().toISOString(),
                            has_access: false
                        }));
                        setMaterials(formatted);
                    }
                } else {
                    // Speaking gate (open to all accounts today). Only an explicit "closed"
                    // answer locks the page — a network hiccup must not hide Speaking.
                    try {
                        const gateRes = await fetchWithTimeout(`${API_BASE}/student/speaking/access`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const gateData = await gateRes.json().catch(() => ({}));
                        if (gateRes.status === 503 || (gateRes.ok && gateData.allowed === false)) {
                            setGate('locked');
                            return;
                        }
                    } catch (e) { /* fail open */ }

                    // Always fetch Part 1 only (Speaking Forecast)
                    const materialsResponse = await fetchWithTimeout(`${API_BASE}/student/speaking/materials?part=part1`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (materialsResponse.ok) {
                        const data = await materialsResponse.json();
                        const formatted = data.map(m => ({
                            id: m.material_id,
                            title: m.title || 'Untitled',
                            part_type: m.part_type,
                            pdf_url: toAbsoluteUrl(m.pdf_url),
                            created_at: m.created_at || new Date().toISOString(),
                            has_access: m.has_access
                        }));
                        setMaterials(formatted);
                    } else if (materialsResponse.status === 401) {
                        navigate('/login');
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setMaterials([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);
    const [sortOrder, setSortOrder] = useState('alphabet');

    const filteredTopics = materials
        .filter(test => test.has_access)
        .filter(test => test.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            switch (sortOrder) {
                case 'alphabet':
                    return a.title.localeCompare(b.title);
                case 'latest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                default:
                    return a.title.localeCompare(b.title);
            }
        });

    const indexOfLastTopic = currentPage * topicsPerPage;
    const indexOfFirstTopic = indexOfLastTopic - topicsPerPage;
    const currentTopics = filteredTopics.slice(indexOfFirstTopic, indexOfLastTopic);
    const totalPages = Math.max(1, Math.ceil(filteredTopics.length / topicsPerPage));

    const renderTopicCard = (m) => (
        <div key={m.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    <span className="text-[#0096b1] font-normal italic mr-2">Speaking:</span>
                    <span className="text-gray-700">{m.title}</span>
                </h3>
                <div className="space-y-4 mb-8">
                    <div className="flex items-center text-gray-600 bg-gray-50 py-2 px-3 rounded-lg">
                        <span className="font-medium">Speaking Practice</span>
                    </div>
                </div>
                <button
                    disabled={!m.has_access}
                    onClick={() => {
                        if (!localStorage.getItem('token')) {
                            navigate('/login');
                            return;
                        }
                        if (m.has_access) {
                            navigate(`/speaking_test_room`, {
                                state: {
                                    title: m.title,
                                    pdfUrl: m.pdf_url,
                                    partType: m.part_type
                                }
                            });
                        }
                    }}
                    className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 font-semibold shadow-md ${m.has_access
                        ? 'bg-[#0096b1] text-white hover:bg-[#eb7e37] hover:shadow-lg'
                        : 'bg-gray-400 text-gray-100 cursor-not-allowed'
                        }`}
                >
                    {m.has_access ? <Play className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    <span>{m.has_access ? 'View PDF' : 'Locked'}</span>
                </button>
            </div>
        </div>
    );

    const active = SECTIONS.find((sec) => sec.key === section) || SECTIONS[0];
    // Hero copy per branch. The numbers in `meta` mirror how the backend assembles a
    // paper (app/utils/speaking_assemble.py).
    const HERO = {
        mock: {
            tag: 'MOCK TEST',
            note: 'Full Part 1–2–3 test',
            title: 'Take the Speaking test with an AI examiner',
            desc: 'Answer by voice in the real Part 1 – 2 – 3 order, timed like the real exam, '
                + 'or practise at your own pace with hints and vocabulary for every question.',
            cta: 'Start a mock test', to: '/speaking_test_setup',
            caption: 'Examiner ready',
            meta: ['3 parts', 'About 15 minutes', '1 free test per day'],
        },
        forecast: {
            tag: 'FORECAST',
            note: 'Forecast topics by exam month',
            title: 'Practise forecast topics',
            desc: 'Pick exactly the topic you want to practise and answer every question in it.',
            cta: 'View forecast topics', to: '/speaking_forecast',
            caption: 'Forecast topics ready',
            meta: ['Practise each Part separately', 'No timer', 'Retry as often as you like'],
        },
        lessons: {
            tag: 'PRONUNCIATION',
            note: '',
            title: 'Learn pronunciation theory and practise with AI',
            desc: '',
            cta: 'Open pronunciation lessons', to: '/speaking_lessons',
            caption: 'Ready to practise',
            meta: ['Theory for every lesson', 'AI scores sounds and word stress', 'Your own practice set'],
        },
    }[section];

    const goTo = (to) => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        navigate(to);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading speaking topics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Seo
                title="IELTS Speaking Materials | Practice"
                description={`Practice your IELTS Speaking skills. Includes materials like ${materials.slice(0, 3).map(m => m.title).join(', ')}...`}
                path="/speaking_list"
            />
            <style>{PAGE_CSS}</style>
            <Navbar />

            {gate === 'locked' ? (
                <SpeakingMaintenance onBack={() => navigate('/')} />
            ) : (
            <>
            <div className="max-w-7xl mx-auto px-4 py-4">
                <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                        <li><Link to="/" className="text-[#0096b1] hover:text-lime-500">Home</Link></li>
                        <li><span className="text-gray-400 mx-2">/</span></li>
                        <li><span className="text-[#0096b1] font-medium">Speaking Practice</span></li>
                    </ol>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-2">
                <header className="mt-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-[#2b5356]">
                            Speaking
                        </h1>
                        <span className="spk-tag -ml-1 sm:ml-0 inline-flex items-center gap-2.5 bg-[#d97a3c]
                                         py-2.5 pl-7 pr-5 text-[13px] font-extrabold uppercase
                                         tracking-[0.12em] text-white">
                            <span aria-hidden="true"
                                  className="h-2 w-2 shrink-0 rounded-full bg-white/85" />
                            New
                            <span aria-hidden="true" className="spk-tag-sheen" />
                        </span>
                    </div>
                </header>

                {/* The four Speaking branches, one large card each. */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {SECTIONS.map((sec) => {
                        const on = section === sec.key;
                        return (
                            <button key={sec.key} onClick={() => setSection(sec.key)}
                                    aria-current={on ? 'page' : undefined}
                                    className={`rounded-2xl border-2 p-5 text-left transition-colors ${on
                                            ? 'border-[#0096b1] bg-[#0096b1]/8'
                                            : 'border-gray-200 bg-white hover:border-[#0096b1]/50'}`}>
                                <sec.icon className={`h-7 w-7 ${on ? 'text-[#0096b1]' : 'text-[#2b5356]'}`} />
                                <p className={`mt-3 text-xl font-extrabold leading-tight ${
                                    on ? 'text-[#0096b1]' : 'text-[#2b5356]'}`}>
                                    {sec.label}
                                </p>
                                <p className="mt-1.5 text-[15px] leading-snug text-gray-500">{sec.blurb}</p>
                            </button>
                        );
                    })}
                </div>

                {HERO && (
                    <section className="relative mt-6 mb-8 overflow-hidden rounded-[22px] text-white"
                             style={{ background: '#2b5356' }}>
                        <div aria-hidden="true"
                             className="pointer-events-none absolute -right-[6%] top-1/2 hidden lg:block"
                             style={{ width: 440, height: 440, marginTop: -220, borderRadius: '50%',
                                      background: 'rgba(255,255,255,0.06)' }} />
                        <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="rounded-full bg-white/15 px-3 py-1 text-[13px] font-bold">
                                        Speaking
                                    </span>
                                    <span className="rounded-full px-3 py-1 text-[12px] font-extrabold
                                                     tracking-[0.1em] text-white"
                                          style={{ background: 'rgba(0,0,0,0.22)' }}>
                                        {HERO.tag}
                                    </span>
                                    {HERO.note && (
                                        <span className="text-[13px] font-semibold text-white/70">{HERO.note}</span>
                                    )}
                                </div>
                                <h2 className="mt-4 max-w-2xl text-[24px] sm:text-[30px] font-extrabold
                                               leading-[1.2] tracking-tight">
                                    {HERO.title}
                                </h2>
                                {HERO.desc && (
                                    <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/80">
                                        {HERO.desc}
                                    </p>
                                )}
                                <button onClick={() => goTo(HERO.to)}
                                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl
                                                   bg-[#eb7e37] px-6 py-3 text-[15px] font-bold text-white
                                                   transition-colors hover:bg-[#d86f2b]">
                                    <active.icon className="h-5 w-5" />
                                    {HERO.cta}
                                </button>
                                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2
                                                text-[13px] font-semibold text-white/70">
                                    {HERO.meta.map((m, i) => (
                                        <React.Fragment key={m}>
                                            {i > 0 && <span aria-hidden="true" className="text-white/30">•</span>}
                                            <span>{m}</span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-center gap-3 lg:pr-4">
                                <div className="flex h-[132px] w-[132px] items-center justify-center
                                                rounded-[24px] bg-white">
                                    <img src="/img/logo-ielts.png" alt="AI examiner"
                                         className="h-[112px] w-[112px] object-contain" />
                                </div>
                                <div className="flex h-7 items-center gap-[3px]">
                                    {Array.from({ length: 18 }, (_, i) => (
                                        <span key={i} className="spk-bar block w-[3px] rounded-full bg-white/85"
                                              style={{ height: Math.round(28 * (0.3 + 0.7 * Math.abs(Math.sin((i + 1) * 1.7)))),
                                                       animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
                                    ))}
                                </div>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/75">
                                    {HERO.caption}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {section === 'documents' && (
                <>
                <div className="flex flex-col md:flex-row gap-4 mb-8 mt-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search topics..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="alphabet">By Alphabet</option>
                        <option value="latest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentTopics.length === 0 ? (
                        <div className="col-span-full text-center text-lime-600 py-12">No data to display</div>
                    ) : (
                        currentTopics.map(topic => renderTopicCard(topic))
                    )}
                </div>

                <div className="flex justify-center items-center space-x-4 mt-5">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                    </button>
                    <span className="text-gray-600 font-bold">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5 " strokeWidth={3} />
                    </button>
                </div>
                </>
                )}
            </div>
            </>
            )}
        </div>
    );
};

export default Speaking_Fe;
