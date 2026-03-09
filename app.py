
from flask import Flask, render_template, request, jsonify
# from huggingface_hub import InferenceClient
from groq import Groq
from supabase import create_client
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

# ----------------------------------
# LOAD ENVIRONMENT VARIABLES
# ----------------------------------
# load_dotenv()

# app = Flask(__name__)

# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# print("DEBUG KEY:", GROQ_API_KEY[:10])
# if not GROQ_API_KEY:
#     print("❌ GROQ_API_KEY not found")
# else:
#     print("✅ Groq API key loaded")

# client = Groq(api_key=GROQ_API_KEY)
load_dotenv()

app = Flask(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    print("DEBUG KEY:", GROQ_API_KEY[:10])
    print("✅ Groq API key loaded")
else:
    print("❌ GROQ_API_KEY not found")

client = Groq(api_key=GROQ_API_KEY)

# ----------------------------------
# SUPABASE CONFIGURATION
# ----------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials missing")
    supabase = None
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase connected")

# ----------------------------------
# SYSTEM PROMPT
# ----------------------------------
SAFAR_SYSTEM_PROMPT = """
You are Safar, a specialized AI travel assistant. You ONLY answer travel-related questions.

STRICT RULES - YOU MUST FOLLOW THESE:
1. If the question is about travel, destinations, hotels, flights, itineraries, budgets, visas, food, culture, safety, transportation, tourism, or vacation planning → Answer helpfully
2. If the question is about ANYTHING ELSE (coding, math, science, history, general knowledge, personal advice, etc.) → Refuse politely and redirect to travel
3.When a user asks to plan a trip, respond with a clearly formatted itinerary in natural language using bullet points and sections.
Do NOT return JSON in the visible response.


 YOUR RESPONSES:
✅ ANSWER these topics:
* Trip planning and itineraries
* Destination recommendations
* Budget estimates and cost breakdowns
* Hotel and accommodation suggestions
* Flight and transportation advice
* Local food and restaurant tips
* Visa and travel document requirements
* Safety tips and travel warnings
* Cultural customs and etiquette
* Best times to visit places
* Packing lists and travel gear
* Travel insurance advice

 ❌ REFUSE these topics:
* Programming/coding questions
* Math problems or calculations (unless travel budget related)
* Science questions
* History (unless related to tourist sites)
* Personal relationship advice
* Health/medical diagnosis
* Legal advice
* Any non-travel topics

WHEN REFUSING (use this exact format):
"I'm Safar, your travel assistant! 🌍 I only help with travel planning and trip-related questions. Could you ask me about destinations, itineraries, budgets, or travel tips instead? ✈️"

 YOUR PERSONALITY (for travel questions only):
* Friendly, warm, and encouraging
* Use emojis: ✈️ 🌍 🗺️ 🏖️ 🎒 🍜 🏨
* Concise responses (under 150 words unless detailed itinerary requested)
* Specific and actionable advice
* DO NOT use markdown symbols like ** or __ for formatting
* Use plain text with emojis for emphasis
* Format with clear line breaks

 EXAMPLE RESPONSES:

User: "Plan a 3-day trip to Paris"
 You: "Perfect choice! ✈️ Here's a 3-day Paris itinerary:

Day 1: Eiffel Tower morning visit, Seine River cruise, Trocadéro sunset
Day 2: Louvre Museum (book early!), Notre-Dame area, Latin Quarter evening
 Day 3: Versailles Palace day trip or Montmartre + Sacré-Cœur

Budget estimate: $800-1200 per person (excluding flights)
Best time: April-June or Sept-Oct
Rember to show the budget in the currency of the country place is in 
example: If its India give the budget in rupees if its USA give budget in dollars etc

Need hotel or restaurant suggestions? 🗼"

User: "How do I code in Python?"
You: "I'm Safar, your travel assistant! 🌍 I only help with travel planning and trip-related questions. Could you ask me about destinations, itineraries, budgets, or travel tips instead? ✈️"


REMEMBER: You are ONLY a travel assistant. Never answer non-travel questions, even if the user insists.  

IMPORTANT OUTPUT RULE:

When generating travel itineraries you may internally structure the information in JSON format for the system to process.

However:

- NEVER display JSON to the user.
- NEVER show curly brackets {}, quotes, or JSON code blocks.
- ALWAYS present the itinerary as clean readable text.

Example format for the user:

Destination: Paris
Duration: 3 Days

Day 1
• Eiffel Tower
• Seine River Cruise

Day 2
• Louvre Museum
• Notre Dame Area

Day 3
• Montmartre
• Sacré-Cœur

The JSON structure is only for the system and must remain hidden from the user.
  
"""

# ----------------------------------
# DATABASE HELPER FUNCTIONS
# ----------------------------------

def save_message_to_db(session_id, role, message, user_id=None):
    """Saves every user & assistant message to Supabase with user_id"""
    if not supabase:
        print("⚠️ Supabase not available - message not saved")
        return False

    try:
        data = {
            "session_id": session_id,
            "role": role,
            "message": message
        }
        if user_id:
            data["user_id"] = user_id

        result = supabase.table("chats").insert(data).execute()
        print(f"✅ Saved {role} message to DB for user {user_id}")
        return True
    except Exception as e:
        print(f"❌ Error saving message: {e}")
        return False


def get_conversation_from_db(session_id, limit=50):
    """Fetches full conversation for ONE session"""

    if not supabase:
        print("⚠️ Supabase not available")
        return []

    try:
        result = (
            supabase.table("chats")
            .select("role, message, created_at")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )

        print(f"✅ Loaded {len(result.data)} messages for session {session_id}")

        conversation = []

        for row in result.data:
            message = row["message"]

            # Remove custom title marker if present
            if message.startswith("[CUSTOM_TITLE]"):
                message = message.replace("[CUSTOM_TITLE]", "")

            conversation.append({
                "role": row["role"],
                "content": message
            })

        return conversation

    except Exception as e:
        print(f"❌ Error fetching conversation: {e}")
        return []


def generate_chat_title(session_id):
    """
    Generate chat title - checks for custom title first,
    then falls back to first user message (NO extra AI call to save API quota)
    """
    if not supabase:
        return "New chat"
    
    try:
        result = supabase.table("chats") \
            .select("message, role") \
            .eq("session_id", session_id) \
            .order("created_at", desc=False) \
            .limit(4) \
            .execute()
        
        if not result.data:
            return "New chat"
        
        # Check for custom title first
        first_message = result.data[0]["message"]
        if first_message.startswith("[CUSTOM_TITLE]"):
            return first_message.replace("[CUSTOM_TITLE]", "")
        
        # ✅ FIX: Use first user message as title directly (no extra AI call)
        # This avoids wasting API quota and speeds up sidebar loading significantly
        for msg in result.data:
            if msg["role"] == "user" and not msg["message"].startswith("[CUSTOM_TITLE]"):
                text = msg["message"]
                return text[:40] + ("..." if len(text) > 40 else "")
        
        return "New chat"
            
    except Exception as e:
        print(f"❌ Error generating title: {e}")
        return "New chat"


def get_all_sessions_from_db(user_id=None):
    """
    Only shows chats belonging to the logged-in user
    """
    if not supabase:
        print("⚠️ Supabase not available")
        return []

    try:
        query = supabase.table("chats").select("session_id, created_at")
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        result = query.order("created_at", desc=True).execute()

        print(f"📊 Total messages in DB for user {user_id}: {len(result.data)}")

        # Group by session_id and get the latest timestamp
        sessions_dict = {}
        for row in result.data:
            sid = row["session_id"]
            if sid not in sessions_dict:
                sessions_dict[sid] = row["created_at"]
        
        # Sort by most recent and limit to 20
        sessions_list = [
            {"session_id": sid, "created_at": timestamp}
            for sid, timestamp in sessions_dict.items()
        ]
        sessions_list.sort(key=lambda x: x["created_at"], reverse=True)
        sessions_list = sessions_list[:20]
        
        # Generate titles for each session
        for session in sessions_list:
            session["preview"] = generate_chat_title(session["session_id"])
        
        return sessions_list

    except Exception as e:
        print(f"❌ Error fetching sessions: {e}")
        return []
    


def save_memory(user_id, text):
    try:
        embedding = embed_model.encode(text).tolist()
        supabase.table("user_memory").insert({
            "user_id": user_id,
            "memory": text,
            "embedding": embedding
        }).execute()
        print("🧠 Memory saved")
    except Exception as e:
        print("Memory save error:", e)


def get_user_memories(user_id, query):
    try:
        query_embedding = embed_model.encode(query).tolist()
        result = supabase.rpc(
            "match_user_memory",
            {
                "query_embedding": query_embedding,
                "match_user_id": user_id,
                "match_count": 3
            }
        ).execute()
        memories = [m["memory"] for m in result.data]
        return memories
    except Exception as e:
        print("Memory search error:", e)
        return []


def trip_data_to_text(trip):
    """
    ✅ FIX: Convert trip JSON to plain text so it can be saved to DB
    and rendered as a trip card when loaded from history.
    We use a special marker [TRIP_DATA] so the frontend knows
    to render it as a card rather than plain text.
    """
    import json
    return "[TRIP_DATA]" + json.dumps(trip)


# ----------------------------------
# ROUTES
# ----------------------------------

@app.route("/")
def index():
    return render_template(
        "index.html",
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_KEY
    )

@app.route("/chat")
def chat():
    return render_template(
        "chat.html",
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_KEY
    )

@app.route("/about")
def about():
    return render_template(
        "about.html",
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_KEY
    )

@app.route("/features")
def features():
    return render_template(
        "features.html",
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_KEY
    )

@app.route("/faq")
def faq():
    return render_template(
        "faq.html",
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_KEY
    )

@app.route("/how-it-works")
def how_it_works():
    return render_template(
        "how-it-works.html",
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_KEY
    )

@app.route("/ask", methods=["POST"])
def ask():
    """Handle chat messages"""
    print("\n🔵 /ask endpoint called")

    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        session_id = data.get("session_id")
        user_id = data.get("user_id")

        print(f"📥 User: {user_message}")
        print(f"🔑 Session: {session_id}")

        if not user_message or not session_id:
            return jsonify({"reply": "Please ask a travel question 🌍", "success": False}), 400

        # Load previous conversation
        history = get_conversation_from_db(session_id, limit=8)
        print(f"📚 Loaded {len(history)} previous messages")

        # Filter out [TRIP_DATA] messages from history sent to AI
        # (send a plain text version instead so AI has context)
        clean_history = []
        for msg in history:
            content = msg["content"]
            if content.startswith("[TRIP_DATA]"):
                # Give AI a simple placeholder so it knows a trip was planned
                import json
                try:
                    trip = json.loads(content.replace("[TRIP_DATA]", ""))
                    content = f"[I previously generated a trip plan for {trip.get('destination', 'a destination')}]"
                except:
                    content = "[I previously generated a trip plan]"
            clean_history.append({"role": msg["role"], "content": content})

        memories = get_user_memories(user_id, user_message)
        memory_text = ""
        if memories:
            memory_text = "\nUser preferences:\n" + "\n".join(memories)

        messages = [{
            "role": "system",
            "content": SAFAR_SYSTEM_PROMPT + memory_text
        }]
        messages.extend(clean_history)

        trip_keywords = ["plan", "trip", "itinerary", "travel plan", "schedule"]
        is_trip_request = any(word in user_message.lower() for word in trip_keywords)

        if is_trip_request:
            messages.append({
                "role": "system",
                "content": """
        If the user asks to PLAN a trip or itinerary,
        return JSON in this format:

        {
                "destination": "string",
                "duration_days": number,
                "best_season": "string",
                "estimated_budget": "string",
                "days": [{"day":1,"activities":["activity"]}],
                "food_recommendations": ["food"],
                "transport_tips": ["tip"],
                "safety_tips": ["tip"],
                "packing_list": ["item"]
         }

        Only return JSON.
        """
            })

        messages.append({"role": "user", "content": user_message})

        print("🤖 Calling Groq API...")

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        reply = response.choices[0].message.content.strip()

        import json

        trip_data = None
        clean_reply = reply.replace("```json", "").replace("```", "").strip()

        try:
            if clean_reply.startswith("{"):
                trip_data = json.loads(clean_reply)
                reply = ""
        except:
            trip_data = None

        print("✅ AI response received")

        # Save user message
        save_message_to_db(session_id, "user", user_message, user_id)

        if trip_data:
            # ✅ FIX: Save trip data with marker so it reloads as a card
            save_message_to_db(session_id, "assistant", trip_data_to_text(trip_data), user_id)
        else:
            save_message_to_db(session_id, "assistant", reply, user_id)

        # ✅ Save memory after saving messages (non-blocking concern)
        save_memory(user_id, user_message)

        return jsonify({
            "reply": reply,
            "trip_data": trip_data,
            "success": True
        }), 200

    except Exception as e:
        print(f"❌ ERROR in /ask: {e}")
        import traceback
        traceback.print_exc()

        return jsonify({
            "reply": "I'm having trouble connecting to my AI brain right now. Please try again! 🤖",
            "success": False
        }), 500


@app.route("/history/<session_id>")
def history(session_id):
    """Returns full conversation for a session"""
    print(f"\n🔵 /history/{session_id} called")
    conversation = get_conversation_from_db(session_id)
    return jsonify({"history": conversation})


@app.route("/sessions")
def sessions():
    """Returns all chat sessions for sidebar"""
    user_id = request.args.get("user_id")
    print(f"\n🔵 /sessions called for user {user_id}")
    all_sessions = get_all_sessions_from_db(user_id)
    return jsonify({"sessions": all_sessions})


@app.route("/delete/<session_id>", methods=["DELETE"])
def delete_chat(session_id):
    """Delete a chat session"""
    user_id = request.args.get("user_id")
    print(f"\n🔵 /delete/{session_id} called for user {user_id}")
    
    if not supabase:
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    try:
        query = supabase.table("chats").delete().eq("session_id", session_id)
        if user_id:
            query = query.eq("user_id", user_id)
        query.execute()
        
        print(f"✅ Deleted session: {session_id}")
        return jsonify({"success": True}), 200
        
    except Exception as e:
        print(f"❌ Error deleting session: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/rename/<session_id>", methods=["POST"])
def rename_chat(session_id):
    """Rename a chat session"""
    print(f"\n🔵 /rename/{session_id} called")

    if not supabase:
        return jsonify({"success": False, "error": "Database not available"}), 500

    try:
        data = request.get_json()
        new_title = data.get("title", "").strip()

        if not new_title:
            return jsonify({"success": False, "error": "Title cannot be empty"}), 400

        if len(new_title) > 100:
            return jsonify({"success": False, "error": "Title too long"}), 400

        result = (
            supabase.table("chats")
            .select("id, message")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )

        if not result.data:
            return jsonify({"success": False, "error": "Session not found"}), 404

        first_message_id = result.data[0]["id"]

        supabase.table("chats") \
            .update({"message": f"[CUSTOM_TITLE]{new_title}"}) \
            .eq("id", first_message_id) \
            .execute()

        print(f"✅ Renamed session: {session_id} → {new_title}")

        return jsonify({
            "success": True,
            "title": new_title
        })

    except Exception as e:
        print(f"❌ Error renaming session: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ----------------------------------
# RUN SERVER
# ----------------------------------
# if __name__ == "__main__":
#     print("\n🚀 SAFAR AI RUNNING")
#     print("📍 http://localhost:5000/chat\n")
#     app.run(debug=True)
if __name__ == "__main__":
    print("\n🚀 SAFAR AI RUNNING")

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )








