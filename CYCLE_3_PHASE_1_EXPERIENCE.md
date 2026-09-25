# The Ghost in the Classroom
### *Cycle 3, Phase 1: Breathing Life into the Student AI*

---

Our goal was simple: build a smart, empathetic companion for students—a chatbot. 
Not just a canned FAQ responder, but an academic mentor that actually understands where someone stands in their semester and steps in before they fall behind.

On paper, the pieces fit together effortlessly. We hooked up Groq’s fast language models, locked the doors with JWT authentication, fed in real student engagement metrics, and added tool-calling so the bot could look up full course histories on demand. 

Then came reality.

Inside our command terminal, everything worked. But the moment we opened the live browser dashboard, our assistant froze. 

Every greeting, every question, met the exact same robotic apology: *"Looks like things went south on my side... Go for it again."* Multiple tries, code updates, but we were stuck in an infinite loop of polite refusals.

Then came an idea -- keep our original code untouched as **Module A**, and build **Module B** from pure scratch—just a bare text box and an API key. 

That turned the tide. On Step 1, stripped of all database lookups and security checks, the bot threw a stark error: `404 Not Found`. 

The mystery unraveled in seconds. Our frontend was shooting requests to `/chatbot/student`, while our backend server was listening at `/api/chatbot/student`. A single missing `/api` had been hiding behind our friendly fallback message the whole time.

We patched the prefix, swapped back to Module A, and watched the magic happen. The bot woke up, greeted the student by name, and delivered a clear snapshot of their course progress. With a final touch of markdown styling to replace messy asterisks with clean bullet points and bold highlights, Phase 1 came to a close. 

The ghost in the classroom finally had a voice.
