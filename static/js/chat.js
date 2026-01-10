// console.log("chat.js loaded");

// const chatWindow = document.getElementById("chatWindow");
// const userInput = document.getElementById("userInput");
// const sendBtn = document.getElementById("sendBtn");

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

//   const messageText = document.createElement("p");
//   messageText.innerText = text;

//   bubble.appendChild(messageText);
//   messageDiv.appendChild(bubble);
//   chatWindow.appendChild(messageDiv);
//   chatWindow.scrollTop = chatWindow.scrollHeight;
// }

// function sendMessage() {
//   const text = userInput.value.trim();
//   if (text === "") return;

//   addMessage(text, "user");
//   userInput.value = "";

//   setTimeout(() => {
//     addMessage(
//       "I’m Safar ✈️ Tell me your destination, budget, and travel dates.",
//       "assistant"
//     );
//   }, 600);
// }

// sendBtn.addEventListener("click", sendMessage);

// userInput.addEventListener("keypress", (e) => {
//   if (e.key === "Enter") sendMessage();
// });


console.log("chat.js loaded");

const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  // Safar avatar
  if (sender === "assistant") {
    const avatar = document.createElement("img");
    avatar.src = "/static/assets/safar.png";
    avatar.classList.add("avatar");
    messageDiv.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  const p = document.createElement("p");
  p.innerText = text;

  bubble.appendChild(p);
  messageDiv.appendChild(bubble);

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  setTimeout(() => {
    addMessage(
      "I’m Safar ✈️ Tell me your destination, budget, and travel dates.",
      "assistant"
    );
  }, 600);
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
