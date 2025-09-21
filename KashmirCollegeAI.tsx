import React, { useState, useEffect, useRef } from "react";
import { addColleges, searchColleges, getAllColleges } from "./idb"; // adjust path

type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
};

type UserInfo = {
  name: string;
  education: "10th" | "12th";
};

interface CollegeInfo {
  id?: number;
  "COLLEGE NAME": string;
  DISTRICT: string;
  TYPE: string;
  COURSES: string;
  SCHOLARSHIPS: string;
  "LINK ": string;
}

const languages = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिन्दी" },
];

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = "AIzaSyDxJcyNfSggL32TQkO5SlKGzSIvaOKG-qs";

// Keeps spacing and line breaks except multiple continuous spaces replaced by one
function cleanResponse(text: string): string {
  return text
    .replace(/[ ]{2,}/g, " ")   // replace multiple consecutive spaces with 1 space
    .replace(/[ ]*\n[ ]*/g, "\n") // trim spaces around newlines
    .trim();
}

function formatResponse(text: string) {
  const cleanText = cleanResponse(text);
  return cleanText.split("\n").map((line, idx) => (
    <p key={idx} style={{ margin: "6px 0" }}>{line}</p>
  ));
}

function KashmirCollegeAI({ userInfo }: { userInfo: UserInfo }) {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      text: `Hello ${userInfo.name}! I'm your Kashmir College Advisor AI. Select your language and ask me about colleges in Jammu and Kashmir, admission processes, courses, scholarships, and more.`,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleStatus() {
      setIsOnline(navigator.onLine);
    }
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // seed IndexedDB if empty
    async function seedDB() {
      const colleges = await getAllColleges();
      if (colleges.length === 0) {
        const response = await fetch("/colleges.json");
        const data: CollegeInfo[] = await response.json();
        await addColleges(data);
      }
    }
    seedDB();
  }, []);

  async function callChatApi(userInput: string, conversation: Message[]): Promise<string> {
    const instructionText =
      `You are an expert career advisor AI focused ONLY on Jammu and Kashmir colleges. ` +
      `Respond ONLY in the language ${selectedLanguage}. ` +
      `The student is named ${userInfo.name} and has completed ${userInfo.education}. ` +
      `Stay on topic, be helpful and concise.`;

    const conversationContents = [
      ...conversation.map((msg, index) => {
        if (index === 0 && msg.sender === "user") {
          return {
            role: "user",
            parts: [{ text: instructionText + "\n\n" + msg.text }],
          };
        }
        return {
          role: msg.sender === "ai" ? "assistant" : "user",
          parts: [{ text: msg.text }],
        };
      }),
      {
        role: "user",
        parts: [{ text: userInput }],
      },
    ];

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        body: JSON.stringify({ contents: conversationContents }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("API response error details:", errText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const firstCandidate = data?.candidates?.[0];
      if (!firstCandidate || !firstCandidate.content?.parts) {
        return "Sorry, I couldn't understand that. Could you please rephrase?";
      }

      const replyText = firstCandidate.content.parts
        .map((part: { text: string }) => part.text)
        .join("");

      return replyText.replace(/\*/g, "") || "Sorry, I didn't get that. Could you please try again?";
    } catch (error) {
      console.error("API call error:", error);
      return "Sorry, I am experiencing technical difficulties. Please try again later.";
    }
  }

  async function searchLocalColleges(query: string): Promise<string> {
    const matches = await searchColleges(query);
    if (matches.length === 0) return "No matching colleges found in offline mode.";

    return matches
      .map((c) => `${c["COLLEGE NAME"]} (${c.DISTRICT})\nType: ${c.TYPE}\nCourses: ${c.COURSES}\nScholarships: ${c.SCHOLARSHIPS}\nWebsite: ${c["LINK "]}`)
      .join("\n\n");
  }

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    let replyText = "";

    if (isOnline) {
      replyText = await callChatApi(inputText.trim(), [...messages, userMsg]);
    } else {
      replyText = await searchLocalColleges(inputText.trim());
    }

    const aiMsg: Message = {
      id: Date.now() + 1,
      text: replyText,
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setInputText("");
    setIsLoading(false);
  };

  return (
    <div
      style={{
        height: "90vh",
        maxWidth: 720,
        margin: "auto",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        borderRadius: 8,
      }}
    >
      {/* Language Selector */}
      <div style={{ padding: 12, textAlign: "center" }}>
        <label style={{ marginRight: 8, fontWeight: "bold" }}>Select Language:</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{ padding: 6, fontSize: 16 }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: 20,
          backgroundColor: "#fafafa",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.sender === "ai" ? "left" : "right",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "75%",
                backgroundColor: msg.sender === "ai" ? "#e1f5fe" : "#c8e6c9",
                color: "#333",
                padding: "12px 16px",
                borderRadius: 20,
                whiteSpace: "pre-wrap",
                fontSize: 16,
                fontWeight: "normal",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                wordBreak: "break-word",
              }}
            >
              <strong>{msg.sender === "ai" ? "AI" : "You"}:</strong>
              {msg.sender === "ai" ? formatResponse(msg.text) : msg.text}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#666",
                marginTop: 4,
                userSelect: "none",
              }}
            >
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div
        style={{
          display: "flex",
          padding: 12,
          borderTop: "1px solid #ddd",
          backgroundColor: "white",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        <input
          type="text"
          placeholder="Ask me about Jammu and Kashmir colleges..."
          value={inputText}
          disabled={isLoading}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) handleSend();
          }}
          style={{
            flexGrow: 1,
            padding: 12,
            fontSize: 16,
            borderRadius: 24,
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputText.trim()}
          style={{
            marginLeft: 12,
            padding: "12px 24px",
            backgroundColor: "#0288d1",
            border: "none",
            borderRadius: 24,
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            cursor: isLoading || !inputText.trim() ? "not-allowed" : "pointer",
            userSelect: "none",
          }}
        >
          {isLoading ? "Loading..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default KashmirCollegeAI;














