

from flask import Flask, render_template, request, jsonify
from groq import Groq
from supabase import create_client
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

# ----------------------------------
# LOAD ENVIRONMENT VARIABLES
# ----------------------------------

load_dotenv()

app = Flask(__name__)

# ----------------------------------
# LAZY LOAD EMBEDDING MODEL
# ----------------------------------

embed_model = None

def get_embed_model():
    global embed_model
    if embed_model is None:
        print("🔄 Loading embedding model...")
        embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Embedding model loaded")
    return embed_model

# ----------------------------------
# GROQ CONFIGURATION
# ----------------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
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
3. When a user asks to plan a trip, respond with a clearly formatted itinerary in natural language using bullet points and sections.
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

BUDGET RULES — VERY IMPORTANT, ALWAYS FOLLOW:
* Always show budget in the LOCAL CURRENCY of the destination country.
  - India → Indian Rupees (₹)
  - USA → US Dollars ($)
  - Europe → Euros (€)
  - UK → British Pounds (£)
  - Japan → Japanese Yen (¥)
  - Dubai/UAE → UAE Dirhams (AED)
  - Thailand → Thai Baht (฿)
  - Australia → Australian Dollars (A$)
  - And so on for every other country.
* Budget must be REALISTIC and ACCURATE based on current real-world prices — not made up.
* ALWAYS break down the budget into categories: accommodation, food, transport, activities, miscellaneous.
* Budget tiers — use exactly these when user specifies:
  - Budget / Backpacker: Hostels, street food, public transport, free attractions. Lowest realistic cost.
  - Mid-range: 3-star hotels, local restaurants, mix of public and private transport, paid attractions.
  - Luxury: 4-5 star hotels, fine dining, private taxis/tours, premium experiences.
* If the user says they are a "budget traveller", "budget friendly", "cheap trip", "backpacker", or similar:
  - ONLY recommend budget accommodation (hostels, guesthouses, budget hotels, Airbnb shared rooms).
  - ONLY recommend street food, local dhabas, cheap local eateries — no restaurants unless very cheap.
  - ONLY recommend public transport (buses, metros, shared autos, trains) — no taxis or private cars.
  - ONLY recommend free or very low cost attractions (parks, temples, beaches, free museums).
  - The estimated_budget must reflect the LOWEST REALISTIC daily cost for that destination.
  - Never sneak in expensive hotels, tours, or restaurants when the user asked for budget travel.
* Always give a per-person total AND a per-day breakdown so the user knows what to expect each day.
* Be honest — if a destination is expensive even on a budget (e.g. Switzerland, Iceland, Norway), say so clearly and suggest cheaper alternatives nearby.

EXAMPLE RESPONSES:

User: "Plan a 3-day budget trip to Paris"
You: "Perfect choice! ✈️ Here's a 3-day budget Paris itinerary:

Day 1: Free walking tour of Montmartre, picnic at Champ de Mars with Eiffel Tower view (free!), Seine riverside stroll
Day 2: Louvre Museum (free first Sunday of month or €17 ticket), Notre-Dame area, Latin Quarter street food
Day 3: Sacré-Cœur (free), Marché d'Aligre flea market, budget crêpe dinner

Budget breakdown (per person):
Accommodation: €25-35/night (hostel dorm)
Food: €15-20/day (boulangeries, supermarkets, kebab shops)
Transport: €10/day (metro day pass)
Activities: €5-10/day (mostly free sights)
Total: approx €165-200 for 3 days (excluding flights)

Best time: April-June or Sept-Oct 🗼"

User: "Plan a 3-day trip to Paris" (no budget mentioned)
You: "Perfect choice! ✈️ Here's a 3-day Paris itinerary:

Day 1: Eiffel Tower morning visit, Seine River cruise, Trocadéro sunset
Day 2: Louvre Museum (book early!), Notre-Dame area, Latin Quarter evening
Day 3: Versailles Palace day trip or Montmartre + Sacré-Cœur

Budget estimate (per person):
Accommodation: €80-150/night (3-star hotel)
Food: €40-60/day
Transport: €15/day
Activities: €30/day
Total: approx €500-700 for 3 days (excluding flights) 💶

Best time: April-June or Sept-Oct
Need hotel or restaurant suggestions? 🗼"

User: "How do I code in Python?"
You: "I'm Safar, your travel assistant! 🌍 I only help with travel planning and trip-related questions. Could you ask me about destinations, itineraries, budgets, or travel tips instead? ✈️"

REMEMBER: You are ONLY a travel assistant. Never answer non-travel questions, even if the user insists.

SAFETY RATING RULES — VERY IMPORTANT:
* Safety ratings must be honest and based on real-world traveler experiences, crime index, and travel advisories.
* Never give false reassurance. If a place has genuine risks, say so clearly and specifically.
* Safety rating is a number from 1-10 where: 9-10 = very safe, 7-8 = generally safe, 5-6 = moderate caution needed, 3-4 = high caution, 1-2 = dangerous/avoid.
* safety_info must include: who the destination is best suited for (solo, family, couples), specific risks to be aware of, and one key safety tip.

IMPORTANT OUTPUT RULE:
When generating travel itineraries you may internally structure the information in JSON format for the system to process.
However:
- NEVER display JSON to the user.
- NEVER show curly brackets {}, quotes, or JSON code blocks.
- ALWAYS present the itinerary as clean readable text.

The JSON structure is only for the system and must remain hidden from the user.
"""

# ----------------------------------
# DATABASE HELPER FUNCTIONS
# ----------------------------------

def save_message_to_db(session_id, role, message, user_id=None):
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
        supabase.table("chats").insert(data).execute()
        print(f"✅ Saved {role} message to DB for user {user_id}")
        return True
    except Exception as e:
        print(f"❌ Error saving message: {e}")
        return False


def get_conversation_from_db(session_id, limit=50):
    if not supabase:
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
            if message.startswith("[CUSTOM_TITLE]"):
                message = message.replace("[CUSTOM_TITLE]", "")
            conversation.append({"role": row["role"], "content": message})
        return conversation
    except Exception as e:
        print(f"❌ Error fetching conversation: {e}")
        return []


def generate_chat_title(session_id):
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
        first_message = result.data[0]["message"]
        if first_message.startswith("[CUSTOM_TITLE]"):
            return first_message.replace("[CUSTOM_TITLE]", "")
        for msg in result.data:
            if msg["role"] == "user" and not msg["message"].startswith("[CUSTOM_TITLE]"):
                text = msg["message"]
                return text[:40] + ("..." if len(text) > 40 else "")
        return "New chat"
    except Exception as e:
        print(f"❌ Error generating title: {e}")
        return "New chat"


def get_all_sessions_from_db(user_id=None):
    if not supabase:
        return []
    try:
        query = supabase.table("chats").select("session_id, created_at")
        if user_id:
            query = query.eq("user_id", user_id)
        result = query.order("created_at", desc=True).execute()
        print(f"📊 Total messages in DB for user {user_id}: {len(result.data)}")
        sessions_dict = {}
        for row in result.data:
            sid = row["session_id"]
            if sid not in sessions_dict:
                sessions_dict[sid] = row["created_at"]
        sessions_list = [
            {"session_id": sid, "created_at": timestamp}
            for sid, timestamp in sessions_dict.items()
        ]
        sessions_list.sort(key=lambda x: x["created_at"], reverse=True)
        sessions_list = sessions_list[:20]
        for session in sessions_list:
            session["preview"] = generate_chat_title(session["session_id"])
        return sessions_list
    except Exception as e:
        print(f"❌ Error fetching sessions: {e}")
        return []


def save_memory(user_id, text):
    try:
        embedding = get_embed_model().encode(text).tolist()
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
        query_embedding = get_embed_model().encode(query).tolist()
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
    import json
    return "[TRIP_DATA]" + json.dumps(trip)


# ----------------------------------
# ROUTES
# ----------------------------------

@app.route("/")
def index():
    return render_template("index.html", supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)

@app.route("/chat")
def chat():
    return render_template("chat.html", supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)

@app.route("/about")
def about():
    return render_template("about.html", supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)

@app.route("/features")
def features():
    return render_template("features.html", supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)

@app.route("/faq")
def faq():
    return render_template("faq.html", supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)

@app.route("/how-it-works")
def how_it_works():
    return render_template("how-it-works.html", supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)


@app.route("/ask", methods=["POST"])
def ask():
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

        history = get_conversation_from_db(session_id, limit=8)
        print(f"📚 Loaded {len(history)} previous messages")

        clean_history = []
        for msg in history:
            content = msg["content"]
            if content.startswith("[TRIP_DATA]"):
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

        messages = [{"role": "system", "content": SAFAR_SYSTEM_PROMPT + memory_text}]
        messages.extend(clean_history)

        trip_keywords = ["plan", "trip", "itinerary", "travel plan", "schedule"]
        is_trip_request = any(word in user_message.lower() for word in trip_keywords)

        # Detect budget level from user message
        budget_keywords = ["budget", "cheap", "affordable", "backpack", "low cost", "inexpensive", "economical", "save money", "tight budget", "shoestring"]
        luxury_keywords = ["luxury", "luxurious", "5 star", "five star", "premium", "splurge", "high end"]
        is_budget_trip = any(word in user_message.lower() for word in budget_keywords)
        is_luxury_trip = any(word in user_message.lower() for word in luxury_keywords)

        if is_budget_trip:
            budget_instruction = """
BUDGET TRIP DETECTED — STRICT RULES:
- accommodation: hostels, guesthouses, budget hotels, dormitories only. No 3-star or above.
- food_recommendations: street food, local markets, cheap local eateries, self-catering only. No restaurants unless under $5/meal equivalent.
- transport_tips: public transport only — buses, metro, trains, shared rides. No private taxis or tours.
- days activities: free or very cheap attractions only — parks, beaches, temples, free museums, walking tours.
- estimated_budget: must be the LOWEST REALISTIC total for this destination in local currency. Break it down as: Accommodation X/night + Food X/day + Transport X/day + Activities X/day = Total X for N days.
- Be honest if the destination is expensive even on a budget — mention it and give savings tips.
"""
        elif is_luxury_trip:
            budget_instruction = """
LUXURY TRIP DETECTED:
- accommodation: 4-5 star hotels, boutique hotels, resorts only.
- food_recommendations: fine dining, rooftop restaurants, renowned local restaurants.
- transport_tips: private taxis, chauffeur, business class trains, car rentals.
- estimated_budget: reflect premium pricing in local currency with full breakdown.
"""
        else:
            budget_instruction = """
STANDARD TRIP (mid-range assumed unless user specifies):
- accommodation: 3-star hotels, good guesthouses, Airbnb private rooms.
- food_recommendations: mix of local restaurants and street food.
- transport_tips: mix of public and private transport.
- estimated_budget: realistic mid-range total in local currency with breakdown per category.
"""

        if is_trip_request:
            messages.append({
                "role": "system",
                "content": f"""
If the user asks to PLAN a trip or itinerary, return JSON in this exact format:

{{
    "destination": "string",
    "duration_days": number,
    "best_season": "string",
    "estimated_budget": "string — MUST be in local currency of destination. MUST include per-day breakdown: Accommodation + Food + Transport + Activities = Total",
    "days": [{{"day": 1, "activities": ["activity — must match budget tier, no expensive activities for budget trips"]}}],
    "food_recommendations": ["food — must match budget tier"],
    "transport_tips": ["tip — must match budget tier"],
    "safety_tips": ["tip"],
    "packing_list": ["item"],
    "safety_rating": number,
    "safety_info": "string — who it is best for, specific risks, and one key safety tip. Be honest and accurate."
}}

BUDGET RULES FOR THIS TRIP:
{budget_instruction}

CURRENCY RULES:
- Always use the local currency of the destination. Never use USD for non-US destinations.
- India → ₹, Europe → €, UK → £, Japan → ¥, UAE → AED, Thailand → ฿, Australia → A$

Rules for safety_rating and safety_info:
- Base it on real traveler experiences and known travel advisories. Be honest.
- safety_rating is a number 1-10 (10 = safest).
- safety_info must mention: best suited for (solo/family/couples), any real risks, one key tip.
- Never give false reassurance. If risks exist, state them clearly.

Only return JSON. No extra text.
"""
            })

        messages.append({"role": "user", "content": user_message})

        print("🤖 Calling Groq API...")
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=600
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

        save_message_to_db(session_id, "user", user_message, user_id)

        if trip_data:
            save_message_to_db(session_id, "assistant", trip_data_to_text(trip_data), user_id)
        else:
            save_message_to_db(session_id, "assistant", reply, user_id)

        save_memory(user_id, user_message)

        return jsonify({"reply": reply, "trip_data": trip_data, "success": True}), 200

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
    print(f"\n🔵 /history/{session_id} called")
    conversation = get_conversation_from_db(session_id)
    return jsonify({"history": conversation})


@app.route("/sessions")
def sessions():
    user_id = request.args.get("user_id")
    print(f"\n🔵 /sessions called for user {user_id}")
    all_sessions = get_all_sessions_from_db(user_id)
    return jsonify({"sessions": all_sessions})


@app.route("/delete/<session_id>", methods=["DELETE"])
def delete_chat(session_id):
    user_id = request.args.get("user_id")
    if not supabase:
        return jsonify({"success": False}), 500
    try:
        query = supabase.table("chats").delete().eq("session_id", session_id)
        if user_id:
            query = query.eq("user_id", user_id)
        query.execute()
        print(f"✅ Deleted session: {session_id}")
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/rename/<session_id>", methods=["POST"])
def rename_chat(session_id):
    if not supabase:
        return jsonify({"success": False}), 500
    try:
        data = request.get_json()
        new_title = data.get("title", "").strip()
        if not new_title or len(new_title) > 100:
            return jsonify({"success": False}), 400
        result = (
            supabase.table("chats")
            .select("id, message")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )
        if not result.data:
            return jsonify({"success": False}), 404
        supabase.table("chats") \
            .update({"message": f"[CUSTOM_TITLE]{new_title}"}) \
            .eq("id", result.data[0]["id"]) \
            .execute()
        print(f"✅ Renamed session: {session_id} → {new_title}")
        return jsonify({"success": True, "title": new_title})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health")
def health():
    return "SAFAR running", 200


# ----------------------------------
# RUN SERVER
# ----------------------------------
if __name__ == "__main__":
    print("\n🚀 SAFAR AI RUNNING")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)