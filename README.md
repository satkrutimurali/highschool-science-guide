# highschool-science-guide

A simple guided science tutor for BC-based Grades 9–12 science.

What it does:
- Helps students think through science questions step by step
- Uses a Socratic style instead of giving direct answers immediately
- Lets curriculum questions be answered directly, while science-content questions stay guided
- Sends each question to a local API route that can use an LLM backend when available

How to run it locally:
1. Open a terminal in the project folder
2. Run: node server.js
3. Visit: http://127.0.0.1:3001

To use a real LLM backend, make sure a local model service such as Ollama is running on port 11434 and set:
- OLLAMA_ENDPOINT=http://127.0.0.1:11434/api/chat
- OLLAMA_MODEL=llama3.2

If no LLM is available, the app falls back to the built-in guided tutor logic so the experience still works.
