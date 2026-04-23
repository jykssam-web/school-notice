import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LayoutGrid, Users, Settings, Monitor, GraduationCap, ChevronLeft } from "lucide-react";

export default function LandingView() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const getChannelsByGrade = (grade: number) => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: (grade * 100 + (i + 1)).toString(),
      name: `${grade}학년 ${i + 1}반`,
      icon: Users,
      color: i % 2 === 0 ? "from-indigo-500 to-blue-500" : "from-emerald-500 to-teal-500"
    }));
  };

  const navPrefix = schoolId ? `/${schoolId}` : "/sjms";

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden text-white font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12 relative z-10"
      >
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-2xl mb-6 backdrop-blur-xl">
          <Monitor className="text-blue-500" size={18} />
          <span className="text-xs font-black tracking-[0.3em] uppercase opacity-60">Smart Board Setup</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">
          {selectedGrade ? `${selectedGrade}학년 선택` : "학년 선택"}
        </h1>
        <p className="text-neutral-500 text-lg font-medium tracking-tight">
          {selectedGrade 
            ? "전자칠판에 표시할 학급을 선택해주세요." 
            : schoolId === "sjms" || !schoolId
              ? "서전중학교 스마트 게시판 시스템에 오신 것을 환영합니다."
              : "스마트 게시판 시스템에 오신 것을 환영합니다."}
        </p>
      </motion.div>

      <div className="w-full max-w-7xl relative z-10">
        <AnimatePresence mode="wait">
          {!selectedGrade ? (
            <motion.div 
              key="grade-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            >
              <button
                onClick={() => setSelectedGrade(1)}
                className="group relative p-12 bg-[#1A1A1A] rounded-[48px] border border-white/5 hover:border-blue-500/50 transition-all duration-300 text-center overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                <h3 className="text-4xl font-black mb-2 tracking-tighter">1학년</h3>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Freshman Division</p>
              </button>

              <button
                onClick={() => setSelectedGrade(2)}
                className="group relative p-12 bg-[#1A1A1A] rounded-[48px] border border-white/5 hover:border-emerald-500/50 transition-all duration-300 text-center overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                <h3 className="text-4xl font-black mb-2 tracking-tighter">2학년</h3>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Sophomore Division</p>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="class-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setSelectedGrade(null)}
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs mb-4"
              >
                <ChevronLeft size={16} /> 학년 다시 선택하기
              </button>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {getChannelsByGrade(selectedGrade).map((channel, index) => (
                  <motion.button
                    key={channel.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => navigate(`${navPrefix}/display/${channel.id}`)}
                    className="group relative p-6 bg-[#1A1A1A] rounded-[32px] border border-white/5 hover:border-white/20 transition-all duration-300 text-center overflow-hidden shadow-2xl"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${channel.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                        <channel.icon className="text-white opacity-80" size={24} />
                      </div>
                      <h3 className="text-xl font-black tracking-tight mb-1">{channel.name}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Display</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20 flex flex-col items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md relative z-10"
      >
        <div className="flex items-center gap-4">
          <GraduationCap className="text-blue-500" size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Integrated Classroom System v2.6</span>
        </div>
        <p className="text-xl font-black uppercase tracking-[0.2em] text-white/40 pt-2 border-t border-white/5 w-full text-center">
          made by .공부하는 정쌤
        </p>
      </motion.div>
    </div>
  );
}
