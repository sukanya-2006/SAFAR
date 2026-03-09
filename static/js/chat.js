
// /* -----------------------------------------------------------
//    SAFAR CHAT UI - MAIN LOGIC
// ----------------------------------------------------------- */

// console.log("✅ chat.js loaded");

// // const supabaseClient = window.supabase.createClient(
// //   SUPABASE_URL,
// //   SUPABASE_ANON_KEY
// // );
// const UNSPLASH_ACCESS_KEY = CONFIG.UNSPLASH_ACCESS_KEY;

// const safarUser = localStorage.getItem("safarUser");

// if (!safarUser) {
//   alert("Please login to use Safar ✈️");
//   window.location.href = "/";
// }

// let chatWindow, userInput, sendBtn, chatList, newChatBtn;
// let currentSessionId = null;
// let isWaiting = false;

// /* ------------------------------
//    USER ID
// --------------------------------*/

// function getUserId() {
//   const user = JSON.parse(localStorage.getItem("safarUser"));
//   return user ? user.id : null;
// }

// /* ------------------------------
//    INIT ELEMENTS
// --------------------------------*/

// function initializeElements() {
//   chatWindow = document.getElementById("chatWindow");
//   userInput = document.getElementById("userInput");
//   sendBtn = document.getElementById("sendBtn");
//   chatList = document.getElementById("chatList");
//   newChatBtn = document.getElementById("newChatBtn");

//   return true;
// }

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
//    SAVE TRIP
// --------------------------------*/

// async function saveTrip(tripText) {

//   const user = JSON.parse(localStorage.getItem("safarUser"));

//   if (!user) {
//     alert("Please login first");
//     return;
//   }

//   const destination = extractDestination(tripText) || "Trip Plan";

//   const { data, error } = await supabaseClient
//     .from("saved-trips")
//     .insert([
//       {
//         user_id: user.id,
//         destination: destination,
//         trip_plan: tripText
//       }
//     ]);

//   if (error) {
//     console.error(error);
//     alert("Failed to save trip");
//     return;
//   }

//   alert("Trip saved successfully ✈️");

//   loadSavedTrips();

// }


// /* ------------------------------
//    DESTINATION IMAGE FETCH
// --------------------------------*/

// async function fetchDestinationImages(destination) {

//   try {

//     const url = `https://api.unsplash.com/search/photos?query=${destination}&per_page=3&client_id=${UNSPLASH_ACCESS_KEY}`;

//     const res = await fetch(url);
//     const data = await res.json();

//     if (!data.results) return [];

//     return data.results.map(img => img.urls.small);

//   } catch (error) {

//     console.error("Unsplash API error:", error);
//     return [];

//   }

// }

// function createImageGallery(images) {

//   const gallery = document.createElement("div");
//   gallery.className = "destination-gallery";

//   images.forEach(src => {

//     const img = document.createElement("img");
//     img.src = src;
//     img.className = "destination-img";

//     gallery.appendChild(img);

//   });

//   return gallery;

// }

// // function extractDestination(text) {

// //   const places = [
// //     "bali","kyoto","paris","tokyo","sikkim","ladakh","goa","rome","london","dubai"
// //   ];

// //   text = text.toLowerCase();

// //   for (let place of places) {
// //     if (text.includes(place)) {
// //       return place;
// //     }
// //   }

// //   return null;

// // }

// function extractDestination(text) {

//   const places = [
//     "bali","kyoto","paris","tokyo","sikkim","ladakh","goa","rome","london","dubai",
//     "mumbai","delhi","kolkata","jaipur","udaipur","manali","shimla",
//     "bangkok","singapore","maldives","switzerland"
//   ];

//   text = text.toLowerCase();

//   for (let place of places) {
//     if (text.includes(place)) {
//       return place.charAt(0).toUpperCase() + place.slice(1);
//     }
//   }

//   return "Trip Plan";
// }


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

//   /* ⭐ IMPORTANT FIX */

//   if (sender === "assistant" && text.includes("trip-card")) {

//     // render HTML directly (no markdown, no images)
//     bubble.innerHTML = text;

//   } else if (sender === "assistant") {

//     const destination = extractDestination(text);

//     if (destination && destination !== "Trip Plan") {

//       fetchDestinationImages(destination).then(images => {

//         if (images.length > 0) {
//           const gallery = createImageGallery(images);
//           bubble.appendChild(gallery);
//         }

//         bubble.innerHTML += markdownToHtml(text);

//       });

//     } else {

//       bubble.innerHTML = markdownToHtml(text);

//     }

//   } else {

//     bubble.innerHTML = text;

//   }

//   messageDiv.appendChild(bubble);

//   chatWindow.appendChild(messageDiv);

//   scrollToBottom();
// }


// /* ------------------------------
//    LOADING
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
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         message: text,
//         session_id: currentSessionId,
//         user_id: getUserId()
//       })
//     });
//     const data = await res.json();

//     hideLoading();

//    if (data.trip_data) {
//     renderTripPlan(data.trip_data);
//   } else {
//   addMessage(data.reply, "assistant");
//    }

//    await loadSessions();

//   } catch (err) {

//     hideLoading();
//     addMessage("Connection error.", "assistant");

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
//       "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//       "assistant"
//     );

//     return;
//   }

//   data.history.forEach(msg => {
//     addMessage(msg.content, msg.role);
//   });

// }

// /* ------------------------------
//    DELETE CHAT
// --------------------------------*/

// async function deleteChat(sessionId, event) {

//   event.stopPropagation();

//   if (!confirm("Delete this chat?")) return;

//   const userId = getUserId();

//   const res = await fetch(`/delete/${sessionId}?user_id=${userId}`, {
//     method: "DELETE"
//   });

//   if (res.ok) {

//     if (sessionId === currentSessionId) {
//       createNewChat();
//     }

//     await loadSessions();

//   }

// }

// /* ------------------------------
//    RENAME CHAT (FIXED)
// --------------------------------*/

// async function renameChat(sessionId, currentTitle, event) {
//   event.stopPropagation();

//   const newTitle = prompt("Enter new chat title:", currentTitle);

//   if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) {
//     return;
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

//       // 🔥 UPDATE SIDEBAR TITLE IMMEDIATELY
//       const chatItems = document.querySelectorAll(".chat-item");

//       chatItems.forEach(item => {
//         const title = item.querySelector(".chat-title");

//         if (item.onclick && item.onclick.toString().includes(sessionId)) {
//           title.textContent = newTitle;
//         }
//       });

//       // reload sessions in background
//       setTimeout(() => {
//         loadSessions();
//       }, 300);

//     } else {
//       alert(data.error || "Failed to rename chat");
//     }

//   } catch (err) {
//     console.error("❌ Rename error:", err);
//     alert("Failed to rename chat");
//   }
// }


// //LOAD SIDEBAR SESSIONS (FIXED)
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

//     /* ---------- THREE DOT MENU ---------- */

//     const menuContainer = document.createElement("div");
//     menuContainer.classList.add("chat-menu-container");

//     const menuBtn = document.createElement("button");
//     menuBtn.classList.add("chat-menu-btn");
//     menuBtn.innerHTML = "⋮";

//     const dropdown = document.createElement("div");
//     dropdown.classList.add("chat-dropdown");

//     const renameOption = document.createElement("div");
//     renameOption.classList.add("chat-dropdown-item");
//     renameOption.textContent = "Rename";
//     renameOption.onclick = (e) =>
//       renameChat(session.session_id, session.preview, e);

//     const deleteOption = document.createElement("div");
//     deleteOption.classList.add("chat-dropdown-item", "delete-option");
//     deleteOption.textContent = "Delete";
//     deleteOption.onclick = (e) =>
//       deleteChat(session.session_id, e);

//     dropdown.appendChild(renameOption);
//     dropdown.appendChild(deleteOption);

//     menuBtn.onclick = (e) => {
//       e.stopPropagation();
//       dropdown.classList.toggle("show");
//     };

//     menuContainer.appendChild(menuBtn);
//     menuContainer.appendChild(dropdown);

//     item.appendChild(titleSpan);
//     item.appendChild(menuContainer);

//     /* ---------- ACTIVE CHAT ---------- */

//     if (session.session_id === currentSessionId) {
//       item.classList.add("active");
//     }

//     item.onclick = () => {
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
//     "Hi, I'm Safar 👋 Tell me your destination, budget, and travel dates.",
//     "assistant"
//   );

// }

// /* ------------------------------
//    EVENT LISTENERS
// --------------------------------*/

// function setupEventListeners() {

//   sendBtn.addEventListener("click", sendMessage);

//   userInput.addEventListener("keypress", (e) => {
//     if (e.key === "Enter") sendMessage();
//   });

//   newChatBtn.addEventListener("click", createNewChat);

// }

// /* ------------------------------
//    LOAD USER STATUS (SIDEBAR)
// --------------------------------*/

// function loadUserStatus() {

//   const userStatus = document.getElementById("chatUserStatus");

//   if (!userStatus) return;

//   const user = localStorage.getItem("safarUser");

//   if (user) {

//     try {

//       const userData = JSON.parse(user);

//       // ✅ Clean UI version
//       userStatus.innerHTML = `👤 <strong>${userData.name}</strong>`;

//     } catch (err) {

//       console.error("User parse error:", err);
//       userStatus.textContent = "👤 Logged in";

//     }

//   } else {

//     userStatus.textContent = "Not logged in";

//   }

// }

// /* ------------------------------
//    LOAD SAVED TRIPS
// --------------------------------*/

// async function loadSavedTrips() {

//   const user = JSON.parse(localStorage.getItem("safarUser"));

//   if (!user) return;

//   const { data, error } = await supabaseClient
//     .from("saved-trips")
//     .select("*")
//     .eq("user_id", user.id)
//     .order("created_at", { ascending: false });

//   const list = document.getElementById("savedTripsList");

//   if (!list) return;

//   list.innerHTML = "";


//   if (error) {
//   console.error("Failed to load trips:", error);
//   list.innerHTML = "<p class='empty-chat'>Failed to load trips</p>";
//   return;
// }

// if (!data || data.length === 0) {
//   list.innerHTML = "<p class='empty-chat'>No saved trips</p>";
//   return;
// }
//   data.forEach(trip => {

//     const item = document.createElement("div");
//     item.classList.add("saved-trip-item");
//     item.textContent = "📍 " + trip.destination;

//     item.onclick = () => {
//       addMessage(trip.trip_plan, "assistant");
//     };

//     list.appendChild(item);

//   });

// }


// function renderTripPlan(trip) {

//   let html = `
//   <div class="trip-card">

//   <h3>📍 ${trip.destination}</h3>

//   <p><b>Duration:</b> ${trip.duration_days} days</p>
//   <p><b>Best season:</b> ${trip.best_season}</p>

//   `;

//   trip.days.forEach(day => {

//     html += `<h4>Day ${day.day}</h4><ul>`;

//     day.activities.forEach(activity => {
//       html += `<li>${activity}</li>`;
//     });

//     html += `</ul>`;

//   });

//   html += `<h4>🍜 Food</h4><ul>`;

//   trip.food_recommendations.forEach(food => {
//     html += `<li>${food}</li>`;
//   });

//   html += `</ul>`;

//   html += `<p><b>💰 Budget:</b> ${trip.estimated_budget}</p>`;

//   html += `
//     <button class="download-pdf-btn">
//       📄 Download Travel PDF
//     </button>
//   `;

//   html += `</div>`;

//   addMessage(html, "assistant");

// //   setTimeout(() => {

// //     const btn = document.querySelector(".download-pdf-btn");

// //     if (btn) {
// //       btn.onclick = () => generatePDF(trip);
// //     }

// //   }, 100);

// // }
//      setTimeout(() => {

//   // const buttons = document.querySelectorAll(".download-pdf-btn");
//   // const btn = buttons[buttons.length - 1]; // last button
//   const btn = chatWindow.querySelector(".download-pdf-btn:last-of-type");

//   if (btn) {
//     btn.onclick = () => generatePDF(trip);
//   }

// }, 100);
// }

// function generatePDF(trip) {

//   const { jsPDF } = window.jspdf;

//   const doc = new jsPDF();

//   let y = 20;
//   function checkPageBreak() {
//   if (y > 270) {
//     doc.addPage();
//     y = 20;
//   }
// }

//   doc.setFontSize(18);
//   doc.text("SAFAR AI Travel Guide", 20, y);

//   y += 10;
//   checkPageBreak();

//   doc.setFontSize(12);

//   doc.text(`Destination: ${trip.destination}`, 20, y);
//   y += 8;
//   checkPageBreak();

//   doc.text(`Duration: ${trip.duration_days} Days`, 20, y);
//   y += 8;
//   checkPageBreak();

//   doc.text(`Best Season: ${trip.best_season}`, 20, y);
//   y += 10;
//   checkPageBreak();

//   trip.days.forEach(day => {

//     doc.text(`Day ${day.day}`, 20, y);
//     y += 6;
//     checkPageBreak();

//     day.activities.forEach(act => {
//       doc.text(`• ${act}`, 25, y);
//       y += 6;
//       checkPageBreak();
//     });

//     y += 4;
//   });

//   doc.text("Food Recommendations:", 20, y);
//   y += 6;
//   checkPageBreak();

//   trip.food_recommendations.forEach(food => {
//     doc.text(`• ${food}`, 25, y);
//     y += 6;
//     checkPageBreak();
//   });

//   y += 4;
//   checkPageBreak();

//   doc.text("Transport Tips:", 20, y);
//   y += 6;
//   checkPageBreak();

//   trip.transport_tips.forEach(tip => {
//     doc.text(`• ${tip}`, 25, y);
//     y += 6;
//     checkPageBreak();
//   });

//   y += 4;
//   checkPageBreak();

//   doc.text("Safety Tips:", 20, y);
//   y += 6;
//   checkPageBreak();

//   trip.safety_tips.forEach(tip => {
//     doc.text(`• ${tip}`, 25, y);
//     y += 6;
//     checkPageBreak();
//   });

//   y += 4;
//   checkPageBreak();

//   doc.text("Packing List:", 20, y);
//   y += 6;
//   checkPageBreak();

//   trip.packing_list.forEach(item => {
//     doc.text(`• ${item}`, 25, y);
//     y += 6;
//     checkPageBreak();
//   });

//   y += 8;
//   checkPageBreak();

//   // doc.text(`Estimated Budget: ${trip.estimated_budget}`, 20, y);
//   doc.text(`Estimated Budget: ${trip.estimated_budget.replace(/[^\x00-\x7F]/g, "")}`, 20, y);

//   doc.save(`${trip.destination}_travel_plan.pdf`);
// }

// /* ------------------------------
//    INIT
// --------------------------------*/

// async function initializeSafar() {

//   initializeElements();

//   setupEventListeners();
//   loadUserStatus();
//   await loadSessions();
//   await loadSavedTrips();

//   const firstChat = chatList.querySelector(".chat-item");

//   if (firstChat) {
//     firstChat.click();
//   } else {
//     createNewChat();
//   }

// }

// document.addEventListener("DOMContentLoaded", initializeSafar);

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
    .from("saved-trips")
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
    "bali","kyoto","paris","tokyo","sikkim","ladakh","goa","rome","london","dubai",
    "mumbai","delhi","kolkata","jaipur","udaipur","manali","shimla",
    "bangkok","singapore","maldives","switzerland"
  ];

  text = text.toLowerCase();

  for (let place of places) {
    if (text.includes(place)) {
      return place.charAt(0).toUpperCase() + place.slice(1);
    }
  }

  return "Trip Plan";
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

  if (sender === "assistant" && text.includes("trip-card")) {
    // render HTML directly (no markdown, no images)
    bubble.innerHTML = text;

  } else if (sender === "assistant") {
    const destination = extractDestination(text);

    if (destination && destination !== "Trip Plan") {
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
   ✅ FIX: Re-enable send button RIGHT AFTER AI responds.
   Session sidebar refresh happens in background (non-blocking).
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: currentSessionId,
        user_id: getUserId()
      })
    });

    const data = await res.json();
    hideLoading();

    if (data.trip_data) {
      renderTripPlan(data.trip_data);
    } else {
      addMessage(data.reply, "assistant");
    }

  } catch (err) {
    hideLoading();
    addMessage("Connection error. Please try again! 🌍", "assistant");

  } finally {
    // ✅ FIX: Re-enable send button immediately — don't wait for sidebar
    isWaiting = false;
    sendBtn.disabled = false;
    userInput.focus();

    // ✅ Refresh sidebar quietly in background (user doesn't have to wait)
    loadSessions().catch(err => console.warn("Sidebar refresh failed:", err));
  }
}

/* ------------------------------
   LOAD CHAT HISTORY
   ✅ FIX: Detect [TRIP_DATA] marker and render as trip card
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
    const content = msg.content;

    // ✅ FIX: If this is a saved trip card, re-render it properly
    if (msg.role === "assistant" && content.startsWith("[TRIP_DATA]")) {
      try {
        const tripJson = content.replace("[TRIP_DATA]", "");
        const tripData = JSON.parse(tripJson);
        renderTripPlan(tripData);
      } catch (e) {
        console.error("Failed to parse saved trip data:", e);
        addMessage("(Trip plan unavailable)", "assistant");
      }
    } else {
      addMessage(content, msg.role);
    }
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
   RENAME CHAT
--------------------------------*/

async function renameChat(sessionId, currentTitle, event) {
  event.stopPropagation();

  const newTitle = prompt("Enter new chat title:", currentTitle);

  if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) {
    return;
  }

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
      // Update sidebar title immediately without full reload
      const chatItems = document.querySelectorAll(".chat-item");
      chatItems.forEach(item => {
        const title = item.querySelector(".chat-title");
        if (item.onclick && item.onclick.toString().includes(sessionId)) {
          title.textContent = newTitle;
        }
      });

      setTimeout(() => loadSessions(), 300);
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

function loadUserStatus() {
  const userStatus = document.getElementById("chatUserStatus");
  if (!userStatus) return;

  const user = localStorage.getItem("safarUser");

  if (user) {
    try {
      const userData = JSON.parse(user);
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
    .from("saved-trips")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = document.getElementById("savedTripsList");
  if (!list) return;

  list.innerHTML = "";

  if (error) {
    console.error("Failed to load trips:", error);
    list.innerHTML = "<p class='empty-chat'>Failed to load trips</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p class='empty-chat'>No saved trips</p>";
    return;
  }

  data.forEach(trip => {
    const item = document.createElement("div");
    item.classList.add("saved-trip-item");
    item.textContent = "📍 " + trip.destination;

    item.onclick = () => {
      addMessage(trip.trip_plan, "assistant");
    };

    list.appendChild(item);
  });
}


/* ------------------------------
   RENDER TRIP PLAN
--------------------------------*/

function renderTripPlan(trip) {
  let html = `
  <div class="trip-card">
  <h3>📍 ${trip.destination}</h3>
  <p><b>Duration:</b> ${trip.duration_days} days</p>
  <p><b>Best season:</b> ${trip.best_season}</p>
  `;

  trip.days.forEach(day => {
    html += `<h4>Day ${day.day}</h4><ul>`;
    day.activities.forEach(activity => {
      html += `<li>${activity}</li>`;
    });
    html += `</ul>`;
  });

  html += `<h4>🍜 Food</h4><ul>`;
  trip.food_recommendations.forEach(food => {
    html += `<li>${food}</li>`;
  });
  html += `</ul>`;

  html += `<p><b>💰 Budget:</b> ${trip.estimated_budget}</p>`;

  html += `
    <button class="download-pdf-btn">
      📄 Download Travel PDF
    </button>
  `;

  html += `</div>`;

  addMessage(html, "assistant");

  setTimeout(() => {
    const btn = chatWindow.querySelector(".download-pdf-btn:last-of-type");
    if (btn) {
      btn.onclick = () => generatePDF(trip);
    }
  }, 100);
}

/* ------------------------------
   GENERATE PDF
--------------------------------*/

function generatePDF(trip) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;

  function checkPageBreak() {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  doc.setFontSize(18);
  doc.text("SAFAR AI Travel Guide", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Destination: ${trip.destination}`, 20, y); y += 8; checkPageBreak();
  doc.text(`Duration: ${trip.duration_days} Days`, 20, y); y += 8; checkPageBreak();
  doc.text(`Best Season: ${trip.best_season}`, 20, y); y += 10; checkPageBreak();

  trip.days.forEach(day => {
    doc.text(`Day ${day.day}`, 20, y); y += 6; checkPageBreak();
    day.activities.forEach(act => {
      doc.text(`• ${act}`, 25, y); y += 6; checkPageBreak();
    });
    y += 4;
  });

  doc.text("Food Recommendations:", 20, y); y += 6; checkPageBreak();
  trip.food_recommendations.forEach(food => {
    doc.text(`• ${food}`, 25, y); y += 6; checkPageBreak();
  });
  y += 4; checkPageBreak();

  doc.text("Transport Tips:", 20, y); y += 6; checkPageBreak();
  trip.transport_tips.forEach(tip => {
    doc.text(`• ${tip}`, 25, y); y += 6; checkPageBreak();
  });
  y += 4; checkPageBreak();

  doc.text("Safety Tips:", 20, y); y += 6; checkPageBreak();
  trip.safety_tips.forEach(tip => {
    doc.text(`• ${tip}`, 25, y); y += 6; checkPageBreak();
  });
  y += 4; checkPageBreak();

  doc.text("Packing List:", 20, y); y += 6; checkPageBreak();
  trip.packing_list.forEach(item => {
    doc.text(`• ${item}`, 25, y); y += 6; checkPageBreak();
  });
  y += 8; checkPageBreak();

  doc.text(`Estimated Budget: ${trip.estimated_budget.replace(/[^\x00-\x7F]/g, "")}`, 20, y);

  doc.save(`${trip.destination}_travel_plan.pdf`);
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








