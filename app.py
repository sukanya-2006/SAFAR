
# from flask import Flask, render_template, request, jsonify
# from huggingface_hub import InferenceClient
# from supabase import create_client
# import os
# from dotenv import load_dotenv

# # ----------------------------------
# # LOAD ENVIRONMENT VARIABLES
# # ----------------------------------
# load_dotenv()

# app = Flask(__name__)

# # ----------------------------------
# # HUGGING FACE CONFIGURATION
# # ----------------------------------
# HF_TOKEN = os.getenv("HF_API_TOKEN")

# if not HF_TOKEN:
#     print("❌ ERROR: HF_API_TOKEN not found")
# else:
#     print("✅ Hugging Face token loaded")

# client = InferenceClient(token=HF_TOKEN)

# # ----------------------------------
# # SUPABASE CONFIGURATION
# # ----------------------------------
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# if not SUPABASE_URL or not SUPABASE_KEY:
#     print("❌ Supabase credentials missing")
#     supabase = None
# else:
#     supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
#     print("✅ Supabase connected")

# # ----------------------------------
# # SYSTEM PROMPT
# # ----------------------------------
# SAFAR_SYSTEM_PROMPT = """
# You are Safar, a specialized AI travel assistant. You ONLY answer travel-related questions.

# STRICT RULES - YOU MUST FOLLOW THESE:
# 1. If the question is about travel, destinations, hotels, flights, itineraries, budgets, visas, food, culture, safety, transportation, tourism, or vacation planning → Answer helpfully
# 2. If the question is about ANYTHING ELSE (coding, math, science, history, general knowledge, personal advice, etc.) → Refuse politely and redirect to travel

#  YOUR RESPONSES:
# ✅ ANSWER these topics:
# - Trip planning and itineraries
# - Destination recommendations
# - Budget estimates and cost breakdowns
# - Hotel and accommodation suggestions
# - Flight and transportation advice
# - Local food and restaurant tips
# - Visa and travel document requirements
# - Safety tips and travel warnings
# - Cultural customs and etiquette
# - Best times to visit places
# - Packing lists and travel gear
# - Travel insurance advice

#  ❌ REFUSE these topics:
# - Programming/coding questions
# - Math problems or calculations (unless travel budget related)
# - Science questions
# - History (unless related to tourist sites)
# - Personal relationship advice
# - Health/medical diagnosis
# - Legal advice
# - Any non-travel topics

# WHEN REFUSING (use this exact format):
# "I'm Safar, your travel assistant! 🌍 I only help with travel planning and trip-related questions. Could you ask me about destinations, itineraries, budgets, or travel tips instead? ✈️"

#  YOUR PERSONALITY (for travel questions only):
# - Friendly, warm, and encouraging
# - Use emojis: ✈️ 🌍 🗺️ 🏖️ 🎒 🍜 🏨
# - Concise responses (under 150 words unless detailed itinerary requested)
# - Specific and actionable advice
# - DO NOT use markdown symbols like ** or __ for formatting
# - Use plain text with emojis for emphasis
# - Format with clear line breaks

#  EXAMPLE RESPONSES:

# User: "Plan a 3-day trip to Paris"
#  You: "Perfect choice! ✈️ Here's a 3-day Paris itinerary:

# Day 1: Eiffel Tower morning visit, Seine River cruise, Trocadéro sunset
# Day 2: Louvre Museum (book early!), Notre-Dame area, Latin Quarter evening
#  Day 3: Versailles Palace day trip or Montmartre + Sacré-Cœur

# Budget estimate: $800-1200 per person (excluding flights)
# Best time: April-June or Sept-Oct

# Need hotel or restaurant suggestions? 🗼"

# User: "How do I code in Python?"
# You: "I'm Safar, your travel assistant! 🌍 I only help with travel planning and trip-related questions. Could you ask me about destinations, itineraries, budgets, or travel tips instead? ✈️"

# REMEMBER: You are ONLY a travel assistant. Never answer non-travel questions, even if the user insists.
# """

# # ----------------------------------
# # DATABASE HELPER FUNCTIONS
# # ----------------------------------

# def save_message_to_db(session_id, role, message):
#     """Saves every user & assistant message to Supabase"""
#     if not supabase:
#         print("⚠️ Supabase not available - message not saved")
#         return False

#     try:
#         result = supabase.table("chats").insert({
#             "session_id": session_id,
#             "role": role,
#             "message": message
#         }).execute()
#         print(f"✅ Saved {role} message to DB")
#         return True
#     except Exception as e:
#         print(f"❌ Error saving message: {e}")
#         return False


# def get_conversation_from_db(session_id, limit=50):
#     """Fetches full conversation for ONE session"""
#     if not supabase:
#         print("⚠️ Supabase not available")
#         return []

#     try:
#         result = supabase.table("chats") \
#             .select("role, message, created_at") \
#             .eq("session_id", session_id) \
#             .order("created_at", desc=False) \
#             .limit(limit) \
#             .execute()

#         print(f"✅ Loaded {len(result.data)} messages for session {session_id}")
        
#         return [
#             {"role": row["role"], "content": row["message"]}
#             for row in result.data
#         ]
#     except Exception as e:
#         print(f"❌ Error fetching conversation: {e}")
#         return []


# def get_all_sessions_from_db():
#     """Fetches UNIQUE chat sessions with proper grouping"""
#     if not supabase:
#         print("⚠️ Supabase not available")
#         return []

#     try:
#         # Get ALL messages, then group by session_id in Python
#         result = supabase.table("chats") \
#             .select("session_id, message, created_at, role") \
#             .order("created_at", desc=True) \
#             .execute()

#         print(f"📊 Total messages in DB: {len(result.data)}")

#         sessions = {}
        
#         for row in result.data:
#             sid = row["session_id"]
            
#             # Only take FIRST message per session for preview (regardless of role)
#             if sid not in sessions:
#                 sessions[sid] = {
#                     "session_id": sid,
#                     "created_at": row["created_at"],
#                     "preview": row["message"][:50] + ("..." if len(row["message"]) > 50 else "")
#                 }

#         session_list = list(sessions.values())
#         session_list.sort(key=lambda x: x["created_at"], reverse=True)
        
#         print(f"✅ Found {len(session_list)} unique sessions")
#         for s in session_list[:3]:  # Print first 3 for debugging
#             print(f"   - {s['session_id']}: {s['preview']}")
        
#         return session_list

#     except Exception as e:
#         print(f"❌ Error fetching sessions: {e}")
#         import traceback
#         traceback.print_exc()
#         return []

# # ----------------------------------
# # ROUTES
# # ----------------------------------

# @app.route("/")
# def index():
#     return render_template("index.html")


# @app.route("/chat")
# def chat():
#     return render_template("chat.html")


# @app.route("/ask", methods=["POST"])
# def ask():
#     """Handle chat messages with better error handling"""
#     print("\n🔵 /ask endpoint called")
    
#     try:
#         data = request.get_json()
#         user_message = data.get("message", "").strip()
#         session_id = data.get("session_id")

#         print(f"📥 User: {user_message}")
#         print(f"🔑 Session: {session_id}")

#         if not user_message or not session_id:
#             return jsonify({"reply": "Please ask a travel question 🌍", "success": False}), 400

#         # Load recent history from DB
#         history = get_conversation_from_db(session_id, limit=8)
#         print(f"📚 Loaded {len(history)} previous messages")

#         messages = [{"role": "system", "content": SAFAR_SYSTEM_PROMPT}]
#         messages.extend(history)
#         messages.append({"role": "user", "content": user_message})

#         print("🤖 Calling Hugging Face API...")
        
#         # Call AI model with timeout
#         try:
#             response = client.chat_completion(
#                 model="meta-llama/Llama-3.2-3B-Instruct",
#                 messages=messages,
#                 max_tokens=300,
#                 temperature=0.7
#             )
#             print("✅ AI response received")
#         except Exception as hf_error:
#             print(f"❌ Hugging Face API Error: {hf_error}")
#             return jsonify({
#                 "reply": "I'm having trouble connecting to my AI brain right now. Please try again! 🤖",
#                 "success": False
#             }), 500

#         reply = response.choices[0].message.content.strip()
#         print(f"💬 AI Reply: {reply[:100]}...")

#         # Save BOTH messages to DB
#         save_message_to_db(session_id, "user", user_message)
#         save_message_to_db(session_id, "assistant", reply)

#         return jsonify({"reply": reply, "success": True}), 200

#     except Exception as e:
#         print(f"❌ CRITICAL ERROR in /ask: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({
#             "reply": "Something went wrong. Please try again.",
#             "success": False
#         }), 500


# @app.route("/history/<session_id>")
# def history(session_id):
#     """Returns full conversation for a session"""
#     print(f"\n🔵 /history/{session_id} called")
#     conversation = get_conversation_from_db(session_id)
#     return jsonify({"history": conversation})


# @app.route("/sessions")
# def sessions():
#     """Returns all chat sessions for sidebar"""
#     print("\n🔵 /sessions called")
#     all_sessions = get_all_sessions_from_db()
#     return jsonify({"sessions": all_sessions})

# # ----------------------------------
# # RUN SERVER
# # ----------------------------------
# if __name__ == "__main__":
#     print("\n🚀 SAFAR AI RUNNING")
#     print("📍 http://localhost:5000/chat\n")
#     app.run(debug=True)























from flask import Flask, render_template, request, jsonify
from huggingface_hub import InferenceClient
from supabase import create_client
import os
from dotenv import load_dotenv

# ----------------------------------
# LOAD ENVIRONMENT VARIABLES
# ----------------------------------
load_dotenv()

app = Flask(__name__)

# ----------------------------------
# HUGGING FACE CONFIGURATION
# ----------------------------------
HF_TOKEN = os.getenv("HF_API_TOKEN")

if not HF_TOKEN:
    print("❌ ERROR: HF_API_TOKEN not found")
else:
    print("✅ Hugging Face token loaded")

client = InferenceClient(token=HF_TOKEN)

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

 YOUR RESPONSES:
✅ ANSWER these topics:
- Trip planning and itineraries
- Destination recommendations
- Budget estimates and cost breakdowns
- Hotel and accommodation suggestions
- Flight and transportation advice
- Local food and restaurant tips
- Visa and travel document requirements
- Safety tips and travel warnings
- Cultural customs and etiquette
- Best times to visit places
- Packing lists and travel gear
- Travel insurance advice

 ❌ REFUSE these topics:
- Programming/coding questions
- Math problems or calculations (unless travel budget related)
- Science questions
- History (unless related to tourist sites)
- Personal relationship advice
- Health/medical diagnosis
- Legal advice
- Any non-travel topics

WHEN REFUSING (use this exact format):
"I'm Safar, your travel assistant! 🌍 I only help with travel planning and trip-related questions. Could you ask me about destinations, itineraries, budgets, or travel tips instead? ✈️"

 YOUR PERSONALITY (for travel questions only):
- Friendly, warm, and encouraging
- Use emojis: ✈️ 🌍 🗺️ 🏖️ 🎒 🍜 🏨
- Concise responses (under 150 words unless detailed itinerary requested)
- Specific and actionable advice
- DO NOT use markdown symbols like ** or __ for formatting
- Use plain text with emojis for emphasis
- Format with clear line breaks

 EXAMPLE RESPONSES:

User: "Plan a 3-day trip to Paris"
 You: "Perfect choice! ✈️ Here's a 3-day Paris itinerary:

Day 1: Eiffel Tower morning visit, Seine River cruise, Trocadéro sunset
Day 2: Louvre Museum (book early!), Notre-Dame area, Latin Quarter evening
 Day 3: Versailles Palace day trip or Montmartre + Sacré-Cœur

Budget estimate: $800-1200 per person (excluding flights)
Best time: April-June or Sept-Oct

Need hotel or restaurant suggestions? 🗼"

User: "How do I code in Python?"
You: "I'm Safar, your travel assistant! 🌍 I only help with travel planning and trip-related questions. Could you ask me about destinations, itineraries, budgets, or travel tips instead? ✈️"

REMEMBER: You are ONLY a travel assistant. Never answer non-travel questions, even if the user insists.
"""

# ----------------------------------
# DATABASE HELPER FUNCTIONS
# ----------------------------------

def save_message_to_db(session_id, role, message):
    """Saves every user & assistant message to Supabase"""
    if not supabase:
        print("⚠️ Supabase not available - message not saved")
        return False

    try:
        result = supabase.table("chats").insert({
            "session_id": session_id,
            "role": role,
            "message": message
        }).execute()
        print(f"✅ Saved {role} message to DB")
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
        result = supabase.table("chats") \
            .select("role, message, created_at") \
            .eq("session_id", session_id) \
            .order("created_at", desc=False) \
            .limit(limit) \
            .execute()

        print(f"✅ Loaded {len(result.data)} messages for session {session_id}")
        
        return [
            {"role": row["role"], "content": row["message"]}
            for row in result.data
        ]
    except Exception as e:
        print(f"❌ Error fetching conversation: {e}")
        return []


def generate_chat_title(session_id):
    """
    ✅ NEW: Generate AI title for chat like ChatGPT
    - Analyzes first few messages
    - Creates concise, meaningful title
    """
    if not supabase:
        return "New chat"
    
    try:
        # Get first 4 messages (2 exchanges)
        result = supabase.table("chats") \
            .select("message, role") \
            .eq("session_id", session_id) \
            .order("created_at", desc=False) \
            .limit(4) \
            .execute()
        
        if not result.data:
            return "New chat"
        
        # Build conversation context
        conversation = ""
        for msg in result.data:
            if msg["role"] == "user":
                conversation += f"User: {msg['message']}\n"
        
        if not conversation.strip():
            return "New chat"
        
        # Use AI to generate a short title
        try:
            response = client.chat_completion(
                model="meta-llama/Llama-3.2-3B-Instruct",
                messages=[
                    {
                        "role": "system",
                        "content": "You generate SHORT chat titles (3-5 words max) based on conversation. Examples: 'Manali trip planning', 'Bali budget guide', 'Europe visa help'. ONLY return the title, nothing else."
                    },
                    {
                        "role": "user",
                        "content": f"Generate a short title for this conversation:\n{conversation}"
                    }
                ],
                max_tokens=20,
                temperature=0.7
            )
            
            title = response.choices[0].message.content.strip()
            # Remove quotes if AI added them
            title = title.replace('"', '').replace("'", "")
            
            # Fallback to first user message if title is too long or generic
            if len(title) > 50 or title.lower() in ["new chat", "travel chat", "chat"]:
                first_user = next((m["message"] for m in result.data if m["role"] == "user"), None)
                if first_user:
                    return first_user[:40] + ("..." if len(first_user) > 40 else "")
                return "New chat"
            
            return title
            
        except Exception as e:
            print(f"⚠️ AI title generation failed: {e}")
            # Fallback to first user message
            first_user = next((m["message"] for m in result.data if m["role"] == "user"), None)
            if first_user:
                return first_user[:40] + ("..." if len(first_user) > 40 else "")
            return "New chat"
            
    except Exception as e:
        print(f"❌ Error generating title: {e}")
        return "New chat"


def get_all_sessions_from_db():
    """
    ✅ IMPROVED: Smart chat titles + Limited to 20 most recent
    - AI-generated titles like ChatGPT
    - Only shows 20 most recent chats
    """
    if not supabase:
        print("⚠️ Supabase not available")
        return []

    try:
        # Get all unique sessions with their latest message time
        result = supabase.table("chats") \
            .select("session_id, created_at") \
            .order("created_at", desc=True) \
            .execute()

        print(f"📊 Total messages in DB: {len(result.data)}")

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
        sessions_list = sessions_list[:20]  # ✅ Limit to 20 most recent
        
        # Generate titles for each session
        for session in sessions_list:
            session["preview"] = generate_chat_title(session["session_id"])
        
        print(f"✅ Showing {len(sessions_list)} most recent sessions (max 20)")
        for s in sessions_list[:3]:
            print(f"   - {s['preview']}")
        
        return sessions_list

    except Exception as e:
        print(f"❌ Error fetching sessions: {e}")
        import traceback
        traceback.print_exc()
        return []

# ----------------------------------
# ROUTES
# ----------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat")
def chat():
    return render_template("chat.html")


@app.route("/ask", methods=["POST"])
def ask():
    """Handle chat messages with better error handling"""
    print("\n🔵 /ask endpoint called")
    
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        session_id = data.get("session_id")

        print(f"📥 User: {user_message}")
        print(f"🔑 Session: {session_id}")

        if not user_message or not session_id:
            return jsonify({"reply": "Please ask a travel question 🌍", "success": False}), 400

        # Load recent history from DB
        history = get_conversation_from_db(session_id, limit=8)
        print(f"📚 Loaded {len(history)} previous messages")

        messages = [{"role": "system", "content": SAFAR_SYSTEM_PROMPT}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        print("🤖 Calling Hugging Face API...")
        
        # Call AI model with timeout
        try:
            response = client.chat_completion(
                model="meta-llama/Llama-3.2-3B-Instruct",
                messages=messages,
                max_tokens=300,
                temperature=0.7
            )
            print("✅ AI response received")
        except Exception as hf_error:
            print(f"❌ Hugging Face API Error: {hf_error}")
            return jsonify({
                "reply": "I'm having trouble connecting to my AI brain right now. Please try again! 🤖",
                "success": False
            }), 500

        reply = response.choices[0].message.content.strip()
        print(f"💬 AI Reply: {reply[:100]}...")

        # Save BOTH messages to DB
        save_message_to_db(session_id, "user", user_message)
        save_message_to_db(session_id, "assistant", reply)

        return jsonify({"reply": reply, "success": True}), 200

    except Exception as e:
        print(f"❌ CRITICAL ERROR in /ask: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "reply": "Something went wrong. Please try again.",
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
    print("\n🔵 /sessions called")
    all_sessions = get_all_sessions_from_db()
    return jsonify({"sessions": all_sessions})


@app.route("/delete/<session_id>", methods=["DELETE"])
def delete_chat(session_id):
    """
    ✅ NEW: Delete a chat session
    - Removes all messages for that session
    """
    print(f"\n🔵 /delete/{session_id} called")
    
    if not supabase:
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    try:
        # Delete all messages for this session
        result = supabase.table("chats") \
            .delete() \
            .eq("session_id", session_id) \
            .execute()
        
        print(f"✅ Deleted session: {session_id}")
        return jsonify({"success": True}), 200
        
    except Exception as e:
        print(f"❌ Error deleting session: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ----------------------------------
# RUN SERVER
# ----------------------------------
if __name__ == "__main__":
    print("\n🚀 SAFAR AI RUNNING")
    print("📍 http://localhost:5000/chat\n")
    app.run(debug=True)





