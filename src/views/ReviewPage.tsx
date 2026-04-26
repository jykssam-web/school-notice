import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Send, CheckCircle, AlertCircle } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function ReviewPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // useLocation에서 데이터 받기
  const { teacherName = "", teacherRole = "teacher", schoolName = "학교" } = location.state || {};

  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [editName, setEditName] = useState(false);
  const [customName, setCustomName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reviews, setReviews] = useState<any[]>([]);

  // 이름 마스킹 함수
  const maskName = (fullName: string) => {
    if (!fullName || fullName.length < 2) return fullName;
    const lastName = fullName[0];
    const masked = "○".repeat(fullName.length - 1);
    return `${lastName}${masked} 선생님`;
  };

  // 사용할 선생님명 (수정했으면 customName, 아니면 마스킹된 원본)
  const displayName = editName && customName ? customName : maskName(teacherName);

// 후기 목록 조회 (임시 비활성화)
  useEffect(() => {
    setReviews([]);
  }, [schoolId]);

  // 후기 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !content.trim()) {
      alert("점수와 후기를 모두 작성해주세요!");
      return;
    }

    setStatus("loading");

    try {
      await addDoc(collection(db, "reviews"), {
        schoolId,
        schoolName,
        maskedTeacherName: displayName,
        rating,
        content: content.trim(),
        timestamp: serverTimestamp(),
        isPublic: false,
        isHighlight: false,
      });

      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        navigate(`/${schoolId}/admin`);
      }, 2000);
    } catch (error) {
      console.error("후기 저장 오류:", error);
      setStatus("error");
    }
  };

  return (
    <div style="background: #111111; min-height: 100vh; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem 1rem;">
      <div style="max-width: 600px; margin: 0 auto;">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(`/${schoolId}/admin`)}
          style="display: flex; align-items: center; gap: 0.5rem; color: #999; background: transparent; border: none; cursor: pointer; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2rem; transition: all 0.2s;"
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#3b82f6";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#999";
          }}
        >
          <ChevronLeft size={16} />
          뒤로가기
        </button>

        {/* Header */}
        <div style="margin-bottom: 3rem; text-align: center;">
          <h1 style="font-size: 32px; font-weight: 600; margin: 0 0 0.5rem; letter-spacing: -0.5px;">프로그램 사용 후기</h1>
          <p style="color: #999; font-size: 14px; margin: 0;">CampusNotice에 대한 의견을 들려주세요</p>
        </div>

        {/* Form Container */}
        <div style="background: #1A1A1A; border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; padding: 2rem; margin-bottom: 2rem;">
          <form onSubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 1.5rem;">
            {/* 점수 평가 */}
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.8rem;">평가 점수</label>

              <div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; margin-bottom: 1rem;">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    style={{
                      background:
                        rating === num
                          ? "rgba(59, 130, 246, 0.3)"
                          : "rgba(59, 130, 246, 0.1)",
                      border:
                        rating === num
                          ? "1px solid rgba(59, 130, 246, 0.8)"
                          : "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      padding: "0.6rem 0.4rem",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      color: rating === num ? "#fff" : "#888",
                      fontWeight: rating === num ? "600" : "400",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.6)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background =
                        rating === num ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.1)";
                      e.currentTarget.style.borderColor =
                        rating === num ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.3)";
                    }}
                  >
                    {num === 10 ? "🔟" : `${num}️⃣`}
                  </button>
                ))}
              </div>

              {rating && (
                <div style="text-align: center; font-size: 13px; color: #3b82f6; font-weight: 500;">
                  {rating}점 {"⭐".repeat(rating)}
                </div>
              )}
            </div>

            {/* 후기 내용 */}
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.8rem;">후기 내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="프로그램 사용 후 느낀 점을 자유롭게 작성해주세요..."
                style={{
                  width: "100%",
                  height: "100px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "0.8rem",
                  color: "white",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              />
            </div>

            {/* 학교명 */}
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 0.8rem;">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #999;">학교</span>
                <span style="color: #fff; font-weight: 500;">
                  {schoolName.substring(0, 1)}0{schoolName.substring(1)}
                </span>
              </div>
            </div>

            {/* 선생님명 */}
            <div>
              <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 0.8rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                  <span style="color: #999;">선생님</span>
                  <span style="color: #fff; font-weight: 500;">{displayName}</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <input
                  type="checkbox"
                  id="editName"
                  checked={editName}
                  onChange={(e) => setEditName(e.target.checked)}
                  style="width: 18px; height: 18px; cursor: pointer;"
                />
                <label
                  htmlFor="editName"
                  style="font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer;"
                >
                  이름 수정하기
                </label>
              </div>

              {editName && (
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="수정할 이름"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "0.6rem 0.8rem",
                    color: "white",
                    fontSize: "13px",
                    outline: "none",
                    marginTop: "0.5rem",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                />
              )}
            </div>

            {/* 상태 메시지 */}
            <AnimatePresence>
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "12px",
                    padding: "1rem",
                    color: "#ef4444",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <AlertCircle size={16} />
                  저장 중 오류가 발생했습니다.
                </motion.div>
              )}
            </AnimatePresence>

            {/* 버튼 */}
            <div style="display: grid; gridTemplateColumns: '1fr 1fr'; gap: '0.8rem';">
              <button
                type="button"
                onClick={() => navigate(`/${schoolId}/admin`)}
                disabled={status === "loading"}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#999",
                  padding: "0.8rem",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: status === "loading" ? "0.5" : "1",
                }}
                onMouseOver={(e) => {
                  if (status === "loading") return;
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseOut={(e) => {
                  if (status === "loading") return;
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#999";
                }}
              >
                취소
              </button>

              <button
                type="submit"
                disabled={status === "loading" || !rating || !content.trim()}
                style={{
                  background:
                    status === "success"
                      ? "rgba(34, 197, 94, 0.8)"
                      : "rgba(59, 130, 246, 0.8)",
                  border:
                    status === "success"
                      ? "1px solid rgba(34, 197, 94, 0.5)"
                      : "1px solid rgba(59, 130, 246, 0.5)",
                  color: "white",
                  padding: "0.8rem",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: status === "loading" ? "wait" : "pointer",
                  transition: "all 0.2s",
                  opacity:
                    status === "loading" || (!rating || !content.trim())
                      ? "0.5"
                      : "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
                onMouseOver={(e) => {
                  if (status === "loading" || !rating || !content.trim()) return;
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseOut={(e) => {
                  if (status === "loading" || !rating || !content.trim()) return;
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {status === "loading" ? (
                  <>저장 중...</>
                ) : status === "success" ? (
                  <>
                    <CheckCircle size={16} /> 저장 완료!
                  </>
                ) : (
                  <>
                    <Send size={16} /> 제출하기
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 다른 선생님들의 후기 */}
        <div style="margin-bottom: 2rem;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 1.2rem; color: #fff;">다른 선생님들의 후기</h2>

          {/* 스크롤 컨테이너 */}
          <div
            style={{
              height: "400px",
              overflowY: "auto",
              paddingRight: "8px",
              borderRadius: "16px",
            }}
          >
            {reviews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "3rem 1rem",
                  fontSize: "13px",
                }}
              >
                아직 공개된 후기가 없습니다.
                <br />
                첫 번째 후기를 남겨주세요!
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "#1A1A1A",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "16px",
                    padding: "1.2rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.8rem",
                    }}
                  >
                    <div>
                      <div style="font-size: 13px; font-weight: 600; color: #fff;">
                        {review.maskedTeacherName}
                      </div>
                      <div style="font-size: 11px; color: #666; margin-top: 0.2rem;">
                        {review.schoolName}
                      </div>
                    </div>
                    <div style="font-size: 12px; color: #3b82f6; font-weight: 600;">
                      {"⭐".repeat(review.rating)} {review.rating}점
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#ccc",
                      margin: "0.6rem 0 0",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {review.content}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}