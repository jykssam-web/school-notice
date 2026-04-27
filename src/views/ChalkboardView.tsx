import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Info, Clock, Quote, UtensilsCrossed, Flag, Settings, X, CheckCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { QUOTES } from "../constants/quotes";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, collectionGroup, where, doc, getDoc, setDoc } from "firebase/firestore";
import { getMealInfo, searchSchools } from "../lib/neis";

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, data?: any) => Promise<any>;
        send: (channel: string, data?: any) => void;
      };
    };
  }
}

export default function ChalkboardView() {
  const { schoolId, channelId = "common" } = useParams();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<any[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [meal, setMeal] = useState<{ menu: string; cal: string } | null>(null);
  const [dday, setDday] = useState<{ name: string; date: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 설정 모달
  const [showSettings, setShowSettings] = useState(false);
  const [schoolCode, setSchoolCode] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [settingsStatus, setSettingsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [mealDisplayMode, setMealDisplayMode] = useState<"today" | "manual">("today");
  const [ddayEnabled, setDdayEnabled] = useState(true);
  const [ddayName, setDdayName] = useState("");
  const [ddayDate, setDdayDate] = useState("");

  // 시계
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // 초기 설정 로드
  useEffect(() => {
    if (!schoolId) return;
    const loadSettings = async () => {
      try {
        const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
        if (schoolDoc.exists()) {
          const data = schoolDoc.data();
          if (data.schoolCode && data.orgCode) {
            setSchoolCode(data.schoolCode);
            setOrgCode(data.orgCode);
          }
        }
      } catch (e) {
        console.error('설정 로드 오류:', e);
      }
    };
    loadSettings();
  }, [schoolId]);

  // 급식 불러오기
  useEffect(() => {
    if (!schoolId || !schoolCode || !orgCode) return;
    const fetchMeal = async () => {
      try {
        const mealData = await getMealInfo(schoolCode, orgCode);
        setMeal(mealData);
      } catch (e) {
        console.error('급식 로딩 오류:', e);
      }
    };
    fetchMeal();
  }, [schoolId, schoolCode, orgCode]);

  // 디데이 불러오기
  useEffect(() => {
    if (!schoolId || channelId === 'common') return;
    const fetchDday = async () => {
      try {
        const ddayDoc = await getDoc(doc(db, 'schools', schoolId, 'channels', channelId, 'settings', 'dday'));
        if (ddayDoc.exists()) {
          const data = ddayDoc.data() as { name: string; date: string };
          setDday(data);
          setDdayName(data.name);
          setDdayDate(data.date);
        }
      } catch (e) {
        console.error('디데이 로딩 오류:', e);
      }
    };
    fetchDday();
  }, [schoolId, channelId]);

  // 디데이 계산
  const calcDday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  // 공지 구독
  useEffect(() => {
    if (!schoolId || !channelId) return;

    const grade = channelId.charAt(0);
    const gradeChannel = `${grade}00`;
    const relevantChannels = ["common"];
    if (channelId !== "common") {
      relevantChannels.push(channelId);
      if (channelId.length === 3 && !channelId.endsWith("00")) {
        relevantChannels.push(gradeChannel);
      }
    }

    const q = query(
      collectionGroup(db, "notices"),
      where("schoolId", "==", schoolId),
      where("channelId", "in", relevantChannels),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotices = snapshot.docs.map(doc => {
        const d = doc.data();
        return { ...d, id: doc.id, timestamp: d.timestamp?.toDate() || new Date() };
      });

      setNotices(prev => {
        const newNotice = allNotices[0];
        const oldNotice = prev[0];
        if (newNotice && (!oldNotice || newNotice.id !== oldNotice.id)) {
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
          if (window.electron) {
            window.electron.ipcRenderer.send('show-notification', {
              title: '✨ 새로운 공지가 있습니다!',
              body: newNotice.content || '새 공지를 확인하세요.',
            });
          }
        }
        return allNotices;
      });
    }, (e) => console.error("Chalkboard Sync Error", e));

    return () => unsubscribe();
  }, [schoolId, channelId]);

  // 학교 검색
  const handleSchoolSearch = async () => {
    if (!searchQuery.trim()) return;
    setSettingsStatus("loading");
    try {
      const results = await searchSchools(searchQuery);
      setSearchResults(results);
      setSettingsStatus("idle");
    } catch (e) {
      console.error('검색 오류:', e);
      setSettingsStatus("error");
    }
  };

  // 학교 선택
  const handleSelectSchool = async (school: any) => {
    if (!schoolId) return;
    setSettingsStatus("loading");
    try {
      await setDoc(doc(db, 'schools', schoolId), {
        schoolCode: school.code,
        orgCode: school.orgCode,
        name: school.name
      }, { merge: true });
      
      setSchoolCode(school.code);
      setOrgCode(school.orgCode);
      setSettingsStatus("success");
      setTimeout(() => {
        setShowSettings(false);
        setSettingsStatus("idle");
      }, 1500);
    } catch (e) {
      console.error('저장 오류:', e);
      setSettingsStatus("error");
    }
  };

  // 디데이 저장
  const handleSaveDday = async () => {
    if (!schoolId || channelId === 'common' || !ddayName || !ddayDate) return;
    setSettingsStatus("loading");
    try {
      await setDoc(
        doc(db, 'schools', schoolId, 'channels', channelId, 'settings', 'dday'),
        { name: ddayName, date: ddayDate }
      );
      setDday({ name: ddayName, date: ddayDate });
      setSettingsStatus("success");
      setTimeout(() => setSettingsStatus("idle"), 2000);
    } catch (e) {
      console.error('디데이 저장 오류:', e);
      setSettingsStatus("error");
    }
  };

  const formattedDate = currentTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const getDailyQuote = () => {
    const daySinceEpoch = Math.floor(currentTime.getTime() / (1000 * 60 * 60 * 24));
    return QUOTES[daySinceEpoch % QUOTES.length];
  };
  const dailyQuote = getDailyQuote();

  const getQuoteFontSize = (text: string) => {
    const len = text.length;
    if (len < 20) return 'text-2xl md:text-3xl';
    if (len < 40) return 'text-xl md:text-2xl';
    if (len < 70) return 'text-base md:text-xl';
    return 'text-sm md:text-base';
  };

  const latestNotice = notices[0];
  const pastNotices = notices.slice(1);

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden text-white font-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      {/* 설정 버튼 */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-6 right-6 z-40 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 p-3 rounded-2xl transition-all text-blue-400 hover:text-blue-300"
        title="급식/디데이 설정"
      >
        <Settings size={20} />
      </button>

      {/* 설정 모달 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1A1A1A] rounded-[32px] p-8 max-w-md w-full border border-white/5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">급식 & 디데이 설정</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 학교 설정 */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-black uppercase text-neutral-500 mb-2 block">학교 검색</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="학교명 입력"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSchoolSearch()}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleSchoolSearch}
                      disabled={settingsStatus === "loading"}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl font-black text-xs disabled:opacity-50 transition-all"
                    >
                      검색
                    </button>
                  </div>
                </div>

                {/* 검색 결과 */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((school) => (
                      <button
                        key={school.code}
                        onClick={() => handleSelectSchool(school)}
                        disabled={settingsStatus === "loading"}
                        className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500 transition-all text-sm disabled:opacity-50"
                      >
                        <p className="font-bold">{school.name}</p>
                        <p className="text-xs text-neutral-500">{school.address}</p>
                      </button>
                    ))}
                  </div>
                )}

                {schoolCode && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs font-bold text-blue-400">학교 코드</p>
                    <p className="text-sm text-blue-300">{schoolCode}</p>
                  </div>
                )}
              </div>

              {/* 디데이 설정 */}
              <div className="space-y-4 mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <div>
                  <label className="text-xs font-black uppercase text-orange-600 mb-2 block">디데이 이름</label>
                  <input
                    type="text"
                    placeholder="예: 중간고사"
                    value={ddayName}
                    onChange={(e) => setDdayName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-orange-600 mb-2 block">날짜</label>
                  <input
                    type="date"
                    value={ddayDate}
                    onChange={(e) => setDdayDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleSaveDday}
                  disabled={settingsStatus === "loading"}
                  className={`w-full py-2 rounded-xl font-black text-sm transition-all ${
                    settingsStatus === "success"
                      ? "bg-green-500 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                  }`}
                >
                  {settingsStatus === "loading" ? "저장 중..." : settingsStatus === "success" ? "✓ 저장 완료" : "디데이 저장"}
                </button>
              </div>

              {settingsStatus === "error" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                  오류가 발생했습니다. 다시 시도해주세요.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1920px] w-full grid grid-cols-12 grid-rows-12 gap-8 h-[90vh] z-10">

        {/* 왼쪽 컬럼 */}
        <div className="col-span-12 lg:col-span-3 row-span-12 grid grid-rows-12 gap-8">

          {/* 시계 */}
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="row-span-3 bg-[#1A1A1A] rounded-[56px] border border-white/5 p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
            <div className="flex flex-col items-center text-center">
              <Clock size={20} className="text-blue-400 mb-3" />
              <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[10px] text-neutral-600 font-black mt-4 uppercase tracking-[0.2em]">{formattedDate}</div>
            </div>
          </motion.div>

          {/* 급식 및 디데이 */}
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="row-span-6 flex flex-col gap-6">
            
            {/* 급식: 2배 확대 */}
            <div className="flex-[2.5] bg-[#1A1A1A] rounded-[48px] border border-white/5 p-8 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 mb-4">
                <UtensilsCrossed size={16} className="text-orange-400" />
                <span className="text-[12px] font-black tracking-[0.15em] text-orange-400/80 uppercase">Today's Lunch</span>
                {meal?.cal && <span className="text-[10px] text-neutral-600 font-black">{meal.cal}</span>}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center">
                {meal ? (
                  <p className="text-white font-bold text-xl md:text-2xl leading-relaxed whitespace-pre-line text-center">{meal.menu}</p>
                ) : (
                  <p className="text-neutral-700 text-xs font-black italic text-center">급식 정보 로딩 중...</p>
                )}
              </div>
            </div>

            {/* 디데이: 가로 나열 */}
            <div className="flex-1 bg-[#1A1A1A] rounded-[48px] border border-white/5 p-6 flex items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-60px] left-[-60px] w-48 h-48 bg-purple-500/5 rounded-full blur-[80px]" />
              {dday ? (
                <div className="flex items-center justify-center gap-6 w-full">
                  <span className="text-neutral-400 text-[1.2rem] md:text-[1.5rem] font-black uppercase tracking-widest">{dday.name}</span>
                  <span className="text-white font-black text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] leading-none tracking-tighter">
                    {calcDday(dday.date)}
                  </span>
                </div>
              ) : (
                <p className="text-neutral-800 text-xs font-black uppercase italic tracking-widest">D-Day 미설정</p>
              )}
            </div>
          </motion.div>

          {/* 명언: 높이 절반 축소 */}
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="row-span-3 bg-[#1A1A1A] rounded-[48px] border border-white/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl">
            <Quote className="text-blue-500/10 mb-2" size={20} />
            <p className="text-lg md:text-2xl font-bold leading-snug text-neutral-400 italic mb-3 line-clamp-2">"{dailyQuote.text}"</p>
            <p className="text-[12px] font-black text-blue-500/50 uppercase tracking-widest">{dailyQuote.author}</p>
          </motion.div>
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="col-span-12 lg:col-span-9 row-span-12 grid grid-rows-12 gap-8">

        {/* 최신 공지 */}
          <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="row-span-4 bg-[#1A1A1A] rounded-[48px] border border-white/5 p-8 flex flex-col shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#FACC15] text-black px-4 py-1.5 text-[10px] font-black rounded-lg uppercase italic">Latest Notice</div>
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest break-keep">
                  {latestNotice ? `${new Date(latestNotice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "수신 대기 중..."}
                </span>
              </div>
              <Bell size={24} className={showNotification ? "text-[#FACC15] animate-bounce" : "text-neutral-700"} />
            </div>
            <div className="flex-1 flex flex-col justify-center relative min-h-0">
              <AnimatePresence mode="wait">
                <motion.div key={latestNotice?.timestamp || "empty"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="w-full flex flex-col items-center justify-center">
                  <h2 className="text-[#FACC15]/30 text-[12px] font-black uppercase italic mb-4 tracking-widest">
                    {latestNotice?.title || "최근 소식"}
                  </h2>
                  <p className="text-white font-bold leading-[1.4] text-center px-10 text-[3rem] md:text-[3.6rem]"
                     style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                    <span className="text-amber-300">{latestNotice?.author || ""}</span>
                    <span className="ml-4">{latestNotice?.content || "현재 전달된 새로운 공지가 없습니다."}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* 이전 공지 */}
          <div className="row-span-8 grid grid-cols-1 grid-rows-4 gap-4">
            {[0, 1, 2, 3].map((idx) => {
              const prevItem = pastNotices[idx];
              return (
                <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (idx * 0.05) }}
                  className="bg-[#1A1A1A]/60 rounded-[32px] border border-white/5 px-10 flex items-center justify-between shadow-xl backdrop-blur-md relative overflow-hidden group">
                  <div className="flex items-center gap-8 flex-1 min-w-0 h-full">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500/50" />
                      <span className="text-[12px] font-black uppercase tracking-widest text-neutral-600">#{idx + 1}</span>
                    </div>
                    {prevItem ? (
                      <div className="flex items-center gap-6 flex-1 min-w-0 overflow-hidden">
                        <p className="text-neutral-200 font-bold leading-[1.3] group-hover:text-white transition-colors text-[1.5rem] md:text-[1.8rem] line-clamp-2"
                           style={{ wordBreak: 'keep-all' }}>
                          {(prevItem.content || '').replace(/\n+/g, ' ')}
                        </p>
                        {prevItem.author && <span className="text-[12px] text-neutral-700 font-black shrink-0 italic">— {prevItem.author}</span>}
                      </div>
                    ) : (
                      <span className="text-neutral-800 text-[12px] font-black uppercase tracking-widest italic">수신 대기 중...</span>
                    )}
                  </div>
                  {prevItem && (
                    <span className="text-[11px] font-bold text-neutral-600 bg-white/5 px-4 py-2 rounded-xl border border-white/5 ml-4">
                      {new Date(prevItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.2); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250,204,21,0.4); }
      `}</style>

      {showNotification && (
        <AnimatePresence>
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 shadow-2xl z-50">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">✨ 새로운 공지가 있습니다!</h3>
                <p className="text-sm opacity-90">선생님이 전달한 메시지를 확인하세요.</p>
              </div>
              <div className="flex gap-4 shrink-0">
                <button onClick={() => setShowNotification(false)}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-black transition-all">최소화</button>
                <button onClick={() => {
                  setShowNotification(false);
                  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
                  else if ((document as any).webkitRequestFullscreen) (document as any).webkitRequestFullscreen();
                }} className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-black transition-all">전체화면</button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}