
// console.log("✅ chat.js loaded (with sidebar history)");

// const chatWindow = document.getElementById("chatWindow");
// const userInput = document.getElementById("userInput");
// const sendBtn = document.getElementById("sendBtn");

// const chatList = document.getElementById("chatList");
// const newChatBtn = document.getElementById("newChatBtn");

// let currentSessionId = null;
// let isWaiting = false;

// /* ------------------------------
//    UTILS
// --------------------------------*/

// function scrollToBottom() {
//   chatWindow.scrollTop = chatWindow.scrollHeight;
// }

// function clearChatWindow() {
//   chatWindow.innerHTML = "";
// }

// function markdownToHtml(text) {
//   return text
//     .replace(/\n/g, "<br>")
//     .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// }

// /* ------------------------------
//    MESSAGE UI
// --------------------------------*/

// function addMessage(text, sender) {
//   const messageDiv = document.createElement("div");
//   messageDiv.classList.add("message", sender);

//   if (sender === "assistant") {
//     const avatar = document.createElement("img");
//     avatar.src = "/static/assets/safar.png";
//     avatar.classList.add("avatar");
//     messageDiv.appendChild(avatar);
//   }

//   const bubble = document.createElement("div");
//   bubble.classList.add("bubble");

//   if (sender === "assistant") {
//     bubble.innerHTML = markdownToHtml(text);
//   } else {
//     bubble.textContent = text;
//   }

//   messageDiv.appendChild(bubble);
//   chatWindow.appendChild(messageDiv);
//   scrollToBottom();
// }

// /* ------------------------------
//    LOADING INDICATOR
// --------------------------------*/

// function showLoading() {
//   const div = document.createElement("div");
//   div.classList.add("message", "assistant");
//   div.id = "loading";

//   div.innerHTML = `
//     <img src="/static/assets/safar.png" class="avatar">
//     <div class="bubble loading">
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//     </div>
//   `;

//   chatWindow.appendChild(div);
//   scrollToBottom();
// }

// function hideLoading() {
//   const el = document.getElementById("loading");
//   if (el) el.remove();
// }

// /* ------------------------------
//    SEND MESSAGE
// --------------------------------*/

// async function sendMessage() {
//   const text = userInput.value.trim();
//   if (!text || isWaiting || !currentSessionId) return;

//   addMessage(text, "user");
//   userInput.value = "";

//   isWaiting = true;
//   sendBtn.disabled = true;
//   showLoading();

//   try {
//     const res = await fetch("/ask", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: text,
//         session_id: currentSessionId
//       })
//     });

//     const data = await res.json();
//     hideLoading();

//     addMessage(data.reply, "assistant");
//     // await loadSessions();


//   } catch (err) {
//     hideLoading();
//     addMessage("Something went wrong. Please try again.", "assistant");
//   } finally {
//     isWaiting = false;
//     sendBtn.disabled = false;
//   }
// }

// /* ------------------------------
//    LOAD CHAT HISTORY
// --------------------------------*/

// async function loadChatHistory(sessionId) {
//   clearChatWindow();
//   currentSessionId = sessionId;

//   const res = await fetch(`/history/${sessionId}`);
//   const data = await res.json();

//   if (data.history.length === 0) {
//     addMessage(
//       "Hi, I’m Safar 👋 Tell me your destination, budget, and travel dates.",
//       "assistant"
//     );
//     return;
//   }

//   data.history.forEach(msg => {
//     addMessage(msg.content, msg.role);
//   });
// }

// /* ------------------------------
//    LOAD SESSIONS (SIDEBAR)
// --------------------------------*/

// async function loadSessions() {
//   chatList.innerHTML = "";

//   const res = await fetch("/sessions");
//   const data = await res.json();

//   data.sessions.forEach(session => {
//     const item = document.createElement("div");
//     item.classList.add("chat-item");
//     item.textContent = "Travel Chat";

//     item.onclick = () => {
//       document
//         .querySelectorAll(".chat-item")
//         .forEach(el => el.classList.remove("active"));
//       item.classList.add("active");
//       loadChatHistory(session.session_id);
//     };

//     chatList.appendChild(item);
//   });
// }

// /* ------------------------------
//    NEW CHAT
// --------------------------------*/

// function createNewChat() {
//   currentSessionId =
//     "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

//   clearChatWindow();
//   addMessage(
//     "Hi, I’m Safar 👋 Tell me your destination, budget, and travel dates.",
//     "assistant"
//   );

//   loadSessions();
// }

// /* ------------------------------
//    EVENTS
// --------------------------------*/

// sendBtn.addEventListener("click", sendMessage);
// userInput.addEventListener("keypress", e => {
//   if (e.key === "Enter") sendMessage();
// });

// newChatBtn.addEventListener("click", createNewChat);

// /* ------------------------------
//    INIT
// --------------------------------*/

// window.addEventListener("load", async () => {
//   await loadSessions();
//   createNewChat();
// });














// console.log("✅ chat.js loaded (with sidebar history)");

// const chatWindow = document.getElementById("chatWindow");
// const userInput = document.getElementById("userInput");
// const sendBtn = document.getElementById("sendBtn");

// const chatList = document.getElementById("chatList");
// const newChatBtn = document.getElementById("newChatBtn");

// let currentSessionId = null;
// let isWaiting = false;

// /* ------------------------------
//    HELPERS
// --------------------------------*/

// function scrollToBottom() {
//   chatWindow.scrollTop = chatWindow.scrollHeight;
// }

// function clearChatWindow() {
//   chatWindow.innerHTML = "";
// }

// function markdownToHtml(text) {
//   return text
//     .replace(/\n/g, "<br>")
//     .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// }

// /* ------------------------------
//    MESSAGE UI
// --------------------------------*/

// function addMessage(text, sender) {
//   const messageDiv = document.createElement("div");
//   messageDiv.classList.add("message", sender);

//   if (sender === "assistant") {
//     const avatar = document.createElement("img");
//     avatar.src = "/static/assets/safar.png";
//     avatar.classList.add("avatar");
//     messageDiv.appendChild(avatar);
//   }

//   const bubble = document.createElement("div");
//   bubble.classList.add("bubble");

//   bubble.innerHTML =
//     sender === "assistant" ? markdownToHtml(text) : text;

//   messageDiv.appendChild(bubble);
//   chatWindow.appendChild(messageDiv);
//   scrollToBottom();
// }

// /* ------------------------------
//    LOADING INDICATOR
// --------------------------------*/

// function showLoading() {
//   const div = document.createElement("div");
//   div.classList.add("message", "assistant");
//   div.id = "loading";

//   div.innerHTML = `
//     <img src="/static/assets/safar.png" class="avatar">
//     <div class="bubble loading">
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//     </div>
//   `;

//   chatWindow.appendChild(div);
//   scrollToBottom();
// }

// function hideLoading() {
//   const el = document.getElementById("loading");
//   if (el) el.remove();
// }

// /* ------------------------------
//    SEND MESSAGE
// --------------------------------*/

// async function sendMessage() {
//   const text = userInput.value.trim();
//   if (!text || isWaiting || !currentSessionId) return;

//   addMessage(text, "user");
//   userInput.value = "";

//   isWaiting = true;
//   sendBtn.disabled = true;
//   showLoading();

//   try {
//     const res = await fetch("/ask", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: text,
//         session_id: currentSessionId
//       })
//     });

//     const data = await res.json();
//     hideLoading();

//     addMessage(data.reply, "assistant");

//     // ✅ refresh sidebar with real chats
//     await loadSessions();

//   } catch (err) {
//     hideLoading();
//     addMessage("Something went wrong. Please try again.", "assistant");
//   } finally {
//     isWaiting = false;
//     sendBtn.disabled = false;
//   }
// }

// /* ------------------------------
//    LOAD CHAT HISTORY
// --------------------------------*/

// async function loadChatHistory(sessionId) {
//   currentSessionId = sessionId;
//   clearChatWindow();

//   const res = await fetch(`/history/${sessionId}`);
//   const data = await res.json();

//   if (!data.history || data.history.length === 0) {
//     addMessage(
//       "Hi, I’m Safar 👋 Tell me your destination, budget, and travel dates.",
//       "assistant"
//     );
//     return;
//   }

//   data.history.forEach(msg => {
//     addMessage(msg.content, msg.role);
//   });
// }

// /* ------------------------------
//    LOAD SESSIONS (SIDEBAR)
// --------------------------------*/

// async function loadSessions() {
//   chatList.innerHTML = "";

//   const res = await fetch("/sessions");
//   const data = await res.json();

//   if (!data.sessions || data.sessions.length === 0) {
//     chatList.innerHTML = "<p class='empty-chat'>No chats yet</p>";
//     return;
//   }

//   data.sessions.forEach(session => {
//     const item = document.createElement("div");
//     item.classList.add("chat-item");

//     item.textContent = session.preview || "Travel Chat";

//     if (session.session_id === currentSessionId) {
//       item.classList.add("active");
//     }

//     item.onclick = () => {
//       document
//         .querySelectorAll(".chat-item")
//         .forEach(el => el.classList.remove("active"));

//       item.classList.add("active");
//       loadChatHistory(session.session_id);
//     };

//     chatList.appendChild(item);
//   });
// }

// /* ------------------------------
//    NEW CHAT
// --------------------------------*/

// function createNewChat() {
//   currentSessionId =
//     "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

//   clearChatWindow();
//   addMessage(
//     "Hi, I’m Safar 👋 Tell me your destination, budget, and travel dates.",
//     "assistant"
//   );

//   loadSessions();
// }

// /* ------------------------------
//    EVENTS
// --------------------------------*/

// sendBtn.addEventListener("click", sendMessage);
// userInput.addEventListener("keypress", e => {
//   if (e.key === "Enter") sendMessage();
// });

// newChatBtn.addEventListener("click", createNewChat);

// /* ------------------------------
//    INIT
// --------------------------------*/

// window.addEventListener("load", async () => {
//   await loadSessions();

//   // ✅ Load most recent chat automatically
//   const firstChat = chatList.querySelector(".chat-item");
//   if (firstChat) firstChat.click();
//   else createNewChat();
// });

 








// console.log("✅ chat.js loaded (FIXED VERSION)");

// const chatWindow = document.getElementById("chatWindow");
// const userInput = document.getElementById("userInput");
// const sendBtn = document.getElementById("sendBtn");

// const chatList = document.getElementById("chatList");
// const newChatBtn = document.getElementById("newChatBtn");

// let currentSessionId = null;
// let isWaiting = false;

// /* ------------------------------
//    HELPERS
// --------------------------------*/

// function scrollToBottom() {
//   chatWindow.scrollTop = chatWindow.scrollHeight;
// }

// function clearChatWindow() {
//   chatWindow.innerHTML = "";
// }

// function markdownToHtml(text) {
//   return text
//     .replace(/\n/g, "<br>")
//     .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// }

// /* ------------------------------
//    MESSAGE UI
// --------------------------------*/

// function addMessage(text, sender) {
//   const messageDiv = document.createElement("div");
//   messageDiv.classList.add("message", sender);

//   if (sender === "assistant") {
//     const avatar = document.createElement("img");
//     avatar.src = "/static/assets/safar.png";
//     avatar.classList.add("avatar");
//     messageDiv.appendChild(avatar);
//   }

//   const bubble = document.createElement("div");
//   bubble.classList.add("bubble");

//   bubble.innerHTML =
//     sender === "assistant" ? markdownToHtml(text) : text;

//   messageDiv.appendChild(bubble);
//   chatWindow.appendChild(messageDiv);
//   scrollToBottom();
// }

// /* ------------------------------
//    LOADING INDICATOR
// --------------------------------*/

// function showLoading() {
//   const div = document.createElement("div");
//   div.classList.add("message", "assistant");
//   div.id = "loading";

//   div.innerHTML = `
//     <img src="/static/assets/safar.png" class="avatar">
//     <div class="bubble loading">
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//     </div>
//   `;

//   chatWindow.appendChild(div);
//   scrollToBottom();
// }

// function hideLoading() {
//   const el = document.getElementById("loading");
//   if (el) el.remove();
// }

// /* ------------------------------
//    SEND MESSAGE (FIXED)
// --------------------------------*/

// async function sendMessage() {
//   const text = userInput.value.trim();
//   if (!text || isWaiting || !currentSessionId) return;

//   addMessage(text, "user");
//   userInput.value = "";

//   isWaiting = true;
//   sendBtn.disabled = true;
//   showLoading();

//   try {
//     const res = await fetch("/ask", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: text,
//         session_id: currentSessionId
//       })
//     });

//     const data = await res.json();
    
//     // ✅ FIXED: Only show error if response explicitly failed
//     hideLoading();

//     if (res.ok && data.success !== false) {
//       addMessage(data.reply, "assistant");
      
//       // ✅ Refresh sidebar after successful message
//       await loadSessions();
//     } else {
//       addMessage("Something went wrong. Please try again.", "assistant");
//     }

//   } catch (err) {
//     console.error("Error:", err);
//     hideLoading();
//     addMessage("Connection error. Please check your internet.", "assistant");
//   } finally {
//     isWaiting = false;
//     sendBtn.disabled = false;
//   }
// }

// /* ------------------------------
//    LOAD CHAT HISTORY (IMPROVED)
// --------------------------------*/

// async function loadChatHistory(sessionId) {
//   currentSessionId = sessionId;
//   clearChatWindow();

//   try {
//     const res = await fetch(`/history/${sessionId}`);
//     const data = await res.json();

//     if (!data.history || data.history.length === 0) {
//       addMessage(
//         "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//         "assistant"
//       );
//       return;
//     }

//     data.history.forEach(msg => {
//       addMessage(msg.content, msg.role);
//     });
//   } catch (err) {
//     console.error("Error loading history:", err);
//     addMessage(
//       "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//       "assistant"
//     );
//   }
// }

// /* ------------------------------
//    LOAD SESSIONS (SIDEBAR) - FIXED
// --------------------------------*/

// async function loadSessions() {
//   try {
//     const res = await fetch("/sessions");
//     const data = await res.json();

//     chatList.innerHTML = "";

//     if (!data.sessions || data.sessions.length === 0) {
//       chatList.innerHTML = "<p class='empty-chat'>No chats yet</p>";
//       return;
//     }

//     // ✅ FIXED: Properly display all sessions
//     data.sessions.forEach(session => {
//       const item = document.createElement("div");
//       item.classList.add("chat-item");

//       // Show preview text
//       item.textContent = session.preview || "Travel Chat";

//       // Highlight active chat
//       if (session.session_id === currentSessionId) {
//         item.classList.add("active");
//       }

//       // Click handler to load that chat
//       item.onclick = () => {
//         document
//           .querySelectorAll(".chat-item")
//           .forEach(el => el.classList.remove("active"));

//         item.classList.add("active");
//         loadChatHistory(session.session_id);
//       };

//       chatList.appendChild(item);
//     });
//   } catch (err) {
//     console.error("Error loading sessions:", err);
//     chatList.innerHTML = "<p class='empty-chat'>Error loading chats</p>";
//   }
// }

// /* ------------------------------
//    NEW CHAT
// --------------------------------*/

// function createNewChat() {
//   currentSessionId =
//     "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

//   clearChatWindow();
//   addMessage(
//     "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//     "assistant"
//   );

//   // ✅ Clear active state from sidebar
//   document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
// }

// /* ------------------------------
//    EVENTS
// --------------------------------*/

// sendBtn.addEventListener("click", sendMessage);
// userInput.addEventListener("keypress", e => {
//   if (e.key === "Enter") sendMessage();
// });

// newChatBtn.addEventListener("click", createNewChat);

// /* ------------------------------
//    INIT (IMPROVED)
// --------------------------------*/

// window.addEventListener("load", async () => {
//   console.log("🚀 Initializing Safar...");
  
//   // Load sidebar sessions first
//   await loadSessions();

//   // ✅ Load most recent chat if exists, otherwise create new
//   const firstChat = chatList.querySelector(".chat-item");
  
//   if (firstChat) {
//     console.log("✅ Loading existing chat");
//     firstChat.click();
//   } else {
//     console.log("✅ Creating new chat");
//     createNewChat();
//   }
// });





   


















// console.log("✅ chat.js loaded (DEBUG VERSION)");

// const chatWindow = document.getElementById("chatWindow");
// const userInput = document.getElementById("userInput");
// const sendBtn = document.getElementById("sendBtn");

// const chatList = document.getElementById("chatList");
// const newChatBtn = document.getElementById("newChatBtn");

// let currentSessionId = null;
// let isWaiting = false;

// /* ------------------------------
//    HELPERS
// --------------------------------*/

// function scrollToBottom() {
//   chatWindow.scrollTop = chatWindow.scrollHeight;
// }

// function clearChatWindow() {
//   chatWindow.innerHTML = "";
// }

// function markdownToHtml(text) {
//   return text
//     .replace(/\n/g, "<br>")
//     .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// }

// /* ------------------------------
//    MESSAGE UI
// --------------------------------*/

// function addMessage(text, sender) {
//   const messageDiv = document.createElement("div");
//   messageDiv.classList.add("message", sender);

//   if (sender === "assistant") {
//     const avatar = document.createElement("img");
//     avatar.src = "/static/assets/safar.png";
//     avatar.classList.add("avatar");
//     messageDiv.appendChild(avatar);
//   }

//   const bubble = document.createElement("div");
//   bubble.classList.add("bubble");

//   bubble.innerHTML =
//     sender === "assistant" ? markdownToHtml(text) : text;

//   messageDiv.appendChild(bubble);
//   chatWindow.appendChild(messageDiv);
//   scrollToBottom();
// }

// /* ------------------------------
//    LOADING INDICATOR
// --------------------------------*/

// function showLoading() {
//   const div = document.createElement("div");
//   div.classList.add("message", "assistant");
//   div.id = "loading";

//   div.innerHTML = `
//     <img src="/static/assets/safar.png" class="avatar">
//     <div class="bubble loading">
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//     </div>
//   `;

//   chatWindow.appendChild(div);
//   scrollToBottom();
// }

// function hideLoading() {
//   const el = document.getElementById("loading");
//   if (el) el.remove();
// }

// /* ------------------------------
//    SEND MESSAGE (WITH DEBUG)
// --------------------------------*/

// async function sendMessage() {
//   const text = userInput.value.trim();
//   if (!text || isWaiting || !currentSessionId) {
//     console.warn("❌ Cannot send:", { text, isWaiting, currentSessionId });
//     return;
//   }

//   console.log("📤 Sending message:", text);
  
//   addMessage(text, "user");
//   userInput.value = "";

//   isWaiting = true;
//   sendBtn.disabled = true;
//   showLoading();

//   try {
//     console.log("🔄 Fetching /ask...");
    
//     const res = await fetch("/ask", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: text,
//         session_id: currentSessionId
//       })
//     });

//     console.log("📥 Response status:", res.status);

//     const data = await res.json();
//     console.log("📥 Response data:", data);
    
//     hideLoading();

//     if (res.ok && data.reply) {
//       addMessage(data.reply, "assistant");
//       console.log("✅ Message sent successfully");
      
//       // Refresh sidebar after successful message
//       await loadSessions();
//     } else {
//       console.error("❌ Server returned error:", data);
//       addMessage(data.reply || "Something went wrong. Please try again.", "assistant");
//     }

//   } catch (err) {
//     console.error("❌ Network error:", err);
//     hideLoading();
//     addMessage("Connection error. Please check your internet and server.", "assistant");
//   } finally {
//     isWaiting = false;
//     sendBtn.disabled = false;
//   }
// }

// /* ------------------------------
//    LOAD CHAT HISTORY (WITH DEBUG)
// --------------------------------*/

// async function loadChatHistory(sessionId) {
//   console.log("📂 Loading chat history for:", sessionId);
  
//   currentSessionId = sessionId;
//   clearChatWindow();

//   try {
//     const res = await fetch(`/history/${sessionId}`);
//     const data = await res.json();

//     console.log("📥 History loaded:", data.history?.length || 0, "messages");

//     if (!data.history || data.history.length === 0) {
//       addMessage(
//         "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//         "assistant"
//       );
//       return;
//     }

//     data.history.forEach(msg => {
//       addMessage(msg.content, msg.role);
//     });
//   } catch (err) {
//     console.error("❌ Error loading history:", err);
//     addMessage(
//       "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//       "assistant"
//     );
//   }
// }

// /* ------------------------------
//    LOAD SESSIONS (SIDEBAR) - WITH DEBUG
// --------------------------------*/

// async function loadSessions() {
//   console.log("📋 Loading sessions...");
  
//   try {
//     const res = await fetch("/sessions");
//     const data = await res.json();

//     console.log("📥 Sessions loaded:", data.sessions?.length || 0);

//     chatList.innerHTML = "";

//     if (!data.sessions || data.sessions.length === 0) {
//       console.log("⚠️ No sessions found");
//       chatList.innerHTML = "<p class='empty-chat'>No chats yet</p>";
//       return;
//     }

//     console.log("✅ Displaying", data.sessions.length, "sessions");

//     data.sessions.forEach((session, index) => {
//       console.log(`  ${index + 1}. ${session.session_id}: ${session.preview}`);
      
//       const item = document.createElement("div");
//       item.classList.add("chat-item");

//       item.textContent = session.preview || "Travel Chat";

//       if (session.session_id === currentSessionId) {
//         item.classList.add("active");
//       }

//       item.onclick = () => {
//         console.log("🖱️ Clicked session:", session.session_id);
        
//         document
//           .querySelectorAll(".chat-item")
//           .forEach(el => el.classList.remove("active"));

//         item.classList.add("active");
//         loadChatHistory(session.session_id);
//       };

//       chatList.appendChild(item);
//     });
//   } catch (err) {
//     console.error("❌ Error loading sessions:", err);
//     chatList.innerHTML = "<p class='empty-chat'>Error loading chats</p>";
//   }
// }

// /* ------------------------------
//    NEW CHAT
// --------------------------------*/

// function createNewChat() {
//   currentSessionId =
//     "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

//   console.log("🆕 Created new session:", currentSessionId);

//   clearChatWindow();
//   addMessage(
//     "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//     "assistant"
//   );

//   document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
// }

// /* ------------------------------
//    EVENTS
// --------------------------------*/

// sendBtn.addEventListener("click", sendMessage);
// userInput.addEventListener("keypress", e => {
//   if (e.key === "Enter") sendMessage();
// });

// newChatBtn.addEventListener("click", createNewChat);

// /* ------------------------------
//    INIT (WITH DEBUG)
// --------------------------------*/

// window.addEventListener("load", async () => {
//   console.log("🚀 Initializing Safar...");
  
//   await loadSessions();

//   const firstChat = chatList.querySelector(".chat-item");
  
//   if (firstChat) {
//     console.log("✅ Loading existing chat");
//     firstChat.click();
//   } else {
//     console.log("✅ Creating new chat");
//     createNewChat();
//   }
  
//   console.log("✅ Safar initialized");
// });










// console.log("✅ chat.js loaded (FIXED - NULL SAFE VERSION)");

// // Wait for DOM to be fully loaded before accessing elements
// let chatWindow, userInput, sendBtn, chatList, newChatBtn;
// let currentSessionId = null;
// let isWaiting = false;

// /* ------------------------------
//    INITIALIZE ELEMENTS SAFELY
// --------------------------------*/

// function initializeElements() {
//   chatWindow = document.getElementById("chatWindow");
//   userInput = document.getElementById("userInput");
//   sendBtn = document.getElementById("sendBtn");
//   chatList = document.getElementById("chatList");
//   newChatBtn = document.getElementById("newChatBtn");

//   // Debug: Check which elements are missing
//   console.log("🔍 Element check:", {
//     chatWindow: !!chatWindow,
//     userInput: !!userInput,
//     sendBtn: !!sendBtn,
//     chatList: !!chatList,
//     newChatBtn: !!newChatBtn
//   });

//   if (!chatWindow || !userInput || !sendBtn) {
//     console.error("❌ CRITICAL: Missing essential DOM elements!");
//     console.error("Required elements: chatWindow, userInput, sendBtn");
//     return false;
//   }

//   if (!chatList) {
//     console.warn("⚠️ chatList not found - sidebar will not work");
//   }

//   return true;
// }

// /* ------------------------------
//    HELPERS
// --------------------------------*/

// function scrollToBottom() {
//   if (chatWindow) {
//     chatWindow.scrollTop = chatWindow.scrollHeight;
//   }
// }

// function clearChatWindow() {
//   if (chatWindow) {
//     chatWindow.innerHTML = "";
//   }
// }

// function markdownToHtml(text) {
//   return text
//     .replace(/\n/g, "<br>")
//     .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// }

// /* ------------------------------
//    MESSAGE UI
// --------------------------------*/

// function addMessage(text, sender) {
//   if (!chatWindow) return;

//   const messageDiv = document.createElement("div");
//   messageDiv.classList.add("message", sender);

//   if (sender === "assistant") {
//     const avatar = document.createElement("img");
//     avatar.src = "/static/assets/safar.png";
//     avatar.classList.add("avatar");
//     messageDiv.appendChild(avatar);
//   }

//   const bubble = document.createElement("div");
//   bubble.classList.add("bubble");

//   bubble.innerHTML =
//     sender === "assistant" ? markdownToHtml(text) : text;

//   messageDiv.appendChild(bubble);
//   chatWindow.appendChild(messageDiv);
//   scrollToBottom();
// }

// /* ------------------------------
//    LOADING INDICATOR
// --------------------------------*/

// function showLoading() {
//   if (!chatWindow) return;

//   const div = document.createElement("div");
//   div.classList.add("message", "assistant");
//   div.id = "loading";

//   div.innerHTML = `
//     <img src="/static/assets/safar.png" class="avatar">
//     <div class="bubble loading">
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//       <span class="typing-dot"></span>
//     </div>
//   `;

//   chatWindow.appendChild(div);
//   scrollToBottom();
// }

// function hideLoading() {
//   const el = document.getElementById("loading");
//   if (el) el.remove();
// }

// /* ------------------------------
//    SEND MESSAGE
// --------------------------------*/

// async function sendMessage() {
//   if (!userInput) return;

//   const text = userInput.value.trim();
//   if (!text || isWaiting || !currentSessionId) {
//     console.warn("❌ Cannot send:", { text, isWaiting, currentSessionId });
//     return;
//   }

//   console.log("📤 Sending message:", text);
  
//   addMessage(text, "user");
//   userInput.value = "";

//   isWaiting = true;
//   if (sendBtn) sendBtn.disabled = true;
//   showLoading();

//   try {
//     console.log("🔄 Fetching /ask...");
    
//     const res = await fetch("/ask", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: text,
//         session_id: currentSessionId
//       })
//     });

//     console.log("📥 Response status:", res.status);

//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//     }

//     const data = await res.json();
//     console.log("📥 Response data:", data);
    
//     hideLoading();

//     if (data.reply) {
//       addMessage(data.reply, "assistant");
//       console.log("✅ Message sent successfully");
      
//       // Refresh sidebar after successful message
//       await loadSessions();
//     } else {
//       console.error("❌ No reply in response:", data);
//       addMessage("Something went wrong. Please try again.", "assistant");
//     }

//   } catch (err) {
//     console.error("❌ Error in sendMessage:", err);
//     hideLoading();
//     addMessage("Connection error. Please check your server.", "assistant");
//   } finally {
//     isWaiting = false;
//     if (sendBtn) sendBtn.disabled = false;
//   }
// }

// /* ------------------------------
//    LOAD CHAT HISTORY
// --------------------------------*/

// async function loadChatHistory(sessionId) {
//   console.log("📂 Loading chat history for:", sessionId);
  
//   currentSessionId = sessionId;
//   clearChatWindow();

//   try {
//     const res = await fetch(`/history/${sessionId}`);
    
//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}`);
//     }

//     const data = await res.json();

//     console.log("📥 History loaded:", data.history?.length || 0, "messages");

//     if (!data.history || data.history.length === 0) {
//       addMessage(
//         "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//         "assistant"
//       );
//       return;
//     }

//     data.history.forEach(msg => {
//       addMessage(msg.content, msg.role);
//     });
//   } catch (err) {
//     console.error("❌ Error loading history:", err);
//     addMessage(
//       "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//       "assistant"
//     );
//   }
// }

// /* ------------------------------
//    LOAD SESSIONS (SIDEBAR)
// --------------------------------*/

// async function loadSessions() {
//   console.log("📋 Loading sessions...");
  
//   if (!chatList) {
//     console.warn("⚠️ chatList element not found - skipping sidebar update");
//     return;
//   }

//   try {
//     const res = await fetch("/sessions");
    
//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}`);
//     }

//     const data = await res.json();

//     console.log("📥 Sessions loaded:", data.sessions?.length || 0);

//     chatList.innerHTML = "";

//     if (!data.sessions || data.sessions.length === 0) {
//       console.log("⚠️ No sessions found");
//       chatList.innerHTML = "<p class='empty-chat'>No chats yet</p>";
//       return;
//     }

//     console.log("✅ Displaying", data.sessions.length, "sessions");

//     data.sessions.forEach((session, index) => {
//       console.log(`  ${index + 1}. ${session.session_id}: ${session.preview}`);
      
//       const item = document.createElement("div");
//       item.classList.add("chat-item");

//       item.textContent = session.preview || "Travel Chat";

//       if (session.session_id === currentSessionId) {
//         item.classList.add("active");
//       }

//       item.onclick = () => {
//         console.log("🖱️ Clicked session:", session.session_id);
        
//         document
//           .querySelectorAll(".chat-item")
//           .forEach(el => el.classList.remove("active"));

//         item.classList.add("active");
//         loadChatHistory(session.session_id);
//       };

//       chatList.appendChild(item);
//     });
//   } catch (err) {
//     console.error("❌ Error loading sessions:", err);
//     if (chatList) {
//       chatList.innerHTML = "<p class='empty-chat'>Error loading chats</p>";
//     }
//   }
// }

// /* ------------------------------
//    NEW CHAT
// --------------------------------*/

// function createNewChat() {
//   currentSessionId =
//     "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

//   console.log("🆕 Created new session:", currentSessionId);

//   clearChatWindow();
//   addMessage(
//     "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//     "assistant"
//   );

//   if (chatList) {
//     document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
//   }
// }

// /* ------------------------------
//    SETUP EVENT LISTENERS
// --------------------------------*/

// function setupEventListeners() {
//   if (sendBtn) {
//     sendBtn.addEventListener("click", sendMessage);
//     console.log("✅ Send button listener attached");
//   }

//   if (userInput) {
//     userInput.addEventListener("keypress", (e) => {
//       if (e.key === "Enter") sendMessage();
//     });
//     console.log("✅ Input keypress listener attached");
//   }

//   if (newChatBtn) {
//     newChatBtn.addEventListener("click", createNewChat);
//     console.log("✅ New chat button listener attached");
//   }
// }

// /* ------------------------------
//    INIT
// --------------------------------*/

// async function initializeSafar() {
//   console.log("🚀 Initializing Safar...");
  
//   // Initialize DOM elements
//   if (!initializeElements()) {
//     console.error("❌ Failed to initialize - missing DOM elements");
//     return;
//   }

//   // Setup event listeners
//   setupEventListeners();

//   // Load existing sessions
//   await loadSessions();

//   // Load most recent chat or create new one
//   if (chatList) {
//     const firstChat = chatList.querySelector(".chat-item");
    
//     if (firstChat) {
//       console.log("✅ Loading existing chat");
//       firstChat.click();
//     } else {
//       console.log("✅ Creating new chat");
//       createNewChat();
//     }
//   } else {
//     // If no sidebar, just create a new chat
//     console.log("✅ Creating new chat (no sidebar)");
//     createNewChat();
//   }
  
//   console.log("✅ Safar initialized successfully");
// }

// // Wait for DOM to be ready
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", initializeSafar);
// } else {
//   // DOM already loaded
//   initializeSafar();
// }



console.log("✅ chat.js loaded (FIXED - NULL SAFE VERSION)");

// Wait for DOM to be fully loaded before accessing elements
let chatWindow, userInput, sendBtn, chatList, newChatBtn;
let currentSessionId = null;
let isWaiting = false;

/* ------------------------------
   INITIALIZE ELEMENTS SAFELY
--------------------------------*/

function initializeElements() {
  chatWindow = document.getElementById("chatWindow");
  userInput = document.getElementById("userInput");
  sendBtn = document.getElementById("sendBtn");
  chatList = document.getElementById("chatList");
  newChatBtn = document.getElementById("newChatBtn");

  // Debug: Check which elements are missing
  console.log("🔍 Element check:", {
    chatWindow: !!chatWindow,
    userInput: !!userInput,
    sendBtn: !!sendBtn,
    chatList: !!chatList,
    newChatBtn: !!newChatBtn
  });

  if (!chatWindow || !userInput || !sendBtn) {
    console.error("❌ CRITICAL: Missing essential DOM elements!");
    console.error("Required elements: chatWindow, userInput, sendBtn");
    return false;
  }

  if (!chatList) {
    console.warn("⚠️ chatList not found - sidebar will not work");
  }

  return true;
}

/* ------------------------------
   HELPERS
--------------------------------*/

function scrollToBottom() {
  if (chatWindow) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

function clearChatWindow() {
  if (chatWindow) {
    chatWindow.innerHTML = "";
  }
}

function markdownToHtml(text) {
  return text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/* ------------------------------
   MESSAGE UI
--------------------------------*/

function addMessage(text, sender) {
  if (!chatWindow) return;

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  if (sender === "assistant") {
    const avatar = document.createElement("img");
    avatar.src = "/static/assets/safar.png";
    avatar.classList.add("avatar");
    messageDiv.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  bubble.innerHTML =
    sender === "assistant" ? markdownToHtml(text) : text;

  messageDiv.appendChild(bubble);
  chatWindow.appendChild(messageDiv);
  scrollToBottom();
}

/* ------------------------------
   LOADING INDICATOR
--------------------------------*/

function showLoading() {
  if (!chatWindow) return;

  const div = document.createElement("div");
  div.classList.add("message", "assistant");
  div.id = "loading";

  div.innerHTML = `
    <img src="/static/assets/safar.png" class="avatar">
    <div class="bubble loading">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  chatWindow.appendChild(div);
  scrollToBottom();
}

function hideLoading() {
  const el = document.getElementById("loading");
  if (el) el.remove();
}

/* ------------------------------
   SEND MESSAGE
--------------------------------*/

async function sendMessage() {
  if (!userInput) return;

  const text = userInput.value.trim();
  if (!text || isWaiting || !currentSessionId) {
    console.warn("❌ Cannot send:", { text, isWaiting, currentSessionId });
    return;
  }

  console.log("📤 Sending message:", text);
  
  addMessage(text, "user");
  userInput.value = "";

  isWaiting = true;
  if (sendBtn) sendBtn.disabled = true;
  showLoading();

  try {
    console.log("🔄 Fetching /ask...");
    
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: currentSessionId
      })
    });

    console.log("📥 Response status:", res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("📥 Response data:", data);
    
    hideLoading();

    if (data.reply) {
      addMessage(data.reply, "assistant");
      console.log("✅ Message sent successfully");
      
      // Refresh sidebar after successful message
      await loadSessions();
    } else {
      console.error("❌ No reply in response:", data);
      addMessage("Something went wrong. Please try again.", "assistant");
    }

  } catch (err) {
    console.error("❌ Error in sendMessage:", err);
    hideLoading();
    addMessage("Connection error. Please check your server.", "assistant");
  } finally {
    isWaiting = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}

/* ------------------------------
   LOAD CHAT HISTORY
--------------------------------*/

async function loadChatHistory(sessionId) {
  console.log("📂 Loading chat history for:", sessionId);
  
  currentSessionId = sessionId;
  clearChatWindow();

  try {
    const res = await fetch(`/history/${sessionId}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    console.log("📥 History loaded:", data.history?.length || 0, "messages");

    if (!data.history || data.history.length === 0) {
      addMessage(
        "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
        "assistant"
      );
      return;
    }

    data.history.forEach(msg => {
      addMessage(msg.content, msg.role);
    });
  } catch (err) {
    console.error("❌ Error loading history:", err);
    addMessage(
      "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
      "assistant"
    );
  }
}

/* ------------------------------
   LOAD SESSIONS (SIDEBAR) - WITH DELETE
--------------------------------*/

async function loadSessions() {
  console.log("📋 Loading sessions...");
  
  if (!chatList) {
    console.warn("⚠️ chatList element not found - skipping sidebar update");
    return;
  }

  try {
    const res = await fetch("/sessions");
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    console.log("📥 Sessions loaded:", data.sessions?.length || 0);

    chatList.innerHTML = "";

    if (!data.sessions || data.sessions.length === 0) {
      console.log("⚠️ No sessions found");
      chatList.innerHTML = "<p class='empty-chat'>No chats yet</p>";
      return;
    }

    console.log("✅ Displaying", data.sessions.length, "sessions");

    data.sessions.forEach((session, index) => {
      console.log(`  ${index + 1}. ${session.session_id}: ${session.preview}`);
      
      const item = document.createElement("div");
      item.classList.add("chat-item");

      // ✅ Chat title
      const titleSpan = document.createElement("span");
      titleSpan.classList.add("chat-title");
      titleSpan.textContent = session.preview || "Travel Chat";
      
      // ✅ Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-chat-btn");
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.title = "Delete chat";
      
      deleteBtn.onclick = async (e) => {
        e.stopPropagation(); // Prevent opening the chat
        
        if (!confirm("Delete this chat? This cannot be undone.")) {
          return;
        }
        
        console.log("🗑️ Deleting session:", session.session_id);
        
        try {
          const res = await fetch(`/delete/${session.session_id}`, {
            method: "DELETE"
          });
          
          if (res.ok) {
            console.log("✅ Session deleted");
            
            // If we deleted the current chat, create a new one
            if (session.session_id === currentSessionId) {
              createNewChat();
            }
            
            // Reload sidebar
            await loadSessions();
          } else {
            alert("Failed to delete chat");
          }
        } catch (err) {
          console.error("❌ Delete error:", err);
          alert("Failed to delete chat");
        }
      };

      item.appendChild(titleSpan);
      item.appendChild(deleteBtn);

      if (session.session_id === currentSessionId) {
        item.classList.add("active");
      }

      item.onclick = () => {
        console.log("🖱️ Clicked session:", session.session_id);
        
        document
          .querySelectorAll(".chat-item")
          .forEach(el => el.classList.remove("active"));

        item.classList.add("active");
        loadChatHistory(session.session_id);
      };

      chatList.appendChild(item);
    });
  } catch (err) {
    console.error("❌ Error loading sessions:", err);
    if (chatList) {
      chatList.innerHTML = "<p class='empty-chat'>Error loading chats</p>";
    }
  }
}

/* ------------------------------
   NEW CHAT
--------------------------------*/

function createNewChat() {
  currentSessionId =
    "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  console.log("🆕 Created new session:", currentSessionId);

  clearChatWindow();
  addMessage(
    "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
    "assistant"
  );

  if (chatList) {
    document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
  }
}

/* ------------------------------
   SETUP EVENT LISTENERS
--------------------------------*/

function setupEventListeners() {
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
    console.log("✅ Send button listener attached");
  }

  if (userInput) {
    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
    console.log("✅ Input keypress listener attached");
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", createNewChat);
    console.log("✅ New chat button listener attached");
  }
}

/* ------------------------------
   INIT
--------------------------------*/

async function initializeSafar() {
  console.log("🚀 Initializing Safar...");
  
  // Initialize DOM elements
  if (!initializeElements()) {
    console.error("❌ Failed to initialize - missing DOM elements");
    return;
  }

  // Setup event listeners
  setupEventListeners();

  // Load existing sessions
  await loadSessions();

  // Load most recent chat or create new one
  if (chatList) {
    const firstChat = chatList.querySelector(".chat-item");
    
    if (firstChat) {
      console.log("✅ Loading existing chat");
      firstChat.click();
    } else {
      console.log("✅ Creating new chat");
      createNewChat();
    }
  } else {
    // If no sidebar, just create a new chat
    console.log("✅ Creating new chat (no sidebar)");
    createNewChat();
  }
  
  console.log("✅ Safar initialized successfully");
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSafar);
} else {
  // DOM already loaded
  initializeSafar();
}










