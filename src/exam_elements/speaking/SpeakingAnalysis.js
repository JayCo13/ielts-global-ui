// Trang phân tích một bài thi, mở riêng bằng link (docs/speaking-spec.md §6.1).
//
// Toàn bộ nội dung nằm ở `AnalysisPanel` vì màn kết quả cũng hiển thị đúng thứ đó trong
// tab "Phân tích". Trang này chỉ là cái vỏ: thanh tiêu đề, tải dữ liệu, xử lý lỗi.
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { fetchAnalysis } from './speakingApi';
import AnalysisPanel from './AnalysisPanel';

const SpeakingAnalysis = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const attemptId = location.state?.attemptId;

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        if (!attemptId) { setError('There is no test to analyse.'); setLoading(false); return; }
        setLoading(true);
        fetchAnalysis(attemptId)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [attemptId]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#0096b1]" size={32} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
                    <AlertCircle className="mx-auto text-[#eb7e37] mb-4" size={30} />
                    <p className="text-gray-700 mb-6">{error || 'Could not load the data.'}</p>
                    <button onClick={() => navigate('/speaking_list')}
                            className="px-6 py-2.5 rounded-lg bg-[#0096b1] text-white font-semibold hover:bg-[#007a90]">
                        Back to Speaking
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} aria-label="Back"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                        <ChevronLeft size={22} />
                    </button>
                    <div className="grow min-w-0">
                        <h1 className="text-lg font-bold text-[#2b5356]">Detailed analysis</h1>
                        <p className="text-sm text-gray-500">
                            {(data.parts || []).map((p) => p.label).join(' · ')} · {data.questions.length} questions
                        </p>
                    </div>
                    {data.overall_band != null && (
                        <span className="px-3 py-1.5 rounded-lg bg-[#0096b1]/12 text-[#0096b1] text-base font-bold tabular-nums">
                            {Number(data.overall_band).toFixed(1)}
                        </span>
                    )}
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 pt-5">
                {error && (
                    <p className="mb-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
                    </p>
                )}
                <AnalysisPanel
                    data={data}
                    onError={setError}
                    onOpenQuestion={(qid) => navigate('/speaking_question', {
                        state: {
                            questionId: qid, attemptId,
                            back: { to: '/speaking_analysis', state: { attemptId } },
                        },
                    })}
                    onRetake={(res) => navigate('/speaking_test', {
                        state: { attemptId: res.attempt_id, plan: res.plan },
                    })}
                />
            </div>
        </div>
    );
};

export default SpeakingAnalysis;
