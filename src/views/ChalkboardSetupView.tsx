import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';

export default function ChalkboardSetupView() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [isSetup, setIsSetup] = useState(false);

  // 저장된 설정 로드
  useEffect(() => {
    const loadSetup = async () => {
      if (window.electron) {
        const saved = await window.electron.ipcRenderer.invoke('load-setup');
        if (saved) {
          setSchoolId(saved.schoolId);
          setClassId(saved.classId);
          setIsSetup(true);
        }
      } else {
        // Electron이 아닌 경우 (웹 버전)
        const webSaved = localStorage.getItem('chalkboardSetup');
        if (webSaved) {
          const { schoolId: savedSchoolId, classId: savedClassId } = JSON.parse(webSaved);
          setSchoolId(savedSchoolId);
          setClassId(savedClassId);
          setIsSetup(true);
        }
      }
    };
    loadSetup();
  }, []);

  // 설정 저장
 const handleSave = async () => {
  if (!schoolId || !classId) {
    alert('학교 ID와 학급을 모두 입력하세요!');
    return;
  }

  const setupData = { schoolId, classId };

  if (window.electron) {
    // Electron 버전
    await window.electron.ipcRenderer.invoke('save-setup', setupData);
    // URL 직접 변경
    window.location.hash = `#/${schoolId}/display/${classId}`;
  } else {
    // 웹 버전
    localStorage.setItem('chalkboardSetup', JSON.stringify(setupData));
    setIsSetup(true);
    navigate(`/${schoolId}/display/${classId}`);
  }
};
  // 설정 수정
  const handleReset = async () => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('delete-setup');
    } else {
      localStorage.removeItem('chalkboardSetup');
    }
    setIsSetup(false);
    setSchoolId('');
    setClassId('');
  };

  useEffect(() => {
    if (isSetup && schoolId && classId) {
      navigate(`/${schoolId}/display/${classId}`);
    }
  }, [isSetup, schoolId, classId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-black text-center mb-8 text-gray-800">
          📺 전자칠판 설정
        </h1>

        <div className="space-y-4">
          {/* 학교 ID 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              학교 ID
            </label>
            <input
              type="text"
              placeholder="예: sjms"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-black"
            />
          </div>

          {/* 학급 선택 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              학급 선택
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-black"
            >
              <option value="">선택하세요</option>
              {[1, 2, 3].map((grade) => (
                <optgroup key={grade} label={`${grade}학년`}>
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((classNum) => (
                    <option key={`class${grade}${classNum.toString().padStart(2, '0')}`} value={`class${grade}${classNum.toString().padStart(2, '0')}`}>
                      {grade}학년 {classNum}반
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-lg transition-all mt-6"
          >
            저장 및 시작
          </button>
        </div>
      </motion.div>

      {/* 설정 수정 버튼 (우측 하단) */}
      {isSetup && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleReset}
          className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-900 text-white p-4 rounded-full shadow-lg transition-all"
          title="설정 변경"
        >
          <Settings size={24} />
        </motion.button>
      )}
    </div>
  );
}