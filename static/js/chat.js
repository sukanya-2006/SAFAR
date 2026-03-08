
/* -----------------------------------------------------------
   SAFAR CHAT UI - MAIN LOGIC
----------------------------------------------------------- */

console.log("✅ chat.js loaded");

// const supabaseClient = window.supabase.createClient(
//   SUPABASE_URL,
//   SUPABASE_ANON_KEY
// );
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

// function extractDestination(text) {

//   const places = [
//     "bali","kyoto","paris","tokyo","sikkim","ladakh","goa","rome","london","dubai"
//   ];

//   text = text.toLowerCase();

//   for (let place of places) {
//     if (text.includes(place)) {
//       return place;
//     }
//   }

//   return null;

// }

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


//LOAD SIDEBAR SESSIONS (FIXED)
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
    .from("saved-trips")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = document.getElementById("savedTripsList");

  if (!list) return;

  list.innerHTML = "";

  // if (!data || data.length === 0) {

  //   list.innerHTML = "<p class='empty-chat'>No saved trips</p>";
  //   return;

  // }

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










