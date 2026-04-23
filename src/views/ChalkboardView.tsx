import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, Info, Clock, Calendar, Quote } from "lucide-react";
import { useParams } from "react-router-dom";
import { QUOTES } from "../constants/quotes";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, collectionGroup, where } from "firebase/firestore";

export default function ChalkboardView() {
  const { schoolId, channelId = "common" } = useParams();
  const [notices, setNotices] = useState<any[]>([]); // Store up to 7 notices
  const [showNotification, setShowNotification] = useState(false);

  // Real-time Clock and Date
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (!schoolId) return;

    // We need to listen to 3 channels:
    // 1. common notice
    // 2. grade-wide notice (if applicable)
    // 3. specific class notice
    
    const grade = channelId.charAt(0);
    const gradeChannel = `${grade}00`;
    
    const relevantChannels = ["common"];
    if (channelId !== "common") {
      relevantChannels.push(channelId);
      if (channelId.length === 3 && !channelId.endsWith("00")) {
        relevantChannels.push(gradeChannel);
      }
    }

    // Since onSnapshot on multiple collections is tricky, 
    // we can either use collectionGroup OR sub-subscriptions.
    // Given the structure, collectionGroup (notices) with schoolId filter is best.
    
    const q = query(
      collectionGroup(db, "notices"),
      where("schoolId", "==", schoolId),
      where("channelId", "in", relevantChannels),
      orderBy("timestamp", "desc"),
      limit(7)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotices = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          timestamp: d.timestamp?.toDate() || new Date()
        };
      });
      
      // Check for new notice to trigger animation
      setNotices(prev => {
        const newNotice = allNotices[0];
        const oldNotice = prev[0];
        if (newNotice && (!oldNotice || newNotice.id !== oldNotice.id)) {
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
        }
        return allNotices;
      });
    }, (e) => {
      console.error("Chalkboard Sync Error", e);
    });

    return () => unsubscribe();
  }, [schoolId, channelId]);

  const formattedDate = currentTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // Select daily quote based on the date
  const getDailyQuote = () => {
    const daySinceEpoch = Math.floor(currentTime.getTime() / (1000 * 60 * 60 * 24));
    return QUOTES[daySinceEpoch % QUOTES.length];
  };
  const dailyQuote = getDailyQuote();

  // Dynamic Font Size logic
  const getFontSize = (text: string, isMain: boolean) => {
    const len = text.length;
    const newlineCount = (text.match(/\n/g) || []).length;
    
    // Each newline counts as extra length for visual crowding
    const effectiveLen = len + (newlineCount * 25);

    if (isMain) {
      if (effectiveLen > 200) return '1.5rem';
      if (effectiveLen > 150) return '1.8rem';
      if (effectiveLen > 100) return '2.2rem';
      if (effectiveLen > 50) return '2.6rem';
      return '3.2rem';
    } else {
      if (effectiveLen > 100) return '0.9rem';
      if (effectiveLen > 50) return '1.1rem';
      if (effectiveLen > 30) return '1.3rem';
      return '1.5rem';
    }
  };

  const latestNotice = notices[0];
  const pastNotices = notices.slice(1);

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden text-white font-sans">
      {/* Background decoration - subtle grid feel */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      {/* Main Dashboard Grid */}
      <div className="max-w-[1920px] w-full grid grid-cols-12 grid-rows-12 gap-8 h-[90vh] z-10">
        
        {/* LEFT COLUMN: Infrastructure (Clock & Quote) */}
        <div className="col-span-12 lg:col-span-3 row-span-12 grid grid-rows-12 gap-8">
          
          {/* TOP AREA: Clock (Reduced row-span) */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="row-span-6 bg-[#1A1A1A] rounded-[56px] border border-white/5 p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
                <Clock className="text-[#3B82F6]" size={16} />
                <span className="text-[8px] font-black tracking-[0.3em] opacity-40 uppercase italic">Digital Core</span>
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-[3rem] md:text-[5rem] font-black leading-none tracking-tighter text-white tabular-nums flex items-baseline flex-wrap">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                <span className="text-blue-500 animate-pulse mx-1">:</span>
                <span className="text-2xl md:text-4xl opacity-20">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
              </h1>
              <p className="text-lg md:text-xl font-black mt-2 text-neutral-500 tracking-tight">{formattedDate}</p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-4">
              <div className="bg-[#111111] p-3 rounded-2xl border border-white/5 shadow-inner">
                <Info size={20} className="text-[#3B82F6]" />
              </div>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight leading-none">
                {channelId !== "common" && channelId.length === 3
                  ? `${channelId.charAt(0)}학년 ${parseInt(channelId.substring(1))}반`
                  : channelId === "common" 
                    ? "전체 공통" 
                    : `${channelId} 채널`}
              </h3>
            </div>
          </motion.div>

          {/* BOTTOM AREA: Quote (Increased row-span) */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="row-span-6 bg-[#1A1A1A] rounded-[56px] border border-white/5 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex flex-col items-center max-w-[90%]">
              <Quote className="text-blue-500/20 mb-4 group-hover:scale-110 transition-transform duration-500" size={24} />
              <p className="text-xl md:text-2xl lg:text-3xl font-black leading-tight text-neutral-200 italic mb-6 tracking-tight">
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

        {/* RIGHT COLUMN: Notice Display Area (row-span-12) */}
        <div className="col-span-12 lg:col-span-9 row-span-12 grid grid-rows-12 gap-8">
          
          {/* TOP: NEWEST NOTICE (row-span-4) - Reduced size */}
          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="row-span-4 bg-[#1A1A1A] rounded-[48px] border border-white/5 p-6 md:p-8 flex flex-col shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
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
                <motion.div 
                  key={latestNotice?.timestamp || "empty"}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="w-full h-full flex flex-col"
                >
                  <h2 className="text-[#FACC15]/40 text-[10px] font-black uppercase italic tracking-tighter mb-1 text-center shrink-0">
                    {latestNotice?.title || "최근 소식"}
                  </h2>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="min-h-full flex flex-col justify-center text-center py-2">
                      <p 
                        className="text-white font-black leading-[1.3] px-2"
                        style={{ 
                          fontSize: getFontSize(latestNotice?.content || "", true),
                          wordBreak: 'keep-all',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {latestNotice?.content || "현재 전달된 새로운 공지가 없습니다."}
                      </p>
                      {latestNotice?.author && (
                        <p className="text-[#FACC15] text-[12px] font-black mt-4 opacity-70">
                          — {latestNotice.author} 선생님
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* BOTTOM: PREVIOUS NOTICES (row-span-8) - List of 6 */}
          <div className="row-span-8 grid grid-cols-1 grid-rows-6 gap-4">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const prevItem = pastNotices[idx];
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.05) }}
                  className="bg-[#1A1A1A]/60 rounded-3xl border border-white/5 px-8 flex items-center justify-between shadow-xl backdrop-blur-md relative overflow-hidden group"
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 opacity-50" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">#{idx + 1}</span>
                    </div>
                    
                    {prevItem ? (
                      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
                        <p 
                          className="text-neutral-300 font-bold leading-tight group-hover:text-white transition-colors truncate"
                          style={{ 
                            fontSize: getFontSize(prevItem.content, false),
                            wordBreak: 'keep-all',
                          }}
                        >
                          {prevItem.content}
                        </p>
                        {prevItem.author && (
                          <span className="text-[10px] text-neutral-700 font-black shrink-0">— {prevItem.author}</span>
                        )}
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.2);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.4);
        }
      `}</style>
    </div>
  );
}
