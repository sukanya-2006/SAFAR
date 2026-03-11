
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
   MAP LINK — NEW ADDITION
   Adds a "View on Maps" button below assistant bubble.
   Uses destination text to build a Google Maps search URL.
   No API key needed.
--------------------------------*/

function addMapLink(bubble, destination) {
  const query = encodeURIComponent(destination);
  const mapBtn = document.createElement("a");
  mapBtn.href = `https://www.google.com/maps/search/${query}`;
  mapBtn.target = "_blank";
  mapBtn.rel = "noopener noreferrer";
  mapBtn.className = "map-link-btn";
  mapBtn.innerHTML = "🗺️ View on Maps";
  bubble.appendChild(mapBtn);
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
    "bangkok","singapore","maldives","switzerland","new york","los angeles",
    "barcelona","amsterdam","prague","istanbul","cairo","sydney","melbourne",
    "toronto","vancouver","mexico city","rio de janeiro","buenos aires",
    "cape town","nairobi","bangkok","kuala lumpur","hong kong","seoul","beijing"
  ];

  text = text.toLowerCase();

  for (let place of places) {
    if (text.includes(place)) {
      return place.charAt(0).toUpperCase() + place.slice(1);
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

  if (sender === "assistant" && text.includes("trip-card")) {
    // render HTML directly (no markdown, no images)
    bubble.innerHTML = text;

  } else if (sender === "assistant") {
    const destination = extractDestination(text);

    if (destination) {
      fetchDestinationImages(destination).then(images => {
        if (images.length > 0) {
          const gallery = createImageGallery(images);
          bubble.appendChild(gallery);
        }
        bubble.innerHTML += markdownToHtml(text);

        // ✅ NEW: Add map link after text is rendered
        addMapLink(bubble, destination);
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
    isWaiting = false;
    sendBtn.disabled = false;
    userInput.focus();
    loadSessions().catch(err => console.warn("Sidebar refresh failed:", err));
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
    const content = msg.content;

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

  // ✅ Safety Rating Badge
  if (trip.safety_rating !== undefined) {
    const rating = trip.safety_rating;
    let badgeColor = "#16a34a"; // green — safe
    let badgeLabel = "Safe";
    if (rating <= 4) { badgeColor = "#dc2626"; badgeLabel = "High Risk"; }
    else if (rating <= 6) { badgeColor = "#d97706"; badgeLabel = "Moderate Caution"; }
    else if (rating <= 8) { badgeColor = "#2563eb"; badgeLabel = "Generally Safe"; }

    html += `
      <div class="safety-block">
        <div class="safety-header">
          🛡️ <b>Safety Rating:</b>
          <span class="safety-badge" style="background:${badgeColor}">
            ${rating}/10 — ${badgeLabel}
          </span>
        </div>
        ${trip.safety_info ? `<p class="safety-info">${trip.safety_info}</p>` : ""}
      </div>
    `;
  }

  // ✅ Embedded Google Map iframe
  const mapQuery = encodeURIComponent(trip.destination);
  html += `
    <div class="trip-map-container">
      <iframe
        class="trip-map-iframe"
        src="https://maps.google.com/maps?q=${mapQuery}&output=embed"
        allowfullscreen
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade">
      </iframe>
    </div>
  `;

  // ✅ UPDATED: Build directions URL with all activities as waypoints
  // Each activity is appended with the destination name for accurate Maps results.
  // Sliced to 10 to stay within Google Maps waypoint limits.
  const allActivities = trip.days.flatMap(day => day.activities).slice(0, 10);
  const waypoints = allActivities
    .map(a => encodeURIComponent(a + " " + trip.destination))
    .join("/");
  const directionsUrl = `https://www.google.com/maps/dir/${waypoints}`;

  html += `
    <a href="${directionsUrl}"
       target="_blank"
       rel="noopener noreferrer"
       class="map-link-btn">
      🗺️ View Full Route on Maps
    </a>
  `;

  html += `
    <button class="download-pdf-btn">
      📄 Download Travel PDF
    </button>
  `;

  // ✅ SOS Emergency Button
  html += `
    <button class="sos-btn" onclick="triggerSOS('${trip.destination}')">
      🆘 SOS Emergency
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
   SOS EMERGENCY
   Gets user's live GPS location and opens:
   - Nearby hospitals on Google Maps
   - Nearby police stations on Google Maps
   Also shows the local emergency number for the destination country.
--------------------------------*/

const EMERGENCY_NUMBERS = {
  // Asia
  "india": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "dubai": { police: "999", ambulance: "998", fire: "997", women: "800SAFE", women_label: "Safe (Domestic Violence)" },
  "uae": { police: "999", ambulance: "998", fire: "997", women: "800SAFE", women_label: "Safe (Domestic Violence)" },
  "japan": { police: "110", ambulance: "119", fire: "119", women: "0120-279-889", women_label: "Women's Consultation" },
  "tokyo": { police: "110", ambulance: "119", fire: "119", women: "0120-279-889", women_label: "Women's Consultation" },
  "kyoto": { police: "110", ambulance: "119", fire: "119", women: "0120-279-889", women_label: "Women's Consultation" },
  "thailand": { police: "191", ambulance: "1554", fire: "199", women: "1300", women_label: "Women & Children Helpline" },
  "bangkok": { police: "191", ambulance: "1554", fire: "199", women: "1300", women_label: "Women & Children Helpline" },
  "singapore": { police: "999", ambulance: "995", fire: "995", women: "1800-777-0000", women_label: "SafeSpace Helpline" },
  "bali": { police: "110", ambulance: "118", fire: "113", women: "119", women_label: "Crisis Center" },
  "indonesia": { police: "110", ambulance: "118", fire: "113", women: "119", women_label: "Crisis Center" },
  "china": { police: "110", ambulance: "120", fire: "119", women: "12338", women_label: "Women's Rights Hotline" },
  "beijing": { police: "110", ambulance: "120", fire: "119", women: "12338", women_label: "Women's Rights Hotline" },
  "hong kong": { police: "999", ambulance: "999", fire: "999", women: "23820000", women_label: "Against Domestic Violence" },
  "south korea": { police: "112", ambulance: "119", fire: "119", women: "1366", women_label: "Women's Hotline" },
  "seoul": { police: "112", ambulance: "119", fire: "119", women: "1366", women_label: "Women's Hotline" },
  "malaysia": { police: "999", ambulance: "999", fire: "994", women: "15999", women_label: "Talian Kasih Helpline" },
  "kuala lumpur": { police: "999", ambulance: "999", fire: "994", women: "15999", women_label: "Talian Kasih Helpline" },
  "maldives": { police: "119", ambulance: "102", fire: "118", women: "1412", women_label: "Gender Based Violence" },
  // Europe
  "france": { police: "17", ambulance: "15", fire: "18", women: "3919", women_label: "Violence Against Women" },
  "paris": { police: "17", ambulance: "15", fire: "18", women: "3919", women_label: "Violence Against Women" },
  "italy": { police: "113", ambulance: "118", fire: "115", women: "1522", women_label: "Anti-Violence Helpline" },
  "rome": { police: "113", ambulance: "118", fire: "115", women: "1522", women_label: "Anti-Violence Helpline" },
  "spain": { police: "091", ambulance: "112", fire: "080", women: "016", women_label: "Violence Against Women" },
  "barcelona": { police: "091", ambulance: "112", fire: "080", women: "016", women_label: "Violence Against Women" },
  "uk": { police: "999", ambulance: "999", fire: "999", women: "0808-2000-247", women_label: "National Domestic Abuse" },
  "london": { police: "999", ambulance: "999", fire: "999", women: "0808-2000-247", women_label: "National Domestic Abuse" },
  "germany": { police: "110", ambulance: "112", fire: "112", women: "08000-116016", women_label: "Women's Helpline" },
  "netherlands": { police: "112", ambulance: "112", fire: "112", women: "0800-2000", women_label: "Safe Home Helpline" },
  "amsterdam": { police: "112", ambulance: "112", fire: "112", women: "0800-2000", women_label: "Safe Home Helpline" },
  "switzerland": { police: "117", ambulance: "144", fire: "118", women: "0800-800-041", women_label: "Domestic Violence Help" },
  "czech republic": { police: "158", ambulance: "155", fire: "150", women: "116006", women_label: "Victim Support Line" },
  "prague": { police: "158", ambulance: "155", fire: "150", women: "116006", women_label: "Victim Support Line" },
  "turkey": { police: "155", ambulance: "112", fire: "110", women: "183", women_label: "Women's Helpline" },
  "istanbul": { police: "155", ambulance: "112", fire: "110", women: "183", women_label: "Women's Helpline" },
  // Americas
  "usa": { police: "911", ambulance: "911", fire: "911", women: "1-800-799-7233", women_label: "National DV Hotline" },
  "new york": { police: "911", ambulance: "911", fire: "911", women: "1-800-799-7233", women_label: "National DV Hotline" },
  "los angeles": { police: "911", ambulance: "911", fire: "911", women: "1-800-799-7233", women_label: "National DV Hotline" },
  "canada": { police: "911", ambulance: "911", fire: "911", women: "1-800-363-9010", women_label: "Assaulted Women's Helpline" },
  "toronto": { police: "911", ambulance: "911", fire: "911", women: "1-800-363-9010", women_label: "Assaulted Women's Helpline" },
  "vancouver": { police: "911", ambulance: "911", fire: "911", women: "1-800-363-9010", women_label: "Assaulted Women's Helpline" },
  "mexico": { police: "911", ambulance: "911", fire: "911", women: "800-290-0024", women_label: "Violence Against Women" },
  "mexico city": { police: "911", ambulance: "911", fire: "911", women: "800-290-0024", women_label: "Violence Against Women" },
  "brazil": { police: "190", ambulance: "192", fire: "193", women: "180", women_label: "Women's Helpline" },
  "rio de janeiro": { police: "190", ambulance: "192", fire: "193", women: "180", women_label: "Women's Helpline" },
  "argentina": { police: "101", ambulance: "107", fire: "100", women: "144", women_label: "Gender Violence Helpline" },
  "buenos aires": { police: "101", ambulance: "107", fire: "100", women: "144", women_label: "Gender Violence Helpline" },
  // Africa / Middle East
  "egypt": { police: "122", ambulance: "123", fire: "180", women: "16000", women_label: "National Council for Women" },
  "cairo": { police: "122", ambulance: "123", fire: "180", women: "16000", women_label: "National Council for Women" },
  "south africa": { police: "10111", ambulance: "10177", fire: "10177", women: "0800-428-428", women_label: "GBV Command Centre" },
  "cape town": { police: "10111", ambulance: "10177", fire: "10177", women: "0800-428-428", women_label: "GBV Command Centre" },
  "kenya": { police: "999", ambulance: "999", fire: "999", women: "0800-723-253", women_label: "GBV Hotline" },
  "nairobi": { police: "999", ambulance: "999", fire: "999", women: "0800-723-253", women_label: "GBV Hotline" },
  // Oceania
  "australia": { police: "000", ambulance: "000", fire: "000", women: "1800-737-732", women_label: "1800RESPECT Helpline" },
  "sydney": { police: "000", ambulance: "000", fire: "000", women: "1800-737-732", women_label: "1800RESPECT Helpline" },
  "melbourne": { police: "000", ambulance: "000", fire: "000", women: "1800-737-732", women_label: "1800RESPECT Helpline" },
  // India cities
  "goa": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "jaipur": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "mumbai": { police: "100", ambulance: "102", fire: "101", women: "103", women_label: "Mumbai Women Helpline" },
  "delhi": { police: "100", ambulance: "102", fire: "101", women: "181", women_label: "Delhi Women Helpline" },
  "kolkata": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "udaipur": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "manali": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "shimla": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "ladakh": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
  "sikkim": { police: "100", ambulance: "102", fire: "101", women: "1091", women_label: "Women Helpline" },
};

function triggerSOS(destination) {
  const key = destination.toLowerCase();
  const numbers = EMERGENCY_NUMBERS[key] || { police: "112", ambulance: "112", fire: "112" };

  // Show SOS panel immediately with emergency + women's safety numbers
  const sosPanel = document.createElement("div");
  sosPanel.className = "sos-panel";
  sosPanel.innerHTML = `
    <div class="sos-panel-header">🆘 Emergency — ${destination}</div>

    <div class="sos-section-label">🚨 General Emergency</div>
    <div class="sos-numbers">
      <div class="sos-number-item">🚔 <b>Police:</b> <a href="tel:${numbers.police}">${numbers.police}</a></div>
      <div class="sos-number-item">🚑 <b>Ambulance:</b> <a href="tel:${numbers.ambulance}">${numbers.ambulance}</a></div>
      <div class="sos-number-item">🚒 <b>Fire:</b> <a href="tel:${numbers.fire}">${numbers.fire}</a></div>
    </div>

    <div class="sos-section-label">👩 Women's Safety</div>
    <div class="sos-numbers women-numbers">
      <div class="sos-number-item">🆘 <b>${numbers.women_label}:</b> <a href="tel:${numbers.women}">${numbers.women}</a></div>
      <div class="sos-women-tips">
        <div class="sos-tip">📍 Share your live location with a trusted contact</div>
        <div class="sos-tip">🏃 Move to a crowded public place if feeling unsafe</div>
        <div class="sos-tip">📸 Document and report any harassment to local police</div>
      </div>
    </div>

    <div class="sos-locating" id="sosLocating">📍 Getting your location...</div>
    <div class="sos-map-btns" id="sosMapBtns" style="display:none;">
      <a id="sosHospitalBtn" href="#" target="_blank" class="sos-map-link hospital">🏥 Hospitals</a>
      <a id="sosPoliceBtn" href="#" target="_blank" class="sos-map-link police">🚔 Police</a>
      <a id="sosShelterBtn" href="#" target="_blank" class="sos-map-link shelter">🏠 Shelters</a>
    </div>
    <button class="sos-close-btn" onclick="this.parentElement.remove()">✕ Close</button>
  `;

  chatWindow.appendChild(sosPanel);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Get live GPS location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        document.getElementById("sosLocating").textContent = "✅ Location found! Tap below to open maps:";
        document.getElementById("sosHospitalBtn").href = `https://www.google.com/maps/search/hospitals/@${lat},${lng},15z`;
        document.getElementById("sosPoliceBtn").href = `https://www.google.com/maps/search/police+stations/@${lat},${lng},15z`;
        document.getElementById("sosShelterBtn").href = `https://www.google.com/maps/search/women+shelter+safe+house/@${lat},${lng},15z`;
        document.getElementById("sosMapBtns").style.display = "flex";
      },
      (err) => {
        // Fallback: destination-based search if GPS denied
        const dest = encodeURIComponent(destination);
        document.getElementById("sosLocating").textContent = "📍 Showing results for " + destination + ":";
        document.getElementById("sosHospitalBtn").href = `https://www.google.com/maps/search/hospitals+in+${dest}`;
        document.getElementById("sosPoliceBtn").href = `https://www.google.com/maps/search/police+stations+in+${dest}`;
        document.getElementById("sosShelterBtn").href = `https://www.google.com/maps/search/women+shelter+in+${dest}`;
        document.getElementById("sosMapBtns").style.display = "flex";
      },
      { timeout: 8000 }
    );
  } else {
    // Browser doesn't support geolocation
    const dest = encodeURIComponent(destination);
    document.getElementById("sosLocating").textContent = "📍 Showing results for " + destination + ":";
    document.getElementById("sosHospitalBtn").href = `https://www.google.com/maps/search/hospitals+in+${dest}`;
    document.getElementById("sosPoliceBtn").href = `https://www.google.com/maps/search/police+stations+in+${dest}`;
    document.getElementById("sosShelterBtn").href = `https://www.google.com/maps/search/women+shelter+in+${dest}`;
    document.getElementById("sosMapBtns").style.display = "flex";
  }
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