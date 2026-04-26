import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory version of a school database for commercial POC
  // In production, this would be a persistent SQL/NoSQL DB
  let schools = new Map<string, { id: string, name: string, schoolPassword: string, adminId: string }>();
  let schoolTeachers = new Map<string, Set<string>>(); // schoolId -> Set of teacher names
  let channels = new Map<string, Map<string, any[]>>(); // schoolId -> Map<channelId, clients[]>
  let schoolNotices = new Map<string, Map<string, any[]>>(); // schoolId -> Map<channelId, notices[]>

  // Initial school and user
  const setupInitialSchool = () => {
    schools.set("sjms", { id: "sjms", name: "서전중학교", schoolPassword: "1234", adminId: "admin" });
    const authTeachers = new Set<string>();
    authTeachers.add("정쌤");
    authTeachers.add("홍길동");
    schoolTeachers.set("sjms", authTeachers);
  };
  setupInitialSchool();

  // API: Get all registered schools (Master Admin only)
  app.get("/api/master/schools", (req, res) => {
    const list = Array.from(schools.values()).map(s => ({
      ...s
    }));
    res.json(list);
  });

  // API: Master Login
  app.post("/api/master/login", (req, res) => {
    const { masterPassword } = req.body;
    const correctMasterPassword = process.env.VITE_MASTER_PASSWORD || "master1234";
    if (masterPassword === correctMasterPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false });
    }
  });

  // Step 1: School Authentication (School ID + School Password)
  app.post("/api/auth/school", (req, res) => {
    const { schoolId, schoolPassword } = req.body;
    const school = schools.get(schoolId);
    if (school && school.schoolPassword === schoolPassword) {
      res.json({ success: true, schoolId: school.id, schoolName: school.name });
    } else {
      res.status(401).json({ success: false, message: "학교 아이디 또는 비밀번호가 틀립니다." });
    }
  });

  // Step 2: User Validation (Admin ID or Teacher Name)
  app.post("/api/auth/user", (req, res) => {
    const { schoolId, type, adminId, teacherName } = req.body;
    const school = schools.get(schoolId);
    if (!school) return res.status(404).json({ success: false });

    if (type === 'admin') {
      if (adminId === school.adminId) {
        res.json({ success: true, user: { name: "관리자", role: "admin", username: "admin" } });
      } else {
        res.status(401).json({ success: false, message: "관리자 아이디가 일치하지 않습니다." });
      }
    } else if (type === 'teacher') {
      const teachers = schoolTeachers.get(schoolId);
      if (teachers && teachers.has(teacherName)) {
        res.json({ success: true, user: { name: teacherName, role: "teacher", username: teacherName } });
      } else {
        res.status(401).json({ success: false, message: "해당 학교의 등록된 선생님 명단에 존재하지 않습니다." });
      }
    }
  });

  // API: Register school (Master Admin only)
  app.post("/api/auth/register", (req, res) => {
    const { schoolId, name, password, adminId } = req.body;
    if (schools.has(schoolId)) {
      return res.status(400).json({ success: false, message: "이미 존재하는 학교 아이디입니다." });
    }
    
    schools.set(schoolId, { id: schoolId, name, schoolPassword: password, adminId: adminId || "admin" });
    schoolTeachers.set(schoolId, new Set());
    
    res.json({ success: true, message: "학교가 성공적으로 등록되었습니다." });
  });

  // API: Teacher Management (School Admin only)
  app.get("/api/:schoolId/users", (req, res) => {
    const { schoolId } = req.params;
    if (schoolTeachers.has(schoolId)) {
      const list = Array.from(schoolTeachers.get(schoolId)!);
      res.json(list.map(name => ({ name })));
    } else {
      res.json([]);
    }
  });

  app.post("/api/:schoolId/users/add", (req, res) => {
    const { schoolId } = req.params;
    const { name } = req.body;
    
    if (!schoolTeachers.has(schoolId)) schoolTeachers.set(schoolId, new Set());
    const teachers = schoolTeachers.get(schoolId)!;
    
    if (teachers.has(name)) {
      return res.status(400).json({ success: false, message: "이미 등록된 선생님입니다." });
    }
    
    teachers.add(name);
    res.json({ success: true });
  });

  app.post("/api/:schoolId/users/batch-add", (req, res) => {
    const { schoolId } = req.params;
    const { names } = req.body; // Array of strings
    
    if (!schoolTeachers.has(schoolId)) schoolTeachers.set(schoolId, new Set());
    const teachers = schoolTeachers.get(schoolId)!;
    
    let addedCount = 0;
    if (Array.isArray(names)) {
      names.forEach(name => {
        const trimmed = name.trim();
        if (trimmed && !teachers.has(trimmed)) {
          teachers.add(trimmed);
          addedCount++;
        }
      });
    }
    
    res.json({ success: true, addedCount });
  });

  app.post("/api/:schoolId/users/delete", (req, res) => {
    const { schoolId } = req.params;
    const { name } = req.body;
    
    if (!schoolTeachers.has(schoolId)) return res.status(404).json({ success: false });
    
    const teachers = schoolTeachers.get(schoolId)!;
    teachers.delete(name);
    res.json({ success: true });
  });

  // API: Get notices for a specific school and channel
  app.get("/api/:schoolId/notices/:channelId", (req, res) => {
    const { schoolId, channelId } = req.params;
    
    if (!schoolNotices.has(schoolId)) schoolNotices.set(schoolId, new Map());
    const schoolMap = schoolNotices.get(schoolId)!;
    
    const specificNotices = schoolMap.get(channelId) || [];
    const commonNotices = schoolMap.get("common") || [];
    
    let gradeNotices: any[] = [];
    if (channelId !== "common") {
      const grade = channelId.charAt(0);
      gradeNotices = schoolMap.get(`${grade}00`) || [];
    }

    const allNotices = [...specificNotices, ...commonNotices, ...gradeNotices];
    const uniqueNotices = Array.from(new Map(allNotices.map(n => [n.id || n.timestamp, n])).values());
    uniqueNotices.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(uniqueNotices.slice(0, 10));
  });

  // API: Send notice to a specific school and channel
  app.post("/api/:schoolId/notice/:channelId", (req, res) => {
    const { schoolId, channelId } = req.params;
    const { title, content, authorName } = req.body;
    
    const notice = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title || (
        channelId === "common" 
          ? "전체 공지" 
          : channelId.endsWith("00") 
            ? `${channelId.charAt(0)}학년 전체 공지` 
            : `${channelId}반 공지`
      ),
      content: content || "",
      author: authorName || "관리자",
      authorId: req.body.authorId || "unknown",
      timestamp: new Date().toISOString(),
      channelId,
      schoolId,
      type: "new_notice"
    };

    if (!schoolNotices.has(schoolId)) schoolNotices.set(schoolId, new Map());
    const schoolMap = schoolNotices.get(schoolId)!;
    
    if (!schoolMap.has(channelId)) schoolMap.set(channelId, []);
    const list = schoolMap.get(channelId)!;
    list.unshift(notice);
    schoolMap.set(channelId, list.slice(0, 10));

    const broadcast = (targetId: string, data: any) => {
      if (!channels.has(schoolId)) return;
      const schoolChannels = channels.get(schoolId)!;
      (schoolChannels.get(targetId) || []).forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`));
    };

    if (channelId === "common") {
      if (channels.has(schoolId)) {
        channels.get(schoolId)!.forEach((_, id) => broadcast(id, notice));
      }
    } else if (channelId.endsWith("00")) {
      const grade = channelId.charAt(0);
      if (channels.has(schoolId)) {
        channels.get(schoolId)!.forEach((_, id) => { if (id.startsWith(grade)) broadcast(id, notice); });
      }
    } else {
      broadcast(channelId, notice);
    }
    res.json({ success: true, notice });
  });

  // API: Delete a specific notice
  app.post("/api/:schoolId/notice/:channelId/delete", (req, res) => {
    const { schoolId, channelId } = req.params;
    const { noticeId } = req.body;

    if (schoolNotices.has(schoolId)) {
      const schoolMap = schoolNotices.get(schoolId)!;
      if (schoolMap.has(channelId)) {
        const list = schoolMap.get(channelId)!;
        schoolMap.set(channelId, list.filter(n => n.id !== noticeId));
      }
    }

    const deleteEvent = { type: "delete_notice", noticeId, channelId };

    const broadcast = (targetId: string, data: any) => {
      if (!channels.has(schoolId)) return;
      const schoolChannels = channels.get(schoolId)!;
      (schoolChannels.get(targetId) || []).forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`));
    };

    if (channelId === "common") {
      if (channels.has(schoolId)) {
        channels.get(schoolId)!.forEach((_, id) => broadcast(id, deleteEvent));
      }
    } else if (channelId.endsWith("00")) {
      const grade = channelId.charAt(0);
      if (channels.has(schoolId)) {
        channels.get(schoolId)!.forEach((_, id) => { if (id.startsWith(grade)) broadcast(id, deleteEvent); });
      }
    } else {
      broadcast(channelId, deleteEvent);
    }
    res.json({ success: true });
  });

  // API: SSE Endpoint per school and channel
  app.get("/api/:schoolId/events/:channelId", (req, res) => {
    const { schoolId, channelId } = req.params;
    
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();
    res.write(": heart-beat\n\n");

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    
    if (!channels.has(schoolId)) {
      channels.set(schoolId, new Map());
    }
    const schoolChannels = channels.get(schoolId)!;
    
    if (!schoolChannels.has(channelId)) {
      schoolChannels.set(channelId, []);
    }
    schoolChannels.get(channelId)?.push(newClient);

    const keepAlive = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(keepAlive);
      if (channels.has(schoolId)) {
        const schoolChannels = channels.get(schoolId)!;
        const filtered = (schoolChannels.get(channelId) || []).filter((c) => c.id !== clientId);
        schoolChannels.set(channelId, filtered);
      }
    });
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
