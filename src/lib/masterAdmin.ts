import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

export interface School {
  id: string;
  name: string;
  schoolId: string;
  schoolPassword: string;
  adminId: string;
  schoolCode: string;
  orgCode: string;
  createdAt: string;
}

export const getSchools = async (): Promise<School[]> => {
  try {
    const schoolsRef = collection(db, 'schools');
    const snapshot = await getDocs(schoolsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as School));
  } catch (error) {
    console.error('학교 조회 오류:', error);
    throw error;
  }
};

export const addSchool = async (school: Omit<School, 'id'>) => {
  try {
    const schoolRef = collection(db, 'schools');
    const docRef = await addDoc(schoolRef, {
      ...school,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('학교 추가 오류:', error);
    throw error;
  }
};

export const updateSchool = async (schoolId: string, data: Partial<School>) => {
  try {
    await updateDoc(doc(db, 'schools', schoolId), data);
  } catch (error) {
    console.error('학교 수정 오류:', error);
    throw error;
  }
};

export const deleteSchool = async (schoolId: string) => {
  try {
    await deleteDoc(doc(db, 'schools', schoolId));
  } catch (error) {
    console.error('학교 삭제 오류:', error);
    throw error;
  }
};

export const setDday = async (schoolId: string, channelId: string, event: { name: string; date: string }) => {
  try {
    await setDoc(doc(db, 'schools', schoolId, 'channels', channelId, 'settings', 'dday'), {
      name: event.name,
      date: event.date,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('디데이 저장 오류:', error);
    throw error;
  }
};