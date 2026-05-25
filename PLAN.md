# Plan for Implementing Reddit-like Q&A Feature in Mentivo

## Overview
This plan outlines the implementation of a Q&A forum feature where students can ask questions and both students and mentors can answer questions. This feature will enhance community engagement and knowledge sharing within the Mentivo platform.

## Goals
1. Allow students to post questions on various topics related to JEE preparation
2. Allow both students and mentors to answer questions
3. Implement voting/upvoting system for questions and answers
4. Enable marking answers as accepted (by the question asker)
5. Integrate with existing authentication and user roles
6. Follow existing code patterns and architecture

## Implementation Approach

### 1. Database Schema Changes
Add new models to Prisma schema for:
- Question
- Answer
- Vote (for questions and answers)
- Tag (for categorizing questions)

### 2. Backend Implementation
- Create new controllers for questions and answers
- Add new routes in Express API
- Implement business logic for question/answer creation, voting, acceptance
- Add middleware for authorization (students can ask/answer, mentors can answer)

#### API Endpoint Details:
- **GET /questions** - Retrieve paginated list of questions with filtering options
  - Query params: page, limit, tag, sort (newest, popular, unanswered)
  - Response: Array of question objects with author info, vote counts, answer counts
  
- **POST /questions** - Create a new question (students only)
  - Body: { title, content, tags[] }
  - Response: Created question object
  
- **GET /questions/:id** - Get a specific question with detailed information
  - Response: Question object with full content, author details, vote counts
  
- **PUT /questions/:id** - Update a question (author only)
  - Body: { title, content, tags[] }
  - Response: Updated question object
  
- **DELETE /questions/:id** - Delete a question (author only)
  - Response: Success message
  
- **POST /questions/:id/answers** - Create an answer to a question (students and mentors)
  - Body: { content }
  - Response: Created answer object
  
- **GET /questions/:id/answers** - Retrieve answers for a specific question
  - Query params: page, limit, sort (newest, oldest, top)
  - Response: Array of answer objects with author info, vote counts, acceptance status
  
- **PUT /answers/:id** - Update an answer (author only)
  - Body: { content }
  - Response: Updated answer object
  
- **DELETE /answers/:id** - Delete an answer (author only)
  - Response: Success message
  
- **PUT /answers/:id/accept** - Mark an answer as accepted (question author only)
  - Response: Updated answer object with isAccepted: true
  
- **POST /questions/:id/vote** - Vote on a question (UPVOTE/DOWNVOTE)
  - Body: { voteType: "UPVOTE" | "DOWNVOTE" }
  - Response: Updated vote count and user's vote status
  
- **POST /answers/:id/vote** - Vote on an answer (UPVOTE/DOWNVOTE)
  - Body: { voteType: "UPVOTE" | "DOWNVOTE" }
  - Response: Updated vote count and user's vote status
  
- **GET /questions/:id/vote/status** - Get current user's vote status on a question
  - Response: { voteType: "UPVOTE" | "DOWNVOTE" | null }
  
- **GET /answers/:id/vote/status** - Get current user's vote status on an answer
  - Response: { voteType: "UPVOTE" | "DOWNVOTE" | null }

### 3. Frontend Implementation
- Create new screens for:
  - Question feed/list
  - Ask question form
  - Question detail view with answers
  - Answer form
- Integrate with existing navigation
- Use existing UI components and styling (NativeWind/Tailwind)

### 4. Integration Points
- Authentication: Use existing auth middleware
- User roles: Leverage existing UserRole enum
- Notifications: Potential integration with existing notification system
- Search: Consider integration with existing search capabilities

## Detailed Steps

### Phase 1: Database Schema
1. Add Question model with fields:
   - id (UUID)
   - title (string)
   - content (text)
   - authorId (relation to User)
   - createdAt, updatedAt
   - status (open/closed)
   - viewCount (integer)

2. Add Answer model with fields:
   - id (UUID)
   - content (text)
   - authorId (relation to User)
   - questionId (relation to Question)
   - createdAt, updatedAt
   - isAccepted (boolean)

3. Add Vote model for both questions and answers:
   - id (UUID)
   - userId (relation to User)
   - questionId (optional relation to Question)
   - answerId (optional relation to Answer)
   - voteType (UPVOTE/DOWNVOTE)
   - createdAt

4. Add Tag model for categorization:
   - id (UUID)
   - name (string)
   - questions (relation to Question)

### Phase 2: Backend API
1. Create question controller with methods:
   - createQuestion (student only)
   - getQuestions (paginated, with filters)
   - getQuestionById
   - updateQuestion (author only)
   - deleteQuestion (author only)

2. Create answer controller with methods:
   - createAnswer (students and mentors)
   - getAnswersForQuestion
   - updateAnswer (author only)
   - deleteAnswer (author only)
   - acceptAnswer (question author only)

3. Create vote controller:
   - voteOnQuestion
   - voteOnAnswer
   - getVoteStatus

4. Add routes:
   - GET /questions
   - POST /questions
   - GET /questions/:id
   - PUT /questions/:id
   - DELETE /questions/:id
   - POST /questions/:id/answers
   - PUT /answers/:id/accept
   - POST /questions/:id/vote
   - POST /answers/:id/vote

### Phase 3: Frontend Components
1. QuestionListScreen:
   - FlatList of questions
   - Filter by tags/sort options
   - Search functionality

2. AskQuestionScreen:
   - Form with title, content, tags
   - Submit button (only for authenticated students)

3. QuestionDetailScreen:
   - Question title and content
   - List of answers
   - Answer form (for authenticated users)
   - Vote buttons for question and answers
   - Accept answer button (for question author)

4. Navigation integration:
   - Add to bottom tab navigator or as nested screen
   - Consider adding to main navigation

### Phase 4: Styling and UI
- Use existing NativeWind/Tailwind classes
- Follow existing component patterns
- Create reusable components:
  - QuestionCard
  - AnswerCard
  - VoteButton
  - TagBadge

### Phase 5: Testing and Validation
- Unit tests for new API endpoints
- Integration tests for question/answer flows
- Manual testing on device
- Verify authorization rules work correctly

## Technical Considerations

### Authorization Rules
- Only students can create questions
- Both students and mentors can create answers
- Only question authors can accept answers
- Users can vote on questions/answers (with possible restrictions to prevent self-voting)
- Only authors can edit/delete their own questions/answers

### Data Relationships
- Questions belong to a user (author)
- Answers belong to a user (author) and a question
- Votes belong to a user and either a question or answer
- Tags can be associated with multiple questions

### Performance Considerations
- Pagination for question lists
- Efficient querying with proper indexing
- Caching strategies for frequently accessed questions
- Consider limiting nested comments (keep it simple: questions and answers only)

### Integration with Existing Systems
- Use existing auth middleware (`authenticateUser`)
- Leverage existing Prisma client setup
- Follow existing error handling patterns
- Use existing response formatting

## Timeline Estimate
1. Database schema and migrations: 2 days
2. Backend API implementation: 3 days
3. Frontend screens and navigation: 3 days
4. Integration and testing: 2 days
5. Buffer and refinements: 2 days
Total: ~12 days

## Risks and Mitigations
1. **Scope creep**: Keep feature focused on Q&A only initially
   - Mitigation: Define clear MVP scope, add advanced features later
   
2. **Performance issues with large datasets**:
   - Mitigation: Implement pagination, proper database indexing
   
3. **Moderation needs**:
   - Mitigation: Start with community voting, add moderation tools later if needed
   
4. **User adoption**:
   - Mitigation: Promote feature in app, integrate with existing user flows

## Dependencies
- Prisma for database operations
- Existing authentication system
- Existing navigation structure
- Existing UI component library

## Success Criteria
1. Students can successfully ask questions
2. Both students and mentors can answer questions
3. Voting system works correctly for questions and answers
4. Accepted answer functionality works
5. Data persists correctly and integrates with existing user profiles
6. UI is responsive and follows existing design patterns
7. Proper authorization prevents unauthorized actions