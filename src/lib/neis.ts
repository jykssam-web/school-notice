export const searchSchools = async (schoolName: string) => {
  try {
    const response = await fetch(
      `https://open.neis.go.kr/hub/schoolInfo?KEY=38f26a7f15144a908c9d4587a6b8ad6d&Type=json&pSize=100&SCHUL_NM=${encodeURIComponent(schoolName)}`
    );
    const data = await response.json();

    if (data.schoolInfo && Array.isArray(data.schoolInfo)) {
      const rows = data.schoolInfo[1]?.row;
      if (!Array.isArray(rows)) return [];

      return rows.map((school: any) => ({
        name: school.SCHUL_NM,
        code: school.SD_SCHUL_CODE,
        orgCode: school.ATPT_OFCDC_SC_CODE, // 교육청 코드 추가
        address: school.ORG_RDNMA || school.ORG_RDNADDR || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('학교 검색 오류:', error);
    return [];
  }
};

export const getMealInfo = async (schoolCode: string, orgCode: string) => {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const response = await fetch(
      `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=38f26a7f15144a908c9d4587a6b8ad6d&Type=json&ATPT_OFCDC_SC_CODE=${orgCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${today}`
    );
    const data = await response.json();

    if (data.mealServiceDietInfo && Array.isArray(data.mealServiceDietInfo)) {
      const rows = data.mealServiceDietInfo[1]?.row;
      if (!Array.isArray(rows)) return null;

      const lunch = rows.find((r: any) => r.MMEAL_SC_NM === '중식') || rows[0];
      if (!lunch) return null;

      return {
        menu: lunch.DDISH_NM
  .replace(/<br\/>/g, '\n')        // 줄바꿈 처리
  .replace(/\([^)]*\)/g, '')       // (1.9.13) 같은 알레르기 번호 제거
  .replace(/\s+/g, ' ')            // 여분 공백 정리
  .split('\n').map((s: string) => s.trim()).filter(Boolean).join('\n'),
        cal: lunch.CAL_INFO
      };
    }
    return null;
  } catch (error) {
    console.error('급식 오류:', error);
    return null;
  }
};