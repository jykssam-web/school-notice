import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Info, Clock, Quote, UtensilsCrossed, Flag } from "lucide-react";
import { useParams } from "react-router-dom";
import { QUOTES } from "../constants/quotes";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, collectionGroup, where, doc, getDoc } from "firebase/firestore";
import { getMealInfo } from "../lib/neis";

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, data?: any) => Promise<any>;
      };
    };
  }
}

export default function ChalkboardView() {
  const { schoolId, channelId = "common" } = useParams();
  const [notices, setNotices] = useState<any[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [meal, setMeal] = useState<{ menu: string; cal: string } | null>(null);
  const [dday, setDday] = useState<{ name: string; date: string } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // 급식 불러오기
  useEffect(() => {
    if (!schoolId) return;
    const fetchMeal = async () => {
      try {
        const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
        if (!schoolDoc.exists()) return;
        const { schoolCode, orgCode } = schoolDoc.data();
        if (!schoolCode || !orgCode) return;
        const mealData = await getMealInfo(schoolCode, orgCode);
        setMeal(mealData);
      } catch (e) {
        console.error('급식 로딩 오류:', e);
      }
    };
    fetchMeal();
  }, [schoolId]);

  // 디데이 불러오기
  useEffect(() => {
    if (!schoolId || channelId === 'common') return;
    const fetchDday = async () => {
      try {
        const ddayDoc = await getDoc(doc(db, 'schools', schoolId, 'channels', channelId, 'settings', 'dday'));
        if (ddayDoc.exists()) {
          setDday(ddayDoc.data() as { name: string; date: string });
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
    if (diff === 0) return 'D-Day!';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

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

      <div className="max-w-[1920px] w-full grid grid-cols-12 grid-rows-12 gap-8 h-[90vh] z-10">

        {/* 왼쪽 컬럼 */}
        <div className="col-span-12 lg:col-span-3 row-span-12 grid grid-rows-12 gap-8">

          {/* 시계 */}
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="row-span-3 bg-[#1A1A1A] rounded-[56px] border border-white/5 p-8 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
            <div className="flex flex-col items-center">
              <h1 className="text-[2.5rem] md:text-[3.5rem] font-black leading-none tracking-tighter text-white tabular-nums flex items-baseline gap-1">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                <span className="text-blue-500 animate-pulse mx-1">:</span>
                <span className="text-xl md:text-2xl opacity-20">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
              </h1>
              <p className="text-sm font-black mt-2 text-neutral-500 tracking-tight text-center">{formattedDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <Info size={13} className="text-[#3B82F6]" />
              <span className="text-[11px] font-black text-neutral-500 uppercase tracking-widest">
                {channelId !== "common" && channelId.length === 3
                  ? `${channelId.charAt(0)}학년 ${parseInt(channelId.substring(1))}반`
                  : channelId === "common" ? "전체 공통" : `${channelId} 채널`}
              </span>
            </div>
          </motion.div>

          {/* 급식 + 디데이 (좌우 반반) */}
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }}
            className="row-span-4 flex gap-4">

            {/* 급식 */}
            <div className="flex-1 bg-[#1A1A1A] rounded-[40px] border border-white/5 px-4 pt-4 pb-5 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-[-60px] right-[-60px] w-48 h-48 bg-orange-500/5 rounded-full blur-[80px]" />
              <div className="flex items-center justify-center gap-2 mb-3">
                <UtensilsCrossed size={12} className="text-orange-400" />
                <span className="text-[10px] font-black tracking-[0.15em] text-orange-400/80 uppercase">Lunch</span>
                {meal?.cal && <span className="text-[9px] text-neutral-600 font-black">{meal.cal}</span>}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {meal ? (
                  <p className="text-white font-bold text-xs leading-relaxed whitespace-pre-line text-center">{meal.menu}</p>
                ) : (
                  <p className="text-neutral-700 text-[10px] font-black uppercase tracking-widest italic text-center mt-2">급식 정보 없음</p>
                )}
              </div>
            </div>

            {/* 디데이 */}
            <div className="flex-1 bg-[#1A1A1A] rounded-[40px] border border-white/5 px-4 pt-4 pb-5 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-60px] left-[-60px] w-48 h-48 bg-purple-500/5 rounded-full blur-[80px]" />
              <div className="flex items-center justify-center gap-2 mb-3">
                <Flag size={12} className="text-purple-400" />
                <span className="text-[10px] font-black tracking-[0.15em] text-purple-400/80 uppercase">D-Day</span>
              </div>
              {dday ? (
                <div className="text-center">
                  <p className="text-white font-black text-3xl md:text-4xl tracking-tighter">
                    {calcDday(dday.date)}
                  </p>
                  <p className="text-neutral-500 text-[11px] font-black mt-2 uppercase tracking-widest">{dday.name}</p>
                </div>
              ) : (
                <p className="text-neutral-700 text-[10px] font-black uppercase tracking-widest italic text-center">미설정</p>
              )}
            </div>
          </motion.div>

          {/* 명언 */}
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="row-span-5 bg-[#1A1A1A] rounded-[56px] border border-white/5 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex flex-col items-center max-w-[90%]">
              <Quote className="text-blue-500/20 mb-4 group-hover:scale-110 transition-transform duration-500" size={24} />
              <p className={`${getQuoteFontSize(dailyQuote.text)} font-black leading-tight text-neutral-200 italic mb-6 tracking-tight`}>
                "{dailyQuote.text}"
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-10 h-[2px] bg-blue-500/30 rounded-full" />
                <p className="text-xs md:text-sm font-black text-blue-500 uppercase tracking-[0.3em]">{dailyQuote.author}</p>
                <div className="w-10 h-[2px] bg-blue-500/30 rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="col-span-12 lg:col-span-9 row-span-12 grid grid-rows-12 gap-8">

          {/* 최신 공지 */}
          <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="row-span-4 bg-[#1A1A1A] rounded-[48px] border border-white/5 p-6 md:p-8 flex flex-col shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#FACC15] text-black px-4 py-1.5 text-[10px] font-black rounded-lg uppercase italic">Latest Notice</div>
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest break-keep">
                  {latestNotice ? `${new Date(latestNotice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "수신 대기 중..."}
                </span>
              </div>
              <Bell size={20} className={showNotification ? "text-[#FACC15] animate-bounce" : "text-neutral-700"} />
            </div>
            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                <motion.div key={latestNotice?.timestamp || "empty"} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                  className="w-full h-full flex flex-col">
                  <h2 className="text-[#FACC15]/40 text-[10px] font-black uppercase italic tracking-tighter mb-1 text-center shrink-0">
                    {latestNotice?.title || "최근 소식"}
                  </h2>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="min-h-full flex flex-col justify-center text-center py-2">
                      <p className="text-white font-black leading-[1.3] px-2 text-2xl"
                        style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {latestNotice?.content || "현재 전달된 새로운 공지가 없습니다."}
                      </p>
                      {latestNotice?.author && (
                        <p className="text-[#FACC15] text-[12px] font-black mt-4 opacity-70">— {latestNotice.author} 선생님</p>
                      )}
                    </div>
                  </div>
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
                  className="bg-[#1A1A1A]/60 rounded-3xl border border-white/5 px-8 flex items-center justify-between shadow-xl backdrop-blur-md relative overflow-hidden group">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 opacity-50" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">#{idx + 1}</span>
                    </div>
                    {prevItem ? (
                      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
                        <p className="text-neutral-300 font-bold leading-tight group-hover:text-white transition-colors truncate text-sm" style={{ wordBreak: 'keep-all' }}>
                          {prevItem.content}
                        </p>
                        {prevItem.author && <span className="text-[10px] text-neutral-700 font-black shrink-0">— {prevItem.author}</span>}
                      </div>
                    ) : (
                      <span className="text-neutral-800 text-[10px] font-black uppercase tracking-widest italic">수신 대기 중</span>
                    )}
                  </div>
                  {prevItem && (
                    <span className="text-[10px] font-bold text-neutral-600 bg-white/5 px-3 py-1 rounded-lg ml-4">
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