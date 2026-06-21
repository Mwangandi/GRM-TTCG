import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import twilio from "twilio";
import http from "http";
import https from "https";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- SERVER-SIDE DB INTEGRATION FOR GRIEVANCES ---
  const GRIEVANCES_FILE = path.join(process.cwd(), "grievances.json");

  function loadGrievances(): any[] {
    try {
      if (fs.existsSync(GRIEVANCES_FILE)) {
        const content = fs.readFileSync(GRIEVANCES_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (err) {
      console.error("Error loading grievances from file system:", err);
    }
    // High-fidelity initial mock data synced with store.ts
    const now = new Date();
    const getPastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    return [
      {
        id: 'TT-GRM-2026-0001',
        dateSubmitted: getPastDate(6),
        channel: 'Walk-in',
        isAnonymous: false,
        name: 'John Doe',
        gender: 'Male',
        idNumber: '12345678',
        ward: 'Mwatate',
        phone: '0712345678',
        category: 'Service Delay',
        description: 'The road construction at Mwatate town has stalled for 2 months, causing heavy dust and blocking access to local shops.',
        status: 'Case Closed',
        assignedDepartment: 'Roads, Public Works, and Infrastructure',
        resolutionSummary: 'Contractor has been mobilized back to site and water truck deployed to manage dust.',
        resolutionDate: getPastDate(1),
        citizenSatisfaction: 'Satisfied',
        history: [
          { date: getPastDate(6), status: 'Logged', note: 'Grievance submitted via walk-in' },
          { date: getPastDate(5), status: 'Acknowledged & Sorted', note: 'Assigned to Roads department' },
          { date: getPastDate(4), status: 'Under Investigation', note: 'Site visit scheduled' },
          { date: getPastDate(1), status: 'Action & Resolution', note: 'Contractor mobilized' },
          { date: getPastDate(1), status: 'Case Closed', note: 'Citizen confirmed satisfaction' }
        ]
      },
      {
        id: 'TT-GRM-2026-0002',
        dateSubmitted: getPastDate(2),
        channel: 'Portal',
        isAnonymous: true,
        category: 'Corruption',
        description: 'An official at the lands office is demanding a facilitation fee to process my title deed application.',
        status: 'Appeal to County GRM',
        assignedDepartment: 'Lands, Housing, and Urban Development',
        resolutionSummary: 'Initial investigation found insufficient evidence.',
        citizenSatisfaction: 'Not Satisfied',
        history: [
          { date: getPastDate(2), status: 'Logged', note: 'Grievance submitted via portal' },
          { date: getPastDate(1), status: 'Acknowledged & Sorted', note: 'Assigned to Lands department' },
          { date: getPastDate(1), status: 'Action & Resolution', note: 'Insufficient evidence found' },
          { date: getPastDate(0.5), status: 'Appeal to County GRM', note: 'Complainant appealed the decision' }
        ]
      },
      {
        id: 'TT-GRM-2026-0003',
        dateSubmitted: getPastDate(1),
        channel: 'WhatsApp',
        isAnonymous: false,
        name: 'Jane Smith',
        ward: 'Chala',
        category: 'General Complaint',
        description: 'No water supply in Chala ward for the past 3 weeks despite reporting to Tavevo.',
        status: 'Under Investigation',
        assignedDepartment: 'Water, Environment, and Natural Resources',
        history: [
          { date: getPastDate(1), status: 'Logged', note: 'Grievance submitted via WhatsApp' },
          { date: getPastDate(0.5), status: 'Acknowledged & Sorted', note: 'Forwarded to Water department' },
          { date: getPastDate(0.1), status: 'Under Investigation', note: 'Checking with Tavevo team' }
        ]
      },
      {
        id: 'TT-GRM-2026-0004',
        dateSubmitted: getPastDate(3),
        channel: 'Walk-in',
        isAnonymous: false,
        name: 'Samuel M.',
        ward: 'Wundanyi',
        category: 'Service Delay',
        description: 'The health center has been out of essential drugs for a week.',
        status: 'Logged',
        assignedDepartment: 'Health Services',
        history: [
          { date: getPastDate(3), status: 'Logged', note: 'Grievance submitted via walk-in' }
        ]
      }
    ];
  }

  function saveGrievances(grievances: any[]) {
    try {
      fs.writeFileSync(GRIEVANCES_FILE, JSON.stringify(grievances, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving grievances to file system:", err);
    }
  }

  // --- SERVER-SIDE STORAGE FOR WHATSAPP COMM LOGS ---
  const WHATSAPP_LOGS_FILE = path.join(process.cwd(), "whatsapp_logs.json");

  function loadWhatsAppLogs(): any[] {
    try {
      if (fs.existsSync(WHATSAPP_LOGS_FILE)) {
        const content = fs.readFileSync(WHATSAPP_LOGS_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (err) {
      console.error("Error loading WhatsApp logs:", err);
    }
    const now = new Date();
    const getPastTime = (minsAgo: number) => {
      const d = new Date(now.getTime() - minsAgo * 60 * 1000);
      return d.toISOString();
    };
    return [
      {
        id: "WL-2026-0001",
        timestamp: getPastTime(120),
        direction: "Inbound",
        phone: "+254712345678",
        message: "Hello, I want to report an issue with the water supply in Ward 4.",
        status: "Processed",
        step: "start"
      },
      {
        id: "WL-2026-0002",
        timestamp: getPastTime(119),
        direction: "Outbound",
        phone: "+254712345678",
        message: "👋 Welcome to Taita Taveta County *Grievance Redress System*\n\nWhat would you like to do?\n\n1. Submit feedback/complaint\n2. Track existing grievance\n3. Contact information",
        status: "Sent",
        step: "menu"
      },
      {
        id: "WL-2026-0003",
        timestamp: getPastTime(115),
        direction: "Inbound",
        phone: "+254712345678",
        message: "1",
        status: "Processed",
        step: "menu"
      },
      {
        id: "WL-2026-0004",
        timestamp: getPastTime(114),
        direction: "Outbound",
        phone: "+254712345678",
        message: "📋 Select the *Type of Feedback*:\n\n1. Complaint\n2. Compliment\n3. Suggestion\n4. Question",
        status: "Sent",
        step: "get_feedback_type"
      },
      {
        id: "WL-2026-0005",
        timestamp: getPastTime(80),
        direction: "Inbound",
        phone: "+254722999888",
        message: "track",
        status: "Processed",
        step: "menu"
      },
      {
        id: "WL-2026-0006",
        timestamp: getPastTime(79),
        direction: "Outbound",
        phone: "+254722999888",
        message: "Please enter your *reference number* (e.g. TT-GRM-2026-0001):",
        status: "Sent",
        step: "check_status"
      },
      {
        id: "WL-2026-0007",
        timestamp: getPastTime(78),
        direction: "Inbound",
        phone: "+254722999888",
        message: "TT-GRM-2026-0001",
        status: "Processed",
        step: "check_status"
      },
      {
        id: "WL-2026-0008",
        timestamp: getPastTime(77),
        direction: "Outbound",
        phone: "+254722999888",
        message: "✅ *Grievance Status*\n\nRef No: TT-GRM-2026-0001\nCategory: Service Delay\nStatus: Case Closed\n\nResolution Notes: Contractor has been mobilized back to site and water truck deployed to manage dust.\n\nType anything to return to main menu.",
        status: "Sent",
        step: "check_status"
      }
    ];
  }

  function logWhatsAppMessage(direction: 'Inbound' | 'Outbound', phone: string, message: string, status: string, step: string) {
    try {
      const list = loadWhatsAppLogs();
      const newLog = {
        id: `WL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        direction,
        phone,
        message,
        status,
        step
      };
      list.unshift(newLog);
      if (list.length > 500) {
        list.pop();
      }
      fs.writeFileSync(WHATSAPP_LOGS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving WhatsApp log:", err);
    }
  }

  // --- TWILIO CONFIGURATION & WHATSAPP SEND ENGINE ---
  let twilioClient: any = null;

  const httpAgent = new http.Agent({
    keepAlive: true,
    timeout: 90000,
    maxSockets: 50
  });
  const httpsAgent = new https.Agent({
    keepAlive: true,
    timeout: 90000,
    maxSockets: 50
  });

  async function sendWhatsAppMessage(to: string, body: string): Promise<any> {
    let phone = to.replace('whatsapp:', '').replace(/[\s()-]/g, '');
    if (!phone.startsWith('+')) phone = '+' + phone;

    // Simulate flow and bypass real twilio if phone is a designated testing/simulator phone
    if (phone.toLowerCase().includes('mock') || phone.startsWith('+000') || phone === '12345') {
      console.log(`[Twilio SMS Engine] Simulated response to mock phone ${phone}: ${body}`);
      logWhatsAppMessage('Outbound', phone, body, 'Simulated', 'N/A');
      return { success: true, simulated: true, sid: "SM" + Math.floor(Math.random() * 1058373) };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    if (!accountSid || !authToken) {
      console.warn("[Twilio SMS Engine] Missing Account SID or Auth Token in developer environment.");
      logWhatsAppMessage('Outbound', phone, body, 'No Credentials Error', 'N/A');
      return { success: false, error: "Missing Twilio credentials" };
    }

    try {
      if (!twilioClient) {
        twilioClient = twilio(accountSid, authToken);
        if (twilioClient.request && typeof twilioClient.request === 'function') {
          const originalRequest = twilioClient.request.bind(twilioClient);
          twilioClient.request = function(opts: any, callback: any) {
            opts.agent = opts.protocol === 'https:' ? httpsAgent : httpAgent;
            opts.timeout = 90000;
            return originalRequest(opts, callback);
          };
        }
      }

      const formattedTo = `whatsapp:${phone}`;
      console.log(`[Twilio SMS Engine] Sending message to ${formattedTo}...`);

      const result = await twilioClient.messages.create({
        from: fromNumber,
        to: formattedTo,
        body: body
      });

      console.log(`[Twilio SMS Engine] Sent successfully! SID: ${result.sid}`);
      logWhatsAppMessage('Outbound', phone, body, 'Sent', 'N/A');
      return { success: true, sid: result.sid, to: phone };
    } catch (err: any) {
      console.error(`[Twilio SMS Engine Error] Failed to send to ${to}:`, err.message || err);
      logWhatsAppMessage('Outbound', phone, body, `Error: ${err.message || err}`, 'N/A');
      return { success: false, error: err.message || err };
    }
  }

  // --- CONVERSATIONAL CHATBOT STATE MACHINE ---
  interface WhatsAppSession {
    step: 'menu' | 'get_feedback_type' | 'get_category' | 'get_description' | 'confirm' | 'check_status';
    feedback_type?: string;
    grievance_category?: string;
    description?: string;
    ref_no?: string;
  }

  const sessions = new Map<string, WhatsAppSession>();

  function getSession(phone: string): WhatsAppSession | undefined {
    return sessions.get(phone);
  }

  function saveSession(phone: string, session: WhatsAppSession) {
    sessions.set(phone, session);
  }

  function deleteSession(phone: string) {
    sessions.delete(phone);
  }

  async function handleWhatsAppWebhookMessage(fromNumber: string, text: string) {
    const phone = fromNumber.replace("whatsapp:", "").trim();
    const userInput = text.trim();
    const userInputLower = userInput.toLowerCase();

    let session = getSession(phone);
    const currentStep = session ? session.step : "start";

    logWhatsAppMessage('Inbound', phone, userInput, 'Processed', currentStep);

    console.log(`[WhatsApp - ${phone}] currentStep: ${currentStep}, input: "${userInput}"`);

    if (currentStep === "start" || !session) {
      // Show main greeting menu
      const welcomeMsg = `👋 Welcome to Taita Taveta County *Grievance Redress System*\n\nWhat would you like to do?\n\n1. Submit feedback/complaint\n2. Track existing grievance\n3. Contact information`;
      await sendWhatsAppMessage(phone, welcomeMsg);
      saveSession(phone, { step: "menu" });
      return;
    }

    if (currentStep === "menu") {
      if (userInputLower === "1" || userInputLower === "submit" || userInputLower.includes("complaint")) {
        const msg = `📋 Select the *Type of Feedback*:\n\n1. Complaint\n2. Compliment\n3. Suggestion\n4. Question`;
        await sendWhatsAppMessage(phone, msg);
        saveSession(phone, { step: "get_feedback_type" });
      } else if (userInputLower === "2" || userInputLower === "track") {
        const msg = `Please enter your *reference number* (e.g. TT-GRM-2026-0001):`;
        await sendWhatsAppMessage(phone, msg);
        saveSession(phone, { step: "check_status" });
      } else if (userInputLower === "3" || userInputLower === "help" || userInputLower.includes("contact")) {
        const msg = `📞 *Contact Information*\n\nGrievance Office: 0800 720 321\nEmail: grm@taitataveta.go.ke\nOffice Hours: Mon-Fri 8am-5pm\n\nReply any key to return to main menu.`;
        await sendWhatsAppMessage(phone, msg);
        deleteSession(phone);
      } else {
        const msg = `Please reply with 1, 2, or 3:\n\n1. Submit feedback/complaint\n2. Track existing grievance\n3. Contact information`;
        await sendWhatsAppMessage(phone, msg);
      }
      return;
    }

    if (currentStep === "get_feedback_type") {
      let typeName = "";
      if (userInput === "1" || userInputLower.includes("complaint")) typeName = "Complaint";
      else if (userInput === "2" || userInputLower.includes("compliment")) typeName = "Compliment";
      else if (userInput === "3" || userInputLower.includes("suggestion")) typeName = "Suggestion";
      else if (userInput === "4" || userInputLower.includes("question")) typeName = "Question";

      if (!typeName) {
        await sendWhatsAppMessage(phone, "❌ Invalid selection. Please reply with 1, 2, 3, or 4.");
        return;
      }

      if (typeName === "Complaint") {
        await sendWhatsAppMessage(phone, `📋 Select the *Category*:\n\n1. Health Facilities\n2. Water Access and Taveta\n3. Gender Based Violence Misconduct`);
        saveSession(phone, { step: "get_category", feedback_type: "Complaint" });
      } else {
        await sendWhatsAppMessage(phone, `📝 Tell us about your ${typeName.toLowerCase()}:\n\nPlease describe in detail.`);
        saveSession(phone, { step: "get_description", feedback_type: typeName });
      }
      return;
    }

    if (currentStep === "get_category") {
      let subCategory = "";
      if (userInput === "1" || userInputLower.includes("health")) subCategory = "Health Facilities";
      else if (userInput === "2" || userInputLower.includes("water")) subCategory = "Water Access and Taveta";
      else if (userInput === "3" || userInputLower.includes("gender") || userInputLower.includes("violence")) subCategory = "Gender Based Violence Misconduct";

      if (!subCategory) {
        await sendWhatsAppMessage(phone, "❌ Invalid selection. Please reply with 1, 2, or 3.");
        return;
      }

      await sendWhatsAppMessage(phone, "📝 Tell us about your grievance:\n\nWhat is the main issue? Please describe in detail.");
      saveSession(phone, { 
        step: "get_description", 
        feedback_type: "Complaint", 
        grievance_category: subCategory 
      });
      return;
    }

    if (currentStep === "get_description") {
      const grievancesList = loadGrievances();
      const nextNum = grievancesList.length + 1;
      const refNo = `TT-GRM-2026-${nextNum.toString().padStart(4, "0")}`;

      const prevSession = getSession(phone);
      const feedbackType = prevSession?.feedback_type || "Complaint";
      const grievanceCategory = prevSession?.grievance_category || "General";

      saveSession(phone, {
        step: "confirm",
        feedback_type: feedbackType,
        grievance_category: grievanceCategory,
        description: userInput,
        ref_no: refNo
      });

      const summary = `📋 *Grievance Summary*\n\nReference No: *${refNo}*\nType: ${feedbackType}\nCategory: ${grievanceCategory}\nDescription: "${userInput}"\n\nReply *CONFIRM* to submit or *CANCEL* to start over.`;
      await sendWhatsAppMessage(phone, summary);
      return;
    }

    if (currentStep === "confirm") {
      if (userInputLower === "confirm") {
        const activeSession = getSession(phone);
        if (!activeSession) {
          await sendWhatsAppMessage(phone, "Session lost. Please try submitting again.");
          deleteSession(phone);
          return;
        }

        const grievancesList = loadGrievances();
        const refNo = activeSession.ref_no || `TT-GRM-2026-${(grievancesList.length + 1).toString().padStart(4, "0")}`;
        const now = new Date().toISOString();

        let finalCategory: any = "General Complaint";
        let assignedDept = "General Support";

        if (activeSession.feedback_type === "Compliment") {
          finalCategory = "Compliment";
        } else if (activeSession.feedback_type === "Suggestion") {
          finalCategory = "Suggestion";
        } else if (activeSession.grievance_category === "Gender Based Violence Misconduct") {
          finalCategory = "GBV";
          assignedDept = "Education, Library, and ICT";
        } else if (activeSession.grievance_category === "Health Facilities") {
          finalCategory = "General Complaint";
          assignedDept = "Health Services";
        } else if (activeSession.grievance_category === "Water Access and Taveta") {
          finalCategory = "General Complaint";
          assignedDept = "Water, Environment, and Natural Resources";
        }

        const descriptionPrefix = activeSession.grievance_category 
          ? `[WhatsApp Grievance Category: ${activeSession.grievance_category}] ${activeSession.description}`
          : activeSession.description;

        const newGrievance: any = {
          id: refNo,
          dateSubmitted: now,
          channel: "WhatsApp",
          isAnonymous: false,
          name: `WhatsApp User`,
          phone: phone,
          category: finalCategory,
          description: descriptionPrefix,
          status: "Logged",
          assignedDepartment: assignedDept,
          priority: finalCategory === "GBV" ? "High" : "Medium",
          history: [{ date: now, status: "Logged", note: "Grievance submitted via WhatsApp" }]
        };

        grievancesList.unshift(newGrievance);
        saveGrievances(grievancesList);

        const successMsg = `*Grievance Submitted Successfully*\n\nYour reference number: *${refNo}*\n\nWe will review your complaint and get back to you within 5 business days.\n\nReply *TRACK* anytime to check the status.`;
        await sendWhatsAppMessage(phone, successMsg);
        deleteSession(phone);
      } else if (userInputLower === "cancel") {
        await sendWhatsAppMessage(phone, "Grievance cancelled. Type anything to start over.");
        deleteSession(phone);
      } else {
        await sendWhatsAppMessage(phone, "Please reply *CONFIRM* or *CANCEL*.");
      }
      return;
    }

    if (currentStep === "check_status") {
      const grievancesList = loadGrievances();
      const cleanInput = userInput.toUpperCase().trim();
      const grievance = grievancesList.find(g => g.id.toUpperCase() === cleanInput);

      if (grievance) {
        let emoji = "📮";
        if (grievance.status === "Acknowledged & Sorted") emoji = "⏳";
        else if (grievance.status === "Under Investigation") emoji = "🔍";
        else if (["Immediate Resolution", "Action & Resolution", "Appeal Resolution", "Case Closed"].includes(grievance.status)) emoji = "✅";
        else if (grievance.status === "Appeal to County GRM") emoji = "⚠️";

        const reply = `${emoji} *Grievance Status*\n\nRef No: ${grievance.id}\nCategory: ${grievance.category}\nStatus: *${grievance.status}*\n${grievance.resolutionSummary ? `\nResolution Notes: ${grievance.resolutionSummary}` : ''}\n\nType anything to return to main menu.`;
        await sendWhatsAppMessage(phone, reply);
      } else {
        await sendWhatsAppMessage(phone, "❌ Reference number not found. Please verify the number and try again, or type anything to return to the main menu.");
      }
      deleteSession(phone);
      return;
    }

    deleteSession(phone);
    const restartMsg = "An error occurred with your session. Let's start over, please send any message to begin.";
    await sendWhatsAppMessage(phone, restartMsg);
  }

  // --- TWILIO WEBHOOK ENDPOINTS ---
  app.post("/api/twilio/webhook", async (req, res) => {
    res.status(200).send("ok");
    try {
      const From = req.body.From || req.body.from;
      const Body = req.body.Body || req.body.body;
      console.log(`[Twilio Webhook] Received From: ${From}, Body: "${Body}"`);
      if (From && Body) {
        await handleWhatsAppWebhookMessage(From, Body);
      } else {
        console.warn("[Twilio Webhook Alert] Received request with missing From or Body params:", req.body);
      }
    } catch (err: any) {
      console.error("[Twilio Webhook API Error]", err.message || err);
    }
  });

  app.post("/webhook", async (req, res) => {
    res.status(200).send("ok");
    try {
      const From = req.body.From || req.body.from;
      const Body = req.body.Body || req.body.body;
      console.log(`[Global/Twilio Webhook] Received From: ${From}, Body: "${Body}"`);
      if (From && Body) {
        await handleWhatsAppWebhookMessage(From, Body);
      } else {
        console.warn("[Global Webhook Alert] Received request with missing From or Body params:", req.body);
      }
    } catch (err: any) {
      console.error("[Global Webhook API Error]", err.message || err);
    }
  });

  // Debug tool endpoint to test messaging
  app.get("/api/test-message", async (req, res) => {
    try {
      const { phone, message } = req.query;
      if (!phone || !message) {
        return res.status(400).json({
          error: "Missing phone or message query parameters",
          example: "/api/test-message?phone=+254795752053&message=Hello World"
        });
      }
      const result = await sendWhatsAppMessage(phone as string, message as string);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- WHATSAPP INTEGRATION DASHBOARD APIs ---
  app.get("/api/whatsapp/status", (req, res) => {
    try {
      const logs = loadWhatsAppLogs();
      const activeSessionsArr = Array.from(sessions.entries()).map(([phone, session]) => ({
        phone,
        step: session.step,
        feedback_type: session.feedback_type,
        grievance_category: session.grievance_category,
        ref_no: session.ref_no
      }));

      // Calculate statistics
      const totalInbound = logs.filter(l => l.direction === "Inbound").length;
      const totalOutbound = logs.filter(l => l.direction === "Outbound").length;
      const uniqueUsers = new Set(logs.map(l => l.phone)).size;

      res.json({
        success: true,
        logs,
        activeSessions: activeSessionsArr,
        stats: {
          totalInbound,
          totalOutbound,
          totalMessages: logs.length,
          uniqueUsers,
          activeSessionCount: activeSessionsArr.length
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || err });
    }
  });

  app.post("/api/whatsapp/reset-session", (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: "Missing phone number" });
      }
      let cleanPhone = phone.trim();
      if (sessions.has(cleanPhone)) {
        sessions.delete(cleanPhone);
        return res.json({ success: true, message: `Active session for ${cleanPhone} has been reset.` });
      } else {
        return res.status(404).json({ success: false, error: `No active session found for ${cleanPhone}` });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || err });
    }
  });

  // --- SYNC API FOR WEB DASHBOARD ---
  app.get("/api/grievances", (req, res) => {
    try {
      const list = loadGrievances();
      res.json({ success: true, grievances: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || err });
    }
  });

  app.post("/api/grievances", (req, res) => {
    try {
      const grievance = req.body;
      if (!grievance) {
        return res.status(400).json({ success: false, error: "Missing grievance payload" });
      }

      const list = loadGrievances();
      const currentYear = new Date().getFullYear();
      const trackingNo = `TT-GRM-${currentYear}-${(list.length + 1).toString().padStart(4, "0")}`;
      const now = new Date().toISOString();

      const newGrv = {
        ...grievance,
        id: trackingNo,
        dateSubmitted: now,
        status: "Logged",
        history: [{ date: now, status: "Logged", note: "Grievance submitted via portal" }]
      };

      list.unshift(newGrv);
      saveGrievances(list);

      res.json({ success: true, grievance: newGrv });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || err });
    }
  });

  app.put("/api/grievances/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const list = loadGrievances();

      const index = list.findIndex(g => g.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Grievance not found" });
      }

      const existing = list[index];
      const newHistory = existing.history ? [...existing.history] : [];
      const now = new Date().toISOString();

      if (updates.status && updates.status !== existing.status) {
        newHistory.push({
          date: now,
          status: updates.status,
          note: updates.appealResolutionSummary || updates.resolutionSummary || 'Status updated automatically',
          actor: 'Admin Staff'
        });
      } else if (
        (updates.assignedDepartment && updates.assignedDepartment !== existing.assignedDepartment) ||
        (updates.assignedStaff && updates.assignedStaff !== existing.assignedStaff) ||
        (updates.resolutionSummary && updates.resolutionSummary !== existing.resolutionSummary) ||
        (updates.appealResolutionSummary && updates.appealResolutionSummary !== existing.appealResolutionSummary)
      ) {
        let notes = [];
        if (updates.assignedDepartment && updates.assignedDepartment !== existing.assignedDepartment) notes.push(`Department assigned: ${updates.assignedDepartment}`);
        if (updates.assignedStaff && updates.assignedStaff !== existing.assignedStaff) notes.push(`Staff assigned: ${updates.assignedStaff}`);
        if (updates.resolutionSummary && updates.resolutionSummary !== existing.resolutionSummary) notes.push(`Action note added/modified: ${updates.resolutionSummary}`);
        
        newHistory.push({
          date: now,
          status: updates.status || existing.status,
          note: notes.join(' | '),
          actor: 'Admin Staff'
        });
      }

      list[index] = {
        ...existing,
        ...updates,
        history: newHistory
      };

      saveGrievances(list);
      res.json({ success: true, grievance: list[index] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || err });
    }
  });

  app.post("/api/help", async (req, res) => {
    try {
      const { description, category } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Based on the following grievance details, provide a short, helpful, and friendly piece of advice or FAQ-style guidance to the citizen before they submit. \n\nIs this a valid grievance for the county? What should they expect or do they need to provide more info? \n\nKeep it under 3 sentences.\nCategory: ${category}\nDescription: ${description}`,
      });
      res.json({ advice: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Could not generate advice right now." });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password are required" });
      }

      const FRAPPE_BASE_URL = process.env.FRAPPE_BASE_URL || "http://45.90.123.75:8002";

      console.log(`[Frappe Login] Checking credentials for ${username} at ${FRAPPE_BASE_URL}...`);
      
      const response = await fetch(`${FRAPPE_BASE_URL}/api/method/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: `usr=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}`,
        redirect: "manual",
      });

      let sid: string | null = null;
      const setCookies = (typeof response.headers.getSetCookie === 'function') 
        ? response.headers.getSetCookie() 
        : [];
      const cookieHeaders = [...setCookies];
      
      const scHeader = response.headers.get("set-cookie");
      if (scHeader) {
        cookieHeaders.push(scHeader);
      }

      for (const cookie of cookieHeaders) {
        const sidMatch = cookie.match(/sid=([^;]+)/);
        if (sidMatch && sidMatch[1] !== "Guest") {
          sid = sidMatch[1];
        }
      }

      let responseBodyText = "";
      try {
        responseBodyText = await response.text();
      } catch (err) {
        // ignore
      }

      let isSuccess = false;
      let fullName = username;

      if (sid && sid !== "Guest") {
        isSuccess = true;
      }

      try {
        const jsonData = JSON.parse(responseBodyText);
        if (jsonData.message === "Logged In") {
          isSuccess = true;
          if (jsonData.full_name) {
            fullName = jsonData.full_name;
          }
        }
      } catch (err) {
        // not json
      }

      if (isSuccess) {
        console.log(`[Frappe Login] Authentication successful for user ${username}. Full Name: ${fullName}`);
        return res.json({
          success: true,
          sid: sid,
          user: {
            username: username,
            email: username.includes("@") ? username : `${username}@taitataveta.go.ke`,
            name: fullName
          }
        });
      } else {
        console.warn(`[Frappe Login] Authentication failed for user ${username}`);
        return res.status(401).json({
          success: false,
          error: "Invalid username or password on the remote Frappe instance."
        });
      }

    } catch (err: any) {
      console.error("[Frappe Login Error]", err);
      return res.status(500).json({
        success: false,
        error: "Server error connecting to remote Frappe instance: " + (err.message || err)
      });
    }
  });

  app.get("/api/wards", async (req, res) => {
    try {
      const FRAPPE_BASE_URL = process.env.FRAPPE_BASE_URL || "http://45.90.123.75:8002";
      
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };

      // Set up authentication from environment variables
      if (process.env.FRAPPE_API_KEY && process.env.FRAPPE_API_SECRET) {
        headers["Authorization"] = `token ${process.env.FRAPPE_API_KEY}:${process.env.FRAPPE_API_SECRET}`;
        console.log(`[Wards API] Fetching from ${FRAPPE_BASE_URL} using API key/secret authentication...`);
      } else if (process.env.FRAPPE_ACCESS_TOKEN) {
        headers["Authorization"] = `token ${process.env.FRAPPE_ACCESS_TOKEN}`;
        console.log(`[Wards API] Fetching from ${FRAPPE_BASE_URL} using Access Token...`);
      } else {
        console.log(`[Wards API] Fetching from ${FRAPPE_BASE_URL} unauthenticated...`);
      }
      
      const response = await fetch(`${FRAPPE_BASE_URL}/api/resource/Admin%203?limit_page_length=200`, {
        method: "GET",
        headers
      });

      if (!response.ok) {
        throw new Error(`Frappe returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const wardsList = data.data.map((w: any) => w.name).filter(Boolean);
        console.log(`[Wards API] Successfully fetched ${wardsList.length} wards directly from server-side.`);
        return res.json({ success: true, wards: wardsList });
      } else {
        console.warn("[Wards API] Received data structure without data array:", data);
        throw new Error("Unexpected data structure received from remote Frappe instance");
      }
    } catch (err: any) {
      console.error("[Wards API Error]", err);
      return res.status(502).json({ 
        success: false, 
        error: typeof err === 'object' && err !== null ? (err.message || "Failed to fetch from server-side") : "Failed to fetch from server-side", 
        wards: []
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
