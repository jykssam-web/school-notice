import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Send, CheckCircle } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ReviewPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { teacherName = "", schoolName = "학교" } = location.state || {};

  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [editName, setEditName] = useState(false);
  const [customName, setCustomName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reviews] = useState<any[]>([]);

  const maskName = (fullName: string) => {
    if (!fullName || fullName.length < 2) return fullName;
    const lastName = fullName[0];
    const masked = "○".repeat(fullName.length - 1);
    return `${lastName}${masked} 선생님`;
  };

  const displayName = editName && customName ? customName : maskName(teacherName);

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
        navigate(`/${schoolId}/admin`);
      }, 2000);
    } catch (error) {
      console.error("저장 오류:", error);
      setStatus("error");
    }
  };

  return (
    <div style={{ background: "#111111", minHeight: "100vh", color: "white", fontFamily: "sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(`/${schoolId}/admin`)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#999", background: "transparent", border: "none", cursor: "pointer", marginBottom: "2rem", fontSize: "13px", fontWeight: "600" }}
        >
          <ChevronLeft size={16} /> 뒤로가기
        </button>

        <div style={{ marginBottom: "3rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "600", margin: "0 0 0.5rem" }}>프로그램 사용 후기</h1>
          <p style={{ color: "#999", fontSize: "14px", margin: "0" }}>CampusNotice에 대한 의견을 들려주세요</p>
        </div>

        <div style={{ background: "#1A1A1A", borderRadius: "32px", padding: "2rem", marginBottom: "2rem", border: "1px solid rgba(255,255,255,0.05)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* 점수 */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>평가 점수</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px", marginBottom: "1rem" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    style={{
                      background: rating === num ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.1)",
                      border: rating === num ? "1px solid rgba(59, 130, 246, 0.8)" : "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      padding: "0.6rem 0.4rem",
                      fontSize: "14px",
                      cursor: "pointer",
                      color: rating === num ? "#fff" : "#888",
                      fontWeight: rating === num ? "600" : "400",
                    }}
                  >
                    {num}️⃣
                  </button>
                ))}
              </div>
              {rating && <div style={{ textAlign: "center", fontSize: "13px", color: "#3b82f6", fontWeight: "500" }}>{rating}점 {"⭐".repeat(rating)}</div>}
            </div>

            {/* 후기 */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>후기 내용</label>
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
              />
            </div>

            {/* 학교명 */}
            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px", padding: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#999" }}>학교</span>
                <span style={{ color: "#fff", fontWeight: "500" }}>{schoolName}</span>
              </div>
            </div>

            {/* 선생님명 */}
            <div>
              <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px", padding: "0.8rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#999" }}>선생님</span>
                  <span style={{ color: "#fff", fontWeight: "500" }}>{displayName}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  id="editName"
                  checked={editName}
                  onChange={(e) => setEditName(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="editName" style={{ fontSize: "12px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer" }}>
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
                />
              )}
            </div>

            {/* 버튼 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
              <button
                type="button"
                onClick={() => navigate(`/${schoolId}/admin`)}
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
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={status === "loading" || !rating || !content.trim()}
                style={{
                  background: status === "success" ? "rgba(34, 197, 94, 0.8)" : "rgba(59, 130, 246, 0.8)",
                  border: status === "success" ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(59, 130, 246, 0.5)",
                  color: "white",
                  padding: "0.8rem",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: status === "loading" ? "wait" : "pointer",
                  transition: "all 0.2s",
                  opacity: status === "loading" || (!rating || !content.trim()) ? "0.5" : "1",
                }}
              >
                {status === "loading" ? "저장 중..." : status === "success" ? "✓ 저장 완료!" : "제출하기"}
              </button>
            </div>
          </form>
        </div>

        {/* 다른 후기 (빈 상태) */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 1.2rem", color: "#fff" }}>다른 선생님들의 후기</h2>
          <div style={{ height: "200px", textAlign: "center", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}>
            아직 공개된 후기가 없습니다.
          </div>
        </div>
      </div>
    </div>
  );
}