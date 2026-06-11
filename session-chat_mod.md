### 1. **Agora Chat Login Missing** - Frontend never logs into Agora Chat
| File | Issue |
|------|-------|
| `frontend/screens/RootNavigator.tsx` | No global Agora Chat initialization/login after user auth |
| `frontend/screens/chat/ChatListPage.tsx` | Doesn't call `getChatToken` + `login` before navigating to ChatPage |
| `frontend/screens/chat/ChatPage.tsx` | Assumes user is logged in; never calls `getChatToken`/`login` |

**Impact**: Users can't send/receive messages - SDK initialized but not authenticated.

---

### 2. **Rate Limiter Breaks Without Redis** - Dev Environment
| File | Issue |
|------|-------|
| `backend/src/services/chat/rateLimiter.ts` | Uses `redis.incr`, `redis.expire`, `redis.ttl` but mock Redis in `config/redis.ts` doesn't implement these methods |

**Impact**: Validation crashes in development without Redis.

---

### 3. **Mentor Chat Screens Missing**
| Missing Files |
|---------------|
| `frontend/screens/mentor/MentorChatListPage.tsx` |
| `frontend/screens/mentor/MentorChatPage.tsx` |

**Impact**: Mentors have no way to view/respond to chats (Chat tab uses shared `ChatListPage` but mentor-specific logic may be needed).

---

### 4. **Chat Session Manager Incomplete**
| File | Missing Methods |
|------|-----------------|
| `frontend/services/chat/chatSessionManager.ts` | `sendMessage()`, `blockUser()`, `reportMessage()`, `markAsRead()` |

**Impact**: Frontend can't call all backend chat endpoints.

---

### 5. **Controller Stubs Need Implementation**
| File | Methods to Implement |
|------|---------------------|
| `backend/src/controllers/chatController.ts` | `markAsRead` (stub), `blockUser` (stub), `reportMessage` (stub) |

---

## **Missing Files**

| Category | Files |
|----------|-------|
| **Frontend Screens** | `frontend/screens/mentor/MentorChatListPage.tsx`, `frontend/screens/mentor/MentorChatPage.tsx` |
| **Frontend Services** | `frontend/services/chat/chatSessionManager.ts` (add missing methods) |
| **Frontend Components** | Validation feedback UI (blocked message indicator, rate limit warning) |
| **Backend Admin** | `backend/src/routes/chatModeration.ts`, `backend/src/controllers/chatModerationController.ts` |

---

## **Incorrect/Incomplete Logic**

| File | Issue |
|------|-------|
| `backend/src/services/chat/agoraChatWebhook.ts` | Line 55: `getOrCreateSession(from, to, \`${from}_${to}\`)` - doesn't verify `from` is student BEFORE calling (relies on exception) |
| `backend/src/services/agoraChat.ts` | `fetchHistoryMessages` returns `[]` - should fetch from DB or implement Agora message log download |
| `backend/src/config/redis.ts` | Mock Redis missing `incr`, `expire`, `ttl` methods needed by rate limiter |
| `frontend/screens/chat/ChatPage.tsx` | Line 16: Uses `partnerId` but route params pass `mentorId` (ChatListPage line 46) - mismatch |

---

## **Configuration/Environment**

| Missing Env Vars |
|------------------|
| `AGORA_CHAT_WEBHOOK_SECRET` |
| `AGORA_CHAT_ORG_NAME` |
| `AGORA_CHAT_APP_NAME` |
| `CHAT_RATE_LIMIT_PER_MINUTE` |
| `AGORA_CHAT_REST_URL` |

---

## **Call-Chat Integration (Phase 3 Requirement)**

| Missing Integration |
|---------------------|
| Pre-call chat: Student can chat mentor before initiating call |
| In-call chat panel: Chat UI inside `InCallScreen` |
| Link chat session to call session: `chatSession.callSessionId` |
| `StudentChatPage` (Calls tab) → Navigate to `ChatListPage` |

---

## **Summary: Priority Order to Fix**

1. **Fix Redis mock** - Add `incr`, `expire`, `ttl` to mock Redis
2. **Add global Agora Chat login** - In `RootNavigator` after user auth
3. **Implement controller stubs** - `markAsRead`, `blockUser`, `reportMessage`
4. **Add missing mentor chat screens** - `MentorChatListPage`, `MentorChatPage`
5. **Complete chatSessionManager** - Add `sendMessage`, `blockUser`, `reportMessage`, `markAsRead`
6. **Fix ChatPage route param mismatch** - `mentorId` → `partnerId`
7. **Add call-chat integration** - Pre-call chat, in-call panel
8. **Add admin moderation endpoints** - For reviewing flagged messages
9. **Set environment variables** - Required for production



>>> POST /api/auth/fcm-token | IP: ::ffff:192.168.29.101
<<< POST /api/auth/fcm-token | Status: 200 | 1085ms
Agora registerUser error: {
  error: 'illegal_argument',
  exception: 'java.lang.IllegalArgumentException',
  timestamp: 1781121055027,
  duration: 0,
  error_description: 'username [5d4a4e81-11f6-4004-a9d1-06796691a14f] is not legal'
}
<<< GET /api/chat/token | Status: 200 | 2161ms
[Socket] User disconnected: 5d4a4e81-11f6-4004-a9d1-06796691a14f | Reason: transport close
!!! POST /api/auth/fcm-token | Connection closed prematurely