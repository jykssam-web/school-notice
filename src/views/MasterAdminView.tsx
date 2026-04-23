import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, Plus, School, Trash2, Key, LogOut, CheckCircle, Smartphone, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";

export default function MasterAdminView() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [loginError, setLoginError] = useState(false);

  // New School Form
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const fetchSchools = async () => {
    try {
      const q = query(collection(db, "schools"), orderBy("name"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Master password check (can still be local/env based for now)
    const correctMasterPassword = "master1234";
    if (password === correctMasterPassword) {
      setIsAuth(true);
      fetchSchools();
    } else {
      setLoginError(true);
      setPassword("");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await setDoc(doc(db, "schools", newId), {
        id: newId,
        name: newName,
        schoolPassword: newPassword,
        adminId: newAdminId || "admin"
      });
      
      setStatus("success");
      fetchSchools();
      setNewName("");
      setNewId("");
      setNewPassword("");
      setNewAdminId("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      console.error(e);
      alert("등록 실패");
      setStatus("idle");
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-neutral-900 p-10 rounded-[40px] border border-white/5 text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">Business Console</h1>
          <p className="text-neutral-500 text-sm mb-8 font-bold">마스터 비밀번호를 입력하십시오.</p>
          <form onSubmit={handleMasterLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-red-500 transition-all font-mono text-center text-lg"
              autoFocus
            />
            {loginError && <p className="text-red-500 text-xs font-bold">Access Denied.</p>}
            <button className="w-full bg-red-600 hover:bg-neutral-100 hover:text-black py-4 rounded-2xl font-black transition-all">
              UNLOCK CONSOLE
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 md:p-12 text-white font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Header */}
        <div className="col-span-12 flex justify-between items-center mb-8 bg-neutral-900/50 p-8 rounded-[32px] border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">SaaS Admin Center</h1>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mt-1">School Accounts & Security Management</p>
            </div>
          </div>
          <button onClick={() => setIsAuth(false)} className="text-neutral-500 hover:text-white flex items-center gap-2 font-bold text-xs">
            <LogOut size={16} /> EXIT CONSOLE
          </button>
        </div>

        {/* School Factory (Register) */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="bg-neutral-900 p-8 rounded-[40px] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-2 mb-8">
              <Plus className="text-red-500" size={20} />
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400">신규 학교 등록</h2>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-600 ml-2">학교 명칭</label>
                <input 
                  required
                  placeholder="예: 서전고등학교"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-600 ml-2">학교 아이디 (Slug)</label>
                <input 
                  required
                  placeholder="예: sjhs"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-600 ml-2">관리자 비밀번호 (학교 공용)</label>
                <input 
                  required
                  type="password"
                  placeholder="예: 1234"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-600 ml-2">정보부장 아이디 (Admin ID)</label>
                <input 
                  required
                  placeholder="예: admin"
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <button 
                type="submit"
                disabled={status === "loading"}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  status === "success" ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-white hover:text-black"
                }`}
              >
                {status === "loading" ? "Processing..." : status === "success" ? "Registered!" : "Create School Account"}
              </button>
            </form>
          </div>
        </div>

        {/* School List */}
        <div className="col-span-12 md:col-span-8">
          <div className="bg-neutral-900 p-8 rounded-[40px] border border-white/5 shadow-2xl min-h-[500px]">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2 text-neutral-400">
                 <School size={20} />
                 <h2 className="text-sm font-black uppercase tracking-widest">수익 창출 중인 학교 목록</h2>
               </div>
               <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-neutral-500">{schools.length} Schools Active</span>
             </div>

             <div className="space-y-4">
               {schools.map((school) => (
                 <motion.div 
                   layout
                   key={school.id}
                   className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.05] transition-all"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-neutral-400">
                       <School size={20} />
                     </div>
                     <div>
                       <h3 className="text-lg font-black">{school.name}</h3>
                       <div className="flex items-center gap-3 mt-1">
                         <span className="text-[10px] font-mono text-blue-500 font-black uppercase">ID: {school.id}</span>
                         <span className="text-[10px] font-mono text-neutral-600 font-bold uppercase">PW: {school.schoolPassword}</span>
                          <span className="text-[10px] font-mono text-amber-500 font-black uppercase">ADMIN: {school.adminId}</span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     <button 
                        onClick={() => window.open(`/${school.id}/admin`, "_blank")}
                        className="p-3 bg-white/5 hover:bg-blue-600 rounded-xl text-neutral-500 hover:text-white transition-all"
                        title="관리자 페이지"
                     >
                       <Key size={16} />
                     </button>
                     <button 
                        onClick={() => window.open(`/${school.id}`, "_blank")}
                        className="p-3 bg-white/5 hover:bg-emerald-600 rounded-xl text-neutral-500 hover:text-white transition-all"
                        title="학생용 랜딩"
                     >
                       <Globe size={16} />
                     </button>
                   </div>
                 </motion.div>
               ))}
               
               {schools.length === 0 && (
                 <div className="text-center py-20 text-neutral-700 italic font-medium">
                   아직 등록된 학교가 없습니다. 상공의 기회를 잡으세요!
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-neutral-700">
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">CampusNotice Master Control v1.0.0</p>
      </div>
    </div>
  );
}
