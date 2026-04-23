import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Monitor, Send, MousePointer2, CheckCircle, Clock, Quote, Info, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HelpView() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Monitor,
      title: "교실용 설정 (전자칠판)",
      steps: [
        "실장 또는 디지털 담당 학생이 쉬는 시간에 전자칠판 바탕화면에서 '0학년 0반 전달사항' 앱을 실행합니다.\n(앱을 실행해 두지 않으면 교사의 메시지가 칠판에 표시되지 않습니다.)",
        "목록에서 해당 학급 버튼을 선택합니다.",
        "이후 교사가 전송하는 메시지가 칠판에 실시간으로 표시됩니다."
      ]
    },
    {
      icon: Send,
      title: "교사용 사용법 (관리자)",
      steps: [
        "관리자 페이지(/admin)에서 공지를 보낼 학년과 반을 선택합니다.",
        "제목(선택)과 내용(필수)을 입력하고 전송 버튼을 누릅니다.",
        "모든 학급에 알릴 때는 '전체 공지' 버튼을 이용하세요.",
        "전송 후 '반영 확인' 버튼으로 실제 화면을 미리볼 수 있습니다."
      ]
    },
    {
      icon: Info,
      title: "주요 특징 및 주의사항",
      steps: [
        "실시간 전송: 페이지 새로고침 없이 공지가 즉시 나타납니다.",
        "이중 확인: 버튼 클릭 시 수업 방해 방지를 위한 경고창이 뜹니다.",
        "부가 기능: 시계와 매일 바뀌는 오늘의 명언이 함께 표시됩니다.",
        "데이터: 공지는 서버에 실시간으로 유지되며 최신 내용이 우선 보입니다."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#111111] py-12 px-6 md:px-12 font-sans text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px] mb-8"
        >
          <ChevronLeft size={16} /> 관리자 화면으로 돌아가기
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-6 py-2 rounded-full mb-6 shadow-xl shadow-blue-500/20">
            <GraduationCap size={20} />
            <span className="text-xs font-black uppercase tracking-widest">User Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">스마트 게시판 사용 가이드</h1>
          <p className="text-neutral-500 text-lg font-medium">선생님과 학생의 원활한 소통을 위한 디지털 안내서입니다.</p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1A1A1A] p-8 md:p-10 rounded-[40px] shadow-2xl border border-white/5"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl">
                  <section.icon size={24} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
              </div>

              <div className="space-y-4">
                {section.steps.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-white/5 text-neutral-500 text-[10px] font-black flex items-center justify-center shrink-0 mt-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {sIdx + 1}
                    </div>
                    <p className="text-neutral-400 font-medium leading-relaxed whitespace-pre-line">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-white p-10 rounded-[48px] text-[#111111] overflow-hidden relative"
        >
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4">개발 목적</h3>
            <p className="text-[#111111]/70 leading-relaxed font-medium">
              기존의 아날로그 종이 공지나 메신저의 한계를 넘어, 교실의 전자칠판을 활용해 
              <strong> 학교 전체 또는 학급별 공지를 실시간으로 시각화</strong>하기 위해 개발되었습니다. 
              수업 방해를 최소화하면서도 중요한 정보를 학생들에게 효과적으로 전달할 수 있습니다.
            </p>
          </div>
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
        </motion.div>
        
      <div className="mt-12 py-8 border-t border-white/5 flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-700">
          CampusNotice System Manual v1.0
        </p>
        <p className="text-xl font-black uppercase tracking-[0.2em] text-neutral-600">
          made by .공부하는 정쌤
        </p>
      </div>
      </div>
    </div>
  );
}
