---
status: investigating
trigger: "Categories API returning 404 on /api/api/categories/"
symptoms:
  expected: "Categories should be fetched and created successfully."
  actual: "Requests to /api/api/categories/ fail with 404 Not Found."
  error_messages: "/api/api/categories/ :1 Failed to load resource: the server responded with a status of 404 (Not Found)"
  timeline: "First time testing the feature."
  reproduction: "Opening the categories page or attempting to create a category in the drawer."
created: 2026-04-28
updated: 2026-04-28
---

# Current Focus
hypothesis: "The frontend is prefixing the API URL incorrectly, resulting in a double /api/api/ path that the backend does not recognize."
test: "Check frontend axios configuration or environment variables for the API base URL."
expecting: "Finding a configuration where /api is being added twice."
next_action: "Examine frontend environment variables and axios instance setup."
reasoning_checkpoint: "The double /api/ in the URL is a classic proxy/baseURL misconfiguration."

# Evidence
- timestamp: 2026-04-28T00:00:00Z
  observation: "User logs show 404 for /api/api/categories/"

# Eliminated

