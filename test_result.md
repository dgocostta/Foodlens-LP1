#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  FoodLens Field Sales — premium dark-mode, Action Orange in-person pitching app for restaurants.
  Cinematic hero (PDF vs Cinema), interactive mobile demo (looping food videos), intake form,
  optional onboarding asset upload page, founding 100 offer with ACV emphasis,
  swipeable iPad-native presentation deck, protected admin leads dashboard.

backend:
  - task: "Leads API: POST /api/leads, GET /api/leads (admin-key gated, today filter)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Manual curl tests pass: POST creates lead with UUID; GET requires X-Admin-Key (foodlens2025), returns array; today=1 filter works; OPTIONS CORS works; unauth returns 401."
        - working: true
          agent: "testing"
          comment: "Comprehensive automated testing completed - ALL TESTS PASSED (10/10). Verified: (1) POST /api/leads with valid full payload returns 200 with UUID v4 lead ID, (2) POST with minimal payload (only restaurantName + ownerName) works, (3) Missing restaurantName returns 400 error, (4) Missing ownerName returns 400 error, (5) GET without auth returns 401 unauthorized, (6) GET with wrong key returns 401, (7) GET with X-Admin-Key header returns 200 with leads array, (8) GET with ?key= query param works, (9) GET with ?today=1 filter returns only today's leads, (10) CORS OPTIONS preflight returns 204 with Access-Control-Allow-Origin: *. UUID validation confirmed - no MongoDB ObjectIds in responses."
  - task: "Admin verify: POST /api/admin/verify"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Returns {ok:true} on correct key, 401 otherwise."
        - working: true
          agent: "testing"
          comment: "Automated testing completed - ALL TESTS PASSED (2/2). Verified: (1) POST /api/admin/verify with correct key (foodlens2025) returns 200 {ok:true}, (2) POST with wrong key returns 401. Endpoint working as expected."

frontend:
  - task: "Field sales landing with cinema demo + intake → onboarding flow"
    implemented: true
    working: "NA"
    file: "app/page.js, app/onboarding/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Visual screenshots verified at iPad viewport. Awaiting user field test."
  - task: "Presentation Mode (swipeable, ACV + Founding 100 focus)"
    implemented: true
    working: "NA"
    file: "app/presentation/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Visual screenshots verified."
  - task: "Admin dashboard"
    implemented: true
    working: "NA"
    file: "app/admin/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false

metadata:
  created_by: "main_agent"
  version: "1.3"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Leads API"
    - "Admin verify"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Backend exposes /api/leads (POST/GET) and /api/admin/verify. Admin key in env: ADMIN_KEY=foodlens2025. DB_NAME=foodlens. Please verify all API contracts including required field validation, admin-key gating, today filter, and CORS preflight."
  - agent: "testing"
    message: "Backend testing completed successfully. Executed comprehensive test suite with 14 test cases covering all endpoints and scenarios. RESULTS: 14/14 tests passed (100%). All API endpoints working correctly: health check, lead creation (full/minimal payloads), validation (missing fields return 400), authentication (header/query methods), authorization (401 for invalid/missing keys), today filter, admin verify, CORS preflight, and 404 handling. UUID v4 generation confirmed. No critical issues found. Backend is production-ready."
