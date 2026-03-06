
// /* -----------------------------------------------------------
//    SAFAR CHAT UI - MAIN LOGIC
//    Handles: Sending messages, loading history, 
//    managing sidebar sessions (delete/rename), and auth status.
// ----------------------------------------------------------- */
// console.log("✅ chat.js loaded (WITH DELETE & RENAME BUTTONS)");
// // 🔒 BLOCK CHAT ACCESS WITHOUT LOGIN
// const safarUser = localStorage.getItem("safarUser");

// if (!safarUser) {
//   alert("Please login to use Safar ✈️");
//   window.location.href = "/";
// }

// // Wait for DOM to be fully loaded before accessing elements
// let chatWindow, userInput, sendBtn, chatList, newChatBtn;
// let currentSessionId = null;
// let isWaiting = false;

// // ✅ NEW: Helper to get logged-in user ID
// function getUserId() {
//   const user = JSON.parse(localStorage.getItem("safarUser"));
//   return user ? user.id : null;
// }

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
//         session_id: currentSessionId,
//         user_id: getUserId() // ✅ Pass user ID for personalization
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
//    DELETE CHAT
// --------------------------------*/

// async function deleteChat(sessionId, event) {
//   event.stopPropagation(); // Prevent opening the chat

//   if (!confirm("Delete this chat? This cannot be undone.")) {
//     return;
//   }

//   console.log("🗑️ Deleting session:", sessionId);

//   try {
//     const userId = getUserId();
//     const url = `/delete/${sessionId}?user_id=${userId}`;
//     const res = await fetch(url, { method: "DELETE" });

//     if (res.ok) {
//       console.log("✅ Session deleted");

//       // If we deleted the current chat, create a new one
//       if (sessionId === currentSessionId) {
//         createNewChat();
//       }

//       // Reload sidebar
//       await loadSessions();
//     } else {
//       alert("Failed to delete chat");
//     }
//   } catch (err) {
//     console.error("❌ Delete error:", err);
//     alert("Failed to delete chat");
//   }
// }

// /* ------------------------------
//    RENAME CHAT
// --------------------------------*/

// async function renameChat(sessionId, currentTitle, event) {
//   event.stopPropagation(); // Prevent opening the chat

//   const newTitle = prompt("Enter new chat title:", currentTitle);

//   if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) {
//     return; // User cancelled or didn't change anything
//   }

//   console.log("✏️ Renaming session:", sessionId, "to:", newTitle);

//   try {
//     const res = await fetch(`/rename/${sessionId}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         title: newTitle.trim(),
//         user_id: getUserId()
//       })
//     });

//     const data = await res.json();

//     if (res.ok && data.success) {
//       console.log("✅ Session renamed");

//       // Reload sidebar to show new title
//       await loadSessions();
//     } else {
//       alert(data.error || "Failed to rename chat");
//     }
//   } catch (err) {
//     console.error("❌ Rename error:", err);
//     alert("Failed to rename chat");
//   }
// }

// /* ------------------------------
//    LOAD SESSIONS (SIDEBAR) - WITH DELETE & RENAME BUTTONS
// --------------------------------*/

// async function loadSessions() {
//   console.log("📋 Loading sessions...");

//   if (!chatList) {
//     console.warn("⚠️ chatList element not found - skipping sidebar update");
//     return;
//   }

//   try {
//     const userId = getUserId();
//     const url = userId ? `/sessions?user_id=${userId}` : "/sessions";
//     const res = await fetch(url);

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

//       // ✅ Chat title
//       const titleSpan = document.createElement("span");
//       titleSpan.classList.add("chat-title");
//       titleSpan.textContent = session.preview || "Travel Chat";

//       // ✅ Button container
//       const buttonContainer = document.createElement("div");
//       buttonContainer.classList.add("chat-buttons");

//       // ✅ Rename button
//       const renameBtn = document.createElement("button");
//       renameBtn.classList.add("rename-chat-btn");
//       renameBtn.textContent = "Rename";
//       renameBtn.title = "Rename chat";
//       renameBtn.onclick = (e) => renameChat(session.session_id, session.preview, e);

//       // ✅ Delete button
//       const deleteBtn = document.createElement("button");
//       deleteBtn.classList.add("delete-chat-btn");
//       deleteBtn.textContent = "Delete";
//       deleteBtn.title = "Delete chat";
//       deleteBtn.onclick = (e) => deleteChat(session.session_id, e);

//       buttonContainer.appendChild(renameBtn);
//       buttonContainer.appendChild(deleteBtn);

//       item.appendChild(titleSpan);
//       item.appendChild(buttonContainer);

//       if (session.session_id === currentSessionId) {
//         item.classList.add("active");
//       }

//       item.onclick = (e) => {
//         // Only open chat if we didn't click a button
//         if (!e.target.classList.contains("rename-chat-btn") &&
//           !e.target.classList.contains("delete-chat-btn")) {
//           console.log("🖱️ Clicked session:", session.session_id);

//           document
//             .querySelectorAll(".chat-item")
//             .forEach(el => el.classList.remove("active"));

//           item.classList.add("active");
//           loadChatHistory(session.session_id);
//         }
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
//    LOAD USER AUTH STATUS
// --------------------------------*/

// function loadUserStatus() {
//   const userStatus = document.getElementById("chatUserStatus");

//   if (!userStatus) return;

//   const user = localStorage.getItem("safarUser");

//   if (user) {
//     try {
//       const userData = JSON.parse(user);
//       userStatus.textContent = `Logged in as ${userData.name}`;
//     } catch (error) {
//       console.error("User parse error:", error);
//       userStatus.textContent = "Logged in";
//     }
//   } else {
//     userStatus.textContent = "Not logged in";
//   }
// }



// /* ------------------------------
//    INIT
// --------------------------------*/

// async function initializeSafar() {
//   console.log("🚀 Initializing Safar...");
//   loadUserStatus();   // ✅ NEW LINE


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



/* -----------------------------------------------------------
   SAFAR CHAT UI - MAIN LOGIC
----------------------------------------------------------- */

console.log("✅ chat.js loaded");
const UNSPLASH_ACCESS_KEY = CONFIG.UNSPLASH_ACCESS_KEY;

const safarUser = localStorage.getItem("safarUser");

if (!safarUser) {
  alert("Please login to use Safar ✈️");
  window.location.href = "/";
}

let chatWindow, userInput, sendBtn, chatList, newChatBtn;
let currentSessionId = null;
let isWaiting = false;

/* ------------------------------
   USER ID
--------------------------------*/

function getUserId() {
  const user = JSON.parse(localStorage.getItem("safarUser"));
  return user ? user.id : null;
}

/* ------------------------------
   INIT ELEMENTS
--------------------------------*/

function initializeElements() {
  chatWindow = document.getElementById("chatWindow");
  userInput = document.getElementById("userInput");
  sendBtn = document.getElementById("sendBtn");
  chatList = document.getElementById("chatList");
  newChatBtn = document.getElementById("newChatBtn");

  return true;
}

/* ------------------------------
   HELPERS
--------------------------------*/

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function clearChatWindow() {
  chatWindow.innerHTML = "";
}

function markdownToHtml(text) {
  return text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/* ------------------------------
   SAVE TRIP
--------------------------------*/

async function saveTrip(tripText) {

  const user = JSON.parse(localStorage.getItem("safarUser"));

  if (!user) {
    alert("Please login first");
    return;
  }

  const destination = extractDestination(tripText) || "Trip Plan";

  const { data, error } = await supabaseClient
    .from("saved_trips")
    .insert([
      {
        user_id: user.id,
        destination: destination,
        trip_plan: tripText
      }
    ]);

  if (error) {
    console.error(error);
    alert("Failed to save trip");
    return;
  }

  alert("Trip saved successfully ✈️");

  loadSavedTrips();

}


/* ------------------------------
   DESTINATION IMAGE FETCH
--------------------------------*/

async function fetchDestinationImages(destination) {

  try {

    const url = `https://api.unsplash.com/search/photos?query=${destination}&per_page=3&client_id=${UNSPLASH_ACCESS_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results) return [];

    return data.results.map(img => img.urls.small);

  } catch (error) {

    console.error("Unsplash API error:", error);
    return [];

  }

}

function createImageGallery(images) {

  const gallery = document.createElement("div");
  gallery.className = "destination-gallery";

  images.forEach(src => {

    const img = document.createElement("img");
    img.src = src;
    img.className = "destination-img";

    gallery.appendChild(img);

  });

  return gallery;

}

function extractDestination(text) {

  const places = [
    "bali","kyoto","paris","tokyo","sikkim","ladakh","goa","rome","london","dubai"
  ];

  text = text.toLowerCase();

  for (let place of places) {
    if (text.includes(place)) {
      return place;
    }
  }

  return null;

}


/* ------------------------------
   MESSAGE UI
--------------------------------*/

function addMessage(text, sender) {

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

  // bubble.innerHTML =
  //   sender === "assistant" ? markdownToHtml(text) : text;
  if (sender === "assistant") {

  const destination = extractDestination(text);

  if (destination) {

    fetchDestinationImages(destination).then(images => {

      if (images.length > 0) {

        const gallery = createImageGallery(images);
        bubble.appendChild(gallery);

      }

      bubble.innerHTML += markdownToHtml(text);

    });

  } else {

    bubble.innerHTML = markdownToHtml(text);

  }

} else {

  bubble.innerHTML = text;

}

  messageDiv.appendChild(bubble);
  /* SAVE TRIP BUTTON */

if (sender === "assistant") {

  const saveBtn = document.createElement("button");
  saveBtn.classList.add("save-trip-btn");
  saveBtn.textContent = "💾 Save Trip";

  saveBtn.onclick = () => {
    saveTrip(text);
  };

  bubble.appendChild(saveBtn);

}
  chatWindow.appendChild(messageDiv);

  scrollToBottom();
}

/* ------------------------------
   LOADING
--------------------------------*/

function showLoading() {

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

  const text = userInput.value.trim();

  if (!text || isWaiting || !currentSessionId) return;

  addMessage(text, "user");
  userInput.value = "";

  isWaiting = true;
  sendBtn.disabled = true;

  showLoading();

  try {

    const res = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        session_id: currentSessionId,
        user_id: getUserId()
      })
    });

    const data = await res.json();

    hideLoading();

    addMessage(data.reply, "assistant");

    await loadSessions();

  } catch (err) {

    hideLoading();
    addMessage("Connection error.", "assistant");

  } finally {

    isWaiting = false;
    sendBtn.disabled = false;

  }

}

/* ------------------------------
   LOAD CHAT HISTORY
--------------------------------*/

async function loadChatHistory(sessionId) {

  currentSessionId = sessionId;

  clearChatWindow();

  const res = await fetch(`/history/${sessionId}`);

  const data = await res.json();

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

}

/* ------------------------------
   DELETE CHAT
--------------------------------*/

async function deleteChat(sessionId, event) {

  event.stopPropagation();

  if (!confirm("Delete this chat?")) return;

  const userId = getUserId();

  const res = await fetch(`/delete/${sessionId}?user_id=${userId}`, {
    method: "DELETE"
  });

  if (res.ok) {

    if (sessionId === currentSessionId) {
      createNewChat();
    }

    await loadSessions();

  }

}

/* ------------------------------
   RENAME CHAT (FIXED)
--------------------------------*/

// async function renameChat(sessionId, currentTitle, event) {

//   event.stopPropagation();

//   const newTitle = prompt("Enter new chat title:", currentTitle);

//   if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) return;

//   try {

//     const res = await fetch(`/rename/${sessionId}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         title: newTitle.trim(),
//         user_id: getUserId()
//       })
//     });

//     const data = await res.json();

//     if (data.success) {

//       console.log("✅ Chat renamed");

//       await loadSessions();   // refresh sidebar

//     } else {

//       alert(data.error);

//     }

//   } catch (err) {

//     console.error("Rename error:", err);

//   }

// }


async function renameChat(sessionId, currentTitle, event) {
  event.stopPropagation();

  const newTitle = prompt("Enter new chat title:", currentTitle);

  if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) {
    return;
  }

  console.log("✏️ Renaming session:", sessionId, "to:", newTitle);

  try {
    const res = await fetch(`/rename/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        user_id: getUserId()
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      console.log("✅ Session renamed");

      // 🔥 UPDATE SIDEBAR TITLE IMMEDIATELY
      const chatItems = document.querySelectorAll(".chat-item");

      chatItems.forEach(item => {
        const title = item.querySelector(".chat-title");

        if (item.onclick && item.onclick.toString().includes(sessionId)) {
          title.textContent = newTitle;
        }
      });

      // reload sessions in background
      setTimeout(() => {
        loadSessions();
      }, 300);

    } else {
      alert(data.error || "Failed to rename chat");
    }

  } catch (err) {
    console.error("❌ Rename error:", err);
    alert("Failed to rename chat");
  }
}

/* ------------------------------
   LOAD SIDEBAR SESSIONS
--------------------------------*/

// async function loadSessions() {

//   const userId = getUserId();

//   const res = await fetch(`/sessions?user_id=${userId}`);

//   const data = await res.json();

//   chatList.innerHTML = "";

//   if (!data.sessions || data.sessions.length === 0) {

//     chatList.innerHTML = "<p class='empty-chat'>No chats yet</p>";
//     return;

//   }

//   data.sessions.forEach(session => {

//     const item = document.createElement("div");
//     item.classList.add("chat-item");

//     const titleSpan = document.createElement("span");
//     titleSpan.classList.add("chat-title");

//     titleSpan.textContent = session.preview || "Travel Chat";

//     const buttons = document.createElement("div");
//     buttons.classList.add("chat-buttons");

//     const renameBtn = document.createElement("button");
//     renameBtn.textContent = "Rename";

//     renameBtn.onclick = (e) =>
//       renameChat(session.session_id, session.preview, e);

//     const deleteBtn = document.createElement("button");
//     deleteBtn.textContent = "Delete";

//     deleteBtn.onclick = (e) =>
//       deleteChat(session.session_id, e);

//     buttons.appendChild(renameBtn);
//     buttons.appendChild(deleteBtn);

//     item.appendChild(titleSpan);
//     item.appendChild(buttons);

//     if (session.session_id === currentSessionId) {
//       item.classList.add("active");
//     }

//     item.onclick = () => {
//       loadChatHistory(session.session_id);
//     };

//     chatList.appendChild(item);

//   });

// }




async function loadSessions() {

  const userId = getUserId();

  const res = await fetch(`/sessions?user_id=${userId}`);

  const data = await res.json();

  chatList.innerHTML = "";

  if (!data.sessions || data.sessions.length === 0) {

    chatList.innerHTML = "<p class='empty-chat'>No chats yet</p>";
    return;

  }

  data.sessions.forEach(session => {

    const item = document.createElement("div");
    item.classList.add("chat-item");

    const titleSpan = document.createElement("span");
    titleSpan.classList.add("chat-title");
    titleSpan.textContent = session.preview || "Travel Chat";

    /* ---------- THREE DOT MENU ---------- */

    const menuContainer = document.createElement("div");
    menuContainer.classList.add("chat-menu-container");

    const menuBtn = document.createElement("button");
    menuBtn.classList.add("chat-menu-btn");
    menuBtn.innerHTML = "⋮";

    const dropdown = document.createElement("div");
    dropdown.classList.add("chat-dropdown");

    const renameOption = document.createElement("div");
    renameOption.classList.add("chat-dropdown-item");
    renameOption.textContent = "Rename";
    renameOption.onclick = (e) =>
      renameChat(session.session_id, session.preview, e);

    const deleteOption = document.createElement("div");
    deleteOption.classList.add("chat-dropdown-item", "delete-option");
    deleteOption.textContent = "Delete";
    deleteOption.onclick = (e) =>
      deleteChat(session.session_id, e);

    dropdown.appendChild(renameOption);
    dropdown.appendChild(deleteOption);

    menuBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    };

    menuContainer.appendChild(menuBtn);
    menuContainer.appendChild(dropdown);

    item.appendChild(titleSpan);
    item.appendChild(menuContainer);

    /* ---------- ACTIVE CHAT ---------- */

    if (session.session_id === currentSessionId) {
      item.classList.add("active");
    }

    item.onclick = () => {
      loadChatHistory(session.session_id);
    };

    chatList.appendChild(item);

  });

}

/* ------------------------------
   NEW CHAT
--------------------------------*/

function createNewChat() {

  currentSessionId =
    "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  clearChatWindow();

  addMessage(
    "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
    "assistant"
  );

}

/* ------------------------------
   EVENT LISTENERS
--------------------------------*/

function setupEventListeners() {

  sendBtn.addEventListener("click", sendMessage);

  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  newChatBtn.addEventListener("click", createNewChat);

}

/* ------------------------------
   LOAD USER STATUS (SIDEBAR)
--------------------------------*/

// function loadUserStatus() {

//   const userStatus = document.getElementById("chatUserStatus");

//   if (!userStatus) return;

//   const user = localStorage.getItem("safarUser");

//   if (user) {

//     try {

//       const userData = JSON.parse(user);

//       userStatus.textContent = `Logged in as ${userData.name}`;

//     } catch (err) {

//       console.error("User parse error:", err);
//       userStatus.textContent = "Logged in";

//     }

//   } else {

//     userStatus.textContent = "Not logged in";

//   }

// }

/* ------------------------------
   LOAD USER STATUS (SIDEBAR)
--------------------------------*/

function loadUserStatus() {

  const userStatus = document.getElementById("chatUserStatus");

  if (!userStatus) return;

  const user = localStorage.getItem("safarUser");

  if (user) {

    try {

      const userData = JSON.parse(user);

      // ✅ Clean UI version
      userStatus.innerHTML = `👤 <strong>${userData.name}</strong>`;

    } catch (err) {

      console.error("User parse error:", err);
      userStatus.textContent = "👤 Logged in";

    }

  } else {

    userStatus.textContent = "Not logged in";

  }

}

/* ------------------------------
   LOAD SAVED TRIPS
--------------------------------*/

async function loadSavedTrips() {

  const user = JSON.parse(localStorage.getItem("safarUser"));

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("saved_trips")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = document.getElementById("savedTripsList");

  if (!list) return;

  list.innerHTML = "";

  if (!data || data.length === 0) {

    list.innerHTML = "<p class='empty-chat'>No saved trips</p>";
    return;

  }

  data.forEach(trip => {

    const item = document.createElement("div");
    item.classList.add("saved-trip-item");

    item.textContent = trip.destination;

    item.onclick = () => {
      addMessage(trip.trip_plan, "assistant");
    };

    list.appendChild(item);

  });

}




/* ------------------------------
   INIT
--------------------------------*/

async function initializeSafar() {

  initializeElements();

  setupEventListeners();
  loadUserStatus();
  await loadSessions();
  await loadSavedTrips();

  const firstChat = chatList.querySelector(".chat-item");

  if (firstChat) {
    firstChat.click();
  } else {
    createNewChat();
  }

}

document.addEventListener("DOMContentLoaded", initializeSafar);










