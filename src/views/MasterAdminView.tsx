import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addSchool, getSchools, updateSchool, deleteSchool, School } from '../lib/masterAdmin';
import { searchSchools } from "../lib/neis";
const MASTER_PASSWORD = 'rhdwlsms0!';

export default function MasterAdminView() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    schoolPassword: '',
    adminId: '',
    schoolCode: '',
    orgCode: '', // NEIS 학교 코드
  });

  // 로그인
  const handleLogin = () => {
    if (password === MASTER_PASSWORD) {
      setIsLoggedIn(true);
      loadSchools();
      setPassword('');
    } else {
      alert('비밀번호가 틀렸습니다!');
      setPassword('');
    }
  };

  // 학교 목록 로드
  const loadSchools = async () => {
    try {
      const schoolsList = await getSchools();
      setSchools(schoolsList);
    } catch (error) {
      alert('학교 목록을 불러올 수 없습니다.');
    }
  };

  // 학교 검색
  const handleSearchSchool = async () => {
    if (!schoolName.trim()) {
      alert('학교명을 입력하세요!');
      return;
    }
    setIsSearching(true);
    const results = await searchSchools(schoolName);
    setSearchResults(results);
    setIsSearching(false);
  };

  // 검색된 학교 선택
  const handleSelectSchool = (school: any) => {
    setFormData({
      ...formData,
      name: school.name,
      schoolCode: school.code,
      orgCode: school.orgCode,
    });
    setSearchResults([]);
    setSchoolName("");
  };

  // 새 학교 추가
  const handleAddSchool = async () => {
    if (!formData.name || !formData.schoolId || !formData.schoolPassword || !formData.adminId) {
      alert('모든 필드를 입력하세요!');
      return;
    }

    try {
      await addSchool({
        ...formData,
        id: formData.schoolId,
        createdAt: new Date().toISOString(),
      });
      alert('학교가 추가되었습니다!');
      setFormData({ name: '', schoolId: '', schoolPassword: '', adminId: '', schoolCode: '' });
      setShowAddForm(false);
      loadSchools();
    } catch (error) {
      alert('학교 추가에 실패했습니다.');
    }
  };

  // 학교 삭제
  const handleDeleteSchool = async (schoolId: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteSchool(schoolId);
        alert('학교가 삭제되었습니다!');
        loadSchools();
      } catch (error) {
        alert('학교 삭제에 실패했습니다.');
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">마스터 관리자</h1>
          
          <input
            type="password"
            placeholder="마스터 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">학교 관리</h1>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              navigate('/admin');
            }}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            로그아웃
          </button>
        </div>

        {/* 학교 추가 버튼 */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition mb-6"
        >
          {showAddForm ? '취소' : '새 학교 추가'}
        </button>

        {/* 학교 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">새 학교 추가</h2>
            
            {/* 학교 검색 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                1단계: 학교 검색
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="학교명 입력 (예: 서전중학교)"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSchool()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                />
                <button
                  onClick={handleSearchSchool}
                  disabled={isSearching}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {isSearching ? '검색중...' : '검색'}
                </button>
              </div>

              {/* 검색 결과 */}
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((school, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSchool(school)}
                      className="w-full text-left p-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-100 transition"
                    >
                      <p className="font-semibold text-gray-800">{school.name}</p>
                      <p className="text-xs text-gray-600">{school.address}</p>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && schoolName && !isSearching && (
                <p className="mt-2 text-sm text-red-600">검색 결과가 없습니다.</p>
              )}
            </div>

            {/* 선택된 학교 정보 */}
            {formData.name && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-bold text-gray-700">선택된 학교:</p>
                <p className="text-lg font-semibold text-green-600">{formData.name}</p>
              </div>
            )}

            {/* 추가 정보 입력 */}
            <label className="block text-sm font-bold text-gray-700 mb-2">
              2단계: 추가 정보 입력
            </label>

            <input
              type="text"
              placeholder="학교 ID (예: sjms)"
              value={formData.schoolId}
              onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />

            <input
              type="text"
              placeholder="학교 비밀번호"
              value={formData.schoolPassword}
              onChange={(e) => setFormData({ ...formData, schoolPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />

            <input
              type="text"
              placeholder="관리자 ID"
              value={formData.adminId}
              onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />

            <button
              onClick={handleAddSchool}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              추가
            </button>
          </div>
        )}

        {/* 학교 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <div key={school.id} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{school.name}</h3>
              
              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <p><span className="font-semibold">학교 ID:</span> {school.schoolId}</p>
                <p><span className="font-semibold">비밀번호:</span> {school.schoolPassword}</p>
                <p><span className="font-semibold">관리자 ID:</span> {school.adminId}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/${school.schoolId}/admin`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  접속
                </button>
                <button
                  onClick={() => handleDeleteSchool(school.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {schools.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p className="text-xl">등록된 학교가 없습니다.</p>
            <p className="mt-2">새 학교를 추가해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}