import React, { useState, useEffect } from "react";
import { Send, CheckCircle, AlertCircle, Info, QrCode, Smartphone, Monitor, ChevronLeft, LayoutGrid, Globe, Lock, Key, LogOut, X, CheckCircle2, GraduationCap, Users, Trash2, Flag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, orderBy, limit, onSnapshot, serverTimestamp, where } from "firebase/firestore";
import { setDday } from "../lib/masterAdmin";

export default function AdminView() {
  const { schoolId: routeSchoolId, channelId } = useParams();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem("user_data");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [schoolData, setSchoolData] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem("school_data");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [title, setTitle] = useState("");

  useEffect(() => {
    if (userData?.name && !title) {
      setTitle(userData.name);
    }
  }, [userData, title]);

  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [history, setHistory] = useState<any[]>([]);
  
  const [loginStage, setLoginStage] = useState<"school" | "choice" | "user">("school");
  const [userType, setUserType] = useState<"admin" | "teacher" | null>(null);
  const [adminIdInput, setAdminIdInput] = useState("");
  const [teacherNameInput, setTeacherNameInput] = useState("");
  
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"notice" | "members">("notice");
  const [members, setMembers] = useState<any[]>([]);
  const [bulkNames, setBulkNames] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);

  // 디데이 state
  const [ddayName, setDdayName] = useState("");
  const [ddayDate, setDdayDate] = useState("");
  const [ddayStatus, setDdayStatus] = useState<"idle" | "loading" | "success">("idle");
  
  const [typedSchoolId, setTypedSchoolId] = useState(routeSchoolId || "");
  const [schoolPassword, setSchoolPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (schoolData && !userData) {
      setLoginStage("choice");
    }
  }, [schoolData, userData]);

  const currentSchoolId = schoolData?.id || routeSchoolId;
  const isLanding = !channelId;
  const activeChannel = channelId || "common";

  useEffect(() => {
    if (!isLanding && schoolData?.id && activeChannel) {
      try {
        const q = query(
          collection(db, "schools", schoolData.id, "channels", activeChannel, "notices"),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return { ...d, id: doc.id, timestamp: d.timestamp?.toDate() || new Date() };
          });
          setHistory(data);
        }, (e) => console.error("History Subscription Error", e));
        return () => unsubscribe();
      } catch (e) {
        console.error("Firebase Query Error", e);
      }
    }
  }, [activeChannel, isLanding, schoolData?.id]);

  const handleSchoolLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedSchoolId || !schoolPassword) {
      setLoginError("아이디와 비밀번호를 입력하세요.");
      return;
    }
    setLoginError("");
    setStatus("loading");
    try {
      const schoolRef = doc(db, "schools", typedSchoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (schoolSnap.exists()) {
        const data = schoolSnap.data();
        if (data.schoolPassword === schoolPassword) {
          const sData = { id: typedSchoolId, name: data.name };
          setSchoolData(sData);
          sessionStorage.setItem("school_data", JSON.stringify(sData));
          setLoginStage("choice");
          setStatus("idle");
        } else {
          setLoginError("학교 비밀번호가 틀립니다.");
          setStatus("idle");
        }
      } else {
        setLoginError("존재하지 않는 학교 아이디입니다.");
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      setLoginError("데이터베이스 연결에 실패했습니다.");
      setStatus("idle");
    }
  };

  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const schoolRef = doc(db, "schools", schoolData.id);
      const schoolSnap = await getDoc(schoolRef);
      if (!schoolSnap.exists()) return;
      const school = schoolSnap.data();

      if (userType === 'admin') {
        if (adminIdInput === school.adminId) {
          const user = { name: "관리자", role: "admin", username: "admin" };
          setUserData(user);
          sessionStorage.setItem("user_data", JSON.stringify(user));
          setActiveTab("members");
          if (!routeSchoolId) navigate(`/${schoolData.id}/admin`);
        } else {
          setLoginError("관리자 아이디가 일치하지 않습니다.");
        }
      } else if (userType === 'teacher') {
        const teacherRef = doc(db, "schools", schoolData.id, "teachers", teacherNameInput);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const user = { name: teacherNameInput, role: "teacher", username: teacherNameInput };
          setUserData(user);
          sessionStorage.setItem("user_data", JSON.stringify(user));
          if (!routeSchoolId) navigate(`/${schoolData.id}/admin`);
        } else {
          setLoginError("등록된 선생님 명단에 존재하지 않습니다.");
        }
      }
    } catch (err) {
      setLoginError("서버 연결에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("school_data");
      sessionStorage.removeItem("user_data");
    } catch (e) {}
    setSchoolData(null);
    setUserData(null);
    setLoginStage("school");
    setUserType(null);
    setSchoolPassword("");
    setAdminIdInput("");
    setTeacherNameInput("");
    navigate("/admin");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setStatus("loading");
    try {
      const channelsToSend = activeChannel.split(",");
      for (const ch of channelsToSend) {
        const noticeId = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await setDoc(doc(db, "schools", schoolData.id, "channels", ch, "notices", noticeId), {
          id: noticeId,
          title: title.trim() || userData?.name || "관리자",
          content,
          authorName: userData?.name || "관리자",
          authorId: userData?.username || "admin",
          timestamp: serverTimestamp(),
          channelId: ch,
          schoolId: schoolData.id
        });
      }
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
      setTitle(userData?.name || "");
      setContent("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const handleSetDday = async () => {
    if (!ddayName || !ddayDate) {
      alert('이벤트명과 날짜를 모두 입력하세요!');
      return;
    }
    if (activeChannel === 'common' || activeChannel.includes(',')) {
      alert('디데이는 특정 반 채널에서만 설정할 수 있습니다.');
      return;
    }
    const confirmed = window.confirm(
      `'${activeChannel.charAt(0)}학년 ${parseInt(activeChannel.substring(1))}반' 담임이 맞습니까?\n\n이벤트: ${ddayName}\n날짜: ${ddayDate}`
    );
    if (!confirmed) return;
    setDdayStatus("loading");
    try {
      await setDday(schoolData.id, activeChannel, { name: ddayName, date: ddayDate });
      setDdayStatus("success");
      setTimeout(() => setDdayStatus("idle"), 3000);
    } catch (e) {
      alert('디데이 저장에 실패했습니다.');
      setDdayStatus("idle");
    }
  };

  const handleDelete = async (noticeId: string, authorId: string) => {
    const isAdmin = userData?.role === "admin";
    const isOwner = userData?.username === authorId;
    if (!isAdmin && !isOwner) {
      alert("자신이 작성한 공지만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("이 공지를 삭제(완료) 처리할까요? 전자칠판에서도 즉시 사라집니다.")) return;
    try {
      await deleteDoc(doc(db, "schools", schoolData.id, "channels", activeChannel, "notices", noticeId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClassToggle = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const fetchMembers = async () => {
    if (!schoolData) return;
    try {
      const q = query(collection(db, "schools", schoolData.id, "teachers"), orderBy("name"));
      const snapshot = await getDocs(q);
      setMembers(snapshot.docs.map(doc => ({ name: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkNames.split(/[\n,]/).map(n => n.trim()).filter(n => n);
    if (names.length === 0) return;
    setMemberLoading(true);
    try {
      let addedCount = 0;
      for (const name of names) {
        const teacherRef = doc(db, "schools", schoolData.id, "teachers", name);
        await setDoc(teacherRef, { name, schoolId: schoolData.id });
        addedCount++;
      }
      fetchMembers();
      setBulkNames("");
      alert(`${addedCount}명의 선생님이 등록되었습니다.`);
    } catch (e) { console.error(e); alert("등록 중 오류가 발생했습니다."); }
    setMemberLoading(false);
  };

  const handleDeleteMember = async (name: string) => {
    if (!window.confirm(`'${name}' 선생님을 명단에서 삭제할까요?`)) return;
    try {
      await deleteDoc(doc(db, "schools", schoolData.id, "teachers", name));
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeTab === "members") fetchMembers();
  }, [activeTab]);

  const startMultiSend = () => {
    if (selectedChannels.includes("common")) {
      navigate(`/${schoolData.id}/admin/common`);
      return;
    }
    if (selectedChannels.length === 1) {
      navigate(`/${schoolData.id}/admin/${selectedChannels[0]}`);
      return;
    }
    navigate(`/${schoolData.id}/admin/${selectedChannels.join(",")}`);
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6 font-sans text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#1A1A1A] p-10 md:p-12 rounded-[48px] border border-white/5 shadow-2xl relative z-10 text-center"
        >
          {loginStage === "school" && (
            <>
              <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <GraduationCap size={40} />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">CampusNotice</h1>
              <p className="text-neutral-500 font-medium mb-8">학교 계정으로 로그인하세요.</p>
              <form onSubmit={handleSchoolLogin} className="space-y-4">
                <div className="relative">
                  <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={20} />
                  <input type="text" placeholder="학교 아이디" value={typedSchoolId}
                    onChange={(e) => setTypedSchoolId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-lg" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={20} />
                  <input type="password" placeholder="학교 비밀번호" value={schoolPassword}
                    onChange={(e) => setSchoolPassword(e.target.value)}
                    className={`w-full bg-white/5 border ${loginError ? 'border-red-500/50' : 'border-white/10'} px-14 py-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-lg`} />
                </div>
                {loginError && <p className="text-red-500 text-sm font-bold">{loginError}</p>}
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest">학교 로그인</button>
              </form>
            </>
          )}
          {loginStage === "choice" && (
            <div className="space-y-6">
              <div className="mb-8">
                <p className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-2">{schoolData.name}</p>
                <h2 className="text-2xl font-black">사용 유형 선택</h2>
              </div>
              <button onClick={() => { setUserType("admin"); setLoginStage("user"); setLoginError(""); }}
                className="w-full bg-white/5 hover:bg-indigo-600 border border-white/10 py-8 rounded-3xl font-black text-xl transition-all shadow-xl flex flex-col items-center gap-3 group">
                <Users size={32} className="text-indigo-400 group-hover:text-white" />
                <span>관리자용 (정보부장)</span>
              </button>
              <button onClick={() => { setUserType("teacher"); setLoginStage("user"); setLoginError(""); }}
                className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 py-8 rounded-3xl font-black text-xl transition-all shadow-xl flex flex-col items-center gap-3 group">
                <GraduationCap size={32} className="text-blue-400 group-hover:text-white" />
                <span>교사용 (선생님)</span>
              </button>
              <button onClick={() => setLoginStage("school")} className="text-xs text-neutral-600 hover:text-white font-bold uppercase tracking-widest">학교 다시 선택</button>
            </div>
          )}
          {loginStage === "user" && (
            <div className="space-y-6">
              <div className="mb-8">
                <p className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-2">{schoolData.name}</p>
                <h2 className="text-2xl font-black">{userType === 'admin' ? '관리자 확인' : '선생님 성함 입력'}</h2>
              </div>
              <form onSubmit={handleUserAuth} className="space-y-4">
                {userType === 'admin' ? (
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={20} />
                    <input type="text" placeholder="관리자 아이디를 입력하세요" value={adminIdInput}
                      onChange={(e) => setAdminIdInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-lg" />
                  </div>
                ) : (
                  <div className="relative">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={20} />
                    <input type="text" placeholder="선생님의 함자를 입력하세요 (예: 정쌤)" value={teacherNameInput}
                      onChange={(e) => setTeacherNameInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-lg" />
                  </div>
                )}
                {loginError && <p className="text-red-500 text-sm font-bold">{loginError}</p>}
                <button type="submit" className={`w-full ${userType === 'admin' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl`}>
                  {userType === 'admin' ? '관리 페이지 입장' : '공지 전송 시작'}
                </button>
              </form>
              <button onClick={() => setLoginStage("choice")} className="text-xs text-neutral-600 hover:text-white font-bold uppercase tracking-widest">뒤로 가기</button>
            </div>
          )}
          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest mb-4">SaaS Edition - Ver 2.0.2</p>
            <div className="text-[10px] text-neutral-700 space-y-1">
              <p>© 2026 CampusNotice. All Rights Reserved.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const rootUrl = window.location.origin;
  const displayUrl = schoolData ? `${rootUrl}/${schoolData.id}/display/${activeChannel}` : "";

  const currentGradeClasses = selectedGrade
    ? [
        { id: `${selectedGrade}00`, label: `${selectedGrade}학년 전체`, isTotal: true },
        ...Array.from({ length: 14 }, (_, i) => ({
          id: `${selectedGrade * 100 + (i + 1)}`,
          label: `${selectedGrade}학년 ${i + 1}반`,
          isTotal: false
        }))
      ]
    : [];

  if (userData?.role === 'admin' && activeTab === 'members') {
    // 아래 members UI로 fall-through
  } else if (isLanding) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center p-6 md:p-12 font-sans text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />

        <div className="max-w-6xl w-full mb-8 relative z-20 flex justify-between items-center bg-white/5 p-4 rounded-[32px] border border-white/5 backdrop-blur-xl">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("notice")}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'notice' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>
              공지 전송
            </button>
            {userData?.role === 'admin' && (
              <button onClick={() => setActiveTab("members")}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-neutral-500 hover:text-white'}`}>
                선생님 관리
              </button>
            )}
            <button 
              onClick={() => navigate(`/${schoolData.id}/review`, { 
                state: { 
                  teacherName: userData?.name || "", 
                  teacherRole: userData?.role || "teacher", 
                  schoolName: schoolData?.name || "" 
                } 
              })}
              className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-neutral-500 hover:text-white"
            >
              후기 작성
            </button>
          </div>

          <div className="flex items-center gap-3 pr-2">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{userData?.name || "사용자"} ({userData?.role === 'admin' ? '관리자' : '교사'})</span>
            <div className="w-1 h-4 bg-white/10 rounded-full" />
            <button onClick={handleLogout} className="text-red-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest">Logout</button>
          </div>
        </div>

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="max-w-4xl w-full text-center mb-12 flex flex-col items-center relative z-10">
          <div className="flex gap-4 mb-6">
            <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg shadow-blue-500/20">
              <LayoutGrid size={18} />
              <span className="text-xs font-black uppercase tracking-widest">CampusNotice Admin</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">
            {selectedGrade ? `${selectedGrade}학년 학급 선택` : "학년 선택 (교사용)"}
          </h1>
          <p className="text-neutral-500 font-medium text-lg">
            {selectedGrade ? "공지를 보낼 학급을 선택하세요." : "공지를 전송할 학년 또는 채널을 선택하세요."}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedGrade ? (
            <motion.div key="grade-select" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl w-full flex flex-col items-center gap-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <button onClick={() => setSelectedGrade(1)}
                  className="bg-[#1A1A1A] p-12 rounded-[48px] border border-white/5 shadow-2xl hover:border-blue-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <span className="text-blue-500 group-hover:text-white font-black text-3xl">1</span>
                  </div>
                  <span className="font-black text-2xl text-white">1학년</span>
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">14 Classes</span>
                </button>
                <button onClick={() => setSelectedGrade(2)}
                  className="bg-[#1A1A1A] p-12 rounded-[48px] border border-white/5 shadow-2xl hover:border-emerald-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                    <span className="text-emerald-600 group-hover:text-white font-black text-3xl">2</span>
                  </div>
                  <span className="font-black text-2xl text-white">2학년</span>
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">14 Classes</span>
                </button>
                <button onClick={() => handleClassToggle("common")}
                  className={`p-12 rounded-[48px] shadow-2xl hover:-translate-y-1 transition-all group flex flex-col items-center gap-4 relative ${selectedChannels.includes("common") ? "ring-4 ring-blue-500 bg-blue-600/10 border-blue-500 text-white" : "bg-white text-[#111111]"}`}>
                  {selectedChannels.includes("common") && (
                    <div className="absolute top-6 right-6 text-blue-500">
                      <CheckCircle2 size={32} fill="currentColor" className="text-white" />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${selectedChannels.includes("common") ? "bg-white/10" : "bg-[#111111]/5"}`}>
                    <Smartphone size={32} />
                  </div>
                  <span className="font-black text-2xl">전체 공지</span>
                  <span className={`text-xs font-bold uppercase tracking-widest ${selectedChannels.includes("common") ? "text-blue-300" : "text-[#111111]/40"}`}>Global Broadcast</span>
                </button>
              </div>
              {selectedChannels.length > 0 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full flex justify-center">
                  <button onClick={startMultiSend}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-16 py-8 rounded-full font-black text-2xl shadow-2xl shadow-blue-500/40 flex items-center gap-4 active:scale-95 transition-all w-full max-w-md justify-center">
                    <Send size={28} />
                    <span>{selectedChannels.length}개 선택됨 - 전송하기</span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="class-select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl w-full flex flex-col items-center relative z-10">
              <button onClick={() => { setSelectedGrade(null); setActiveTab("notice"); }}
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px] mb-8">
                <ChevronLeft size={16} /> 학년 다시 선택하기
              </button>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 w-full">
                {currentGradeClasses.map((cls, idx) => {
                  const isSelected = selectedChannels.includes(cls.id);
                  return (
                    <motion.button key={cls.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.02 }}
                      onClick={() => handleClassToggle(cls.id)}
                      className={`${isSelected ? "ring-4 ring-blue-500 border-blue-500 bg-blue-600/10" : cls.isTotal ? "bg-white text-[#111111] border-transparent" : "bg-[#1A1A1A] text-white border-white/5"} p-6 md:p-8 rounded-[32px] border shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 relative`}>
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-blue-500">
                          <CheckCircle2 size={24} fill="currentColor" className="text-white" />
                        </div>
                      )}
                      <div className={`${cls.isTotal ? "bg-[#111111]/5" : "bg-white/5"} w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
                        {cls.isTotal ? <Globe size={24} /> : <span className="font-black text-xl">{cls.label.split(' ')[1].replace('반', '')}</span>}
                      </div>
                      <span className="font-bold whitespace-nowrap">{cls.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              {selectedChannels.length > 0 && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="sticky bottom-10 left-0 right-0 flex justify-center z-50 mt-12 w-full">
                  <button onClick={startMultiSend}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-full font-black text-xl shadow-2xl shadow-blue-500/40 flex items-center gap-4 active:scale-95 transition-all w-full max-w-sm justify-center">
                    <Send size={24} />
                    <span>{selectedChannels.length}개 반에 공지 쓰기</span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 relative z-10">
          <button onClick={() => navigate("/admin/help")}
            className="group flex items-center gap-4 bg-[#1A1A1A] text-white border-2 border-white/5 px-12 py-6 rounded-[32px] hover:bg-[#222222] hover:border-blue-500/50 transition-all font-black shadow-2xl active:scale-95">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="bg-blue-500 text-white p-2 rounded-lg"><Info size={20} /></div>
            </div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-blue-500 mb-0.5">Quick Guide</p>
              <p className="text-xl">스마트 게시판 사용방법 (안내)</p>
            </div>
          </button>
        </motion.div>

        <div className="mt-16 py-12 flex flex-col items-center gap-2 relative z-10 text-center w-full">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">CampusNotice Admin Interface</p>
          <div className="flex items-center gap-4">
            <p className="text-xl font-black uppercase tracking-[0.2em] text-slate-400">made by .공부하는 정쌤</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center p-6 md:p-12 font-sans text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="max-w-6xl w-full mb-8 relative z-20 flex justify-between items-center bg-white/5 p-4 rounded-[32px] border border-white/5 backdrop-blur-xl">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("notice")}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'notice' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>
            공지 전송
          </button>
          {userData?.role === 'admin' && (
            <button onClick={() => setActiveTab("members")}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-neutral-500 hover:text-white'}`}>
              선생님 관리
            </button>
          )}
          <button 
            onClick={() => navigate(`/${schoolData.id}/review`, { 
              state: { 
                teacherName: userData?.name || "", 
                teacherRole: userData?.role || "teacher", 
                schoolName: schoolData?.name || "" 
              } 
            })}
            className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-neutral-500 hover:text-white"
          >
            후기 작성
          </button>
        </div>
        <div className="flex items-center gap-3 pr-2">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{userData?.name || "사용자"} ({userData?.role === 'admin' ? '관리자' : '교사'})</span>
          <div className="w-1 h-4 bg-white/10 rounded-full" />
          <button onClick={handleLogout} className="text-red-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8 relative z-10">
        {activeTab === 'notice' ? (
          <>
            <div className="flex-[1.5] flex flex-col gap-6">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="bg-blue-600 text-white p-10 rounded-[32px] shadow-xl relative overflow-hidden">
                <button onClick={() => navigate(`/${schoolData.id}/admin`)}
                  className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold">
                  <ChevronLeft size={16} /> 학급 선택으로 이동
                </button>
                <div className="flex justify-between items-start mt-4">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">
                      {activeChannel === "common" ? "전체 공지 송신함"
                        : activeChannel.includes(',') ? `${activeChannel.split(',').length}개 반 동시 전송`
                        : activeChannel.endsWith("00") ? `${activeChannel.charAt(0)}학년 전체 송신함`
                        : `${activeChannel.charAt(0)}학년 ${parseInt(activeChannel.substring(1))}반 송신함`}
                    </h1>
                    <p className="text-white/80 font-medium italic uppercase text-xs tracking-widest">REAL-TIME CLASS HUB</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md"><Send size={32} /></div>
                </div>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="bg-[#1A1A1A] p-10 rounded-[40px] shadow-2xl border border-white/5 flex-1">
                <form onSubmit={handleSend} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-neutral-500">선생님 혹은 교과</label>
                    <input type="text" placeholder="예: 홍길동 선생님, 수학과..." value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-lg font-bold text-white placeholder:text-neutral-700" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-neutral-500">공지 내용 입력 (필수)</label>
                    <textarea required rows={6} placeholder="전달할 상세 내용을 입력하세요..." value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-6 py-5 rounded-[24px] bg-white/5 border border-white/10 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xl font-medium resize-none text-white placeholder:text-neutral-700" />
                  </div>
                  <button type="submit" disabled={status === "loading" || !content}
                    className={`w-full py-6 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${status === "success" ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 disabled:opacity-50"}`}>
                    {status === "loading" ? "전송 중..." : status === "success" ? <><CheckCircle size={28} /> 전송 완료!</> : <><Send size={28} /> 공지사항 실시간 전송</>}
                  </button>
                </form>
              </motion.div>

              {/* 디데이 설정 - 특정 반에서만 표시 */}
              {activeChannel !== 'common' && !activeChannel.includes(',') && !activeChannel.endsWith('00') && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                  className="bg-[#1A1A1A] p-10 rounded-[40px] shadow-2xl border border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-orange-500/10 p-3 rounded-2xl">
                      <Flag size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest">디데이 설정</h2>
                      <p className="text-[10px] text-neutral-600 font-bold">이 반 전용 카운트다운</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <input type="text" placeholder="이벤트명 (예: 중간고사, 체육대회)" value={ddayName}
                      onChange={(e) => setDdayName(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-white placeholder:text-neutral-700" />
                    <input type="date" value={ddayDate}
                      onChange={(e) => setDdayDate(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-white" />
                    <button onClick={handleSetDday} disabled={ddayStatus === "loading" || !ddayName || !ddayDate}
                      className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${ddayStatus === "success" ? "bg-emerald-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"}`}>
                      {ddayStatus === "loading" ? "저장 중..." :
                        ddayStatus === "success" ? <><CheckCircle size={20} /> 디데이 설정 완료!</> :
                        <><Flag size={20} /> 담임 확인 후 디데이 설정</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="bg-[#1A1A1A] p-8 rounded-[32px] shadow-2xl border border-white/5 flex flex-col">
                <div className="flex items-center gap-2 mb-6 text-neutral-500">
                  <Globe size={20} className="text-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest">전자칠판 전용 주소</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest leading-none mb-1">교실 칠판 입력용 주소 (Display URL)</p>
                      <code className="text-[13px] font-mono font-bold text-blue-400 break-all block py-1">{displayUrl}</code>
                    </div>
                    <button onClick={() => window.open(displayUrl, "_blank")}
                      className="w-full bg-white text-[#111111] hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg">
                      반영되었는지 확인하기
                    </button>
                  </div>
                  <div className="flex items-start gap-3 p-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] text-neutral-500 leading-relaxed">각 교실 칠판 브라우저에 위 주소를 입력하고 즐겨찾기해 두시면 편리하게 접속 가능합니다.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="bg-[#1A1A1A] p-8 rounded-[32px] shadow-2xl border border-white/5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-black uppercase tracking-tight">전송 이력</h2>
                  <div className="w-6 h-1 bg-blue-500 rounded-full" />
                </div>
                <div className="space-y-6 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-neutral-600 italic text-sm font-medium">아직 전송된 공지가 없습니다.</div>
                  ) : (
                    history.map((item, i) => (
                      <div key={i} className="flex justify-between items-center group border-b border-white/5 pb-4 last:border-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-all">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14px] font-bold text-neutral-300 group-hover:text-blue-500 transition-colors uppercase truncate">{item.title}</h3>
                          <p className="text-[10px] text-neutral-600 font-bold mt-0.5 uppercase tracking-wider">{item.timestamp.toLocaleTimeString()} 전송</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 text-[10px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md uppercase border border-emerald-500/20">ACTIVE</span>
                          <button onClick={() => handleDelete(item.id, item.authorId)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl transition-all shadow-lg active:scale-95" title="삭제(해결 완료)">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              <div className="bg-white/5 backdrop-blur-md p-6 rounded-[24px] flex items-center gap-4 border border-white/5">
                <div className="bg-blue-600/20 p-2 rounded-xl"><Info size={18} className="text-blue-500" /></div>
                <p className="text-[11px] leading-tight font-medium text-neutral-400">
                  전자칠판 브라우저에서 <span className="text-white font-bold">홈 화면에 추가</span>를 누르시면 바탕화면에 아이콘이 생성됩니다.
                </p>
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-[#1A1A1A] p-10 rounded-[40px] border border-white/5 shadow-2xl h-fit">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-500/10 p-3 rounded-2xl"><Users className="text-indigo-500" size={24} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">선생님 추가</h2>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600 ml-2">선생님 성함 (여러 명 가능)</label>
                  <textarea placeholder={"홍길동\n정쌤\n김철수\n(엔터나 쉼표로 구분하여 여러 명 입력 가능)"} rows={8} value={bulkNames}
                    onChange={(e) => setBulkNames(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold resize-none placeholder:text-neutral-700 text-sm" />
                </div>
                <button type="submit" disabled={memberLoading || !bulkNames.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all mt-4">
                  {memberLoading ? "처리 중..." : "명단에 일괄 추가하기"}
                </button>
              </form>
            </div>
            <div className="md:col-span-2 bg-[#1A1A1A] p-10 rounded-[40px] border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black tracking-tight uppercase">관리 중인 선생님 명단</h2>
                <span className="text-xs font-bold text-neutral-600">{members.length}명 등록됨</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((member) => (
                  <div key={member.name} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black bg-blue-500/20 text-blue-500">{member.name.charAt(0)}</div>
                      <div>
                        <p className="font-black text-lg">{member.name}</p>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">교내 인증된 선생님</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteMember(member.name)}
                      className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-white/5 rounded-[24px] border border-dashed border-white/10">
                <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                  * 각 학교의 관리자(정보부장님 등)는 소속 선생님들의 계정을 직접 관리할 수 있습니다. 선생님들의 개인정보 보호를 위해 최소한의 정보만 등록해 주세요.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-20 py-8 border-t border-white/5 w-full flex flex-col items-center gap-4 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">CampusNotice Admin Interface</p>
        <div className="flex items-center gap-6">
          <p className="text-xl font-black uppercase tracking-[0.2em] text-neutral-500">made by .공부하는 정쌤</p>
          <button onClick={handleLogout}
            className="px-4 py-1.5 bg-white/5 hover:bg-red-500/10 text-neutral-600 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2">
            <LogOut size={12} /> Logout
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F8FAFC; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}