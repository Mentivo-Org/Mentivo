-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "mentor_id" UUID NOT NULL,
    "agora_conv_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "is_in_call_chat" BOOLEAN NOT NULL DEFAULT false,
    "call_session_id" UUID,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "chat_session_id" UUID NOT NULL,
    "agora_msg_id" TEXT NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "msgType" VARCHAR(20) NOT NULL DEFAULT 'text',
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "validated_at" TIMESTAMP(3),
    "validation_result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_validation_rules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "ruleType" VARCHAR(50) NOT NULL,
    "pattern" TEXT,
    "config" JSONB,
    "action" VARCHAR(20) NOT NULL DEFAULT 'block',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_validation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rate_limits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 1,
    "windowType" VARCHAR(20) NOT NULL,

    CONSTRAINT "chat_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_agora_conv_id_key" ON "chat_sessions"("agora_conv_id");

-- CreateIndex
CREATE INDEX "chat_sessions_student_id_idx" ON "chat_sessions"("student_id");

-- CreateIndex
CREATE INDEX "chat_sessions_mentor_id_idx" ON "chat_sessions"("mentor_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_student_id_mentor_id_key" ON "chat_sessions"("student_id", "mentor_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_agora_msg_id_key" ON "chat_messages"("agora_msg_id");

-- CreateIndex
CREATE INDEX "chat_messages_chat_session_id_created_at_idx" ON "chat_messages"("chat_session_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_validation_rules_name_key" ON "chat_validation_rules"("name");

-- CreateIndex
CREATE INDEX "chat_rate_limits_user_id_windowType_idx" ON "chat_rate_limits"("user_id", "windowType");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rate_limits_user_id_windowType_window_start_key" ON "chat_rate_limits"("user_id", "windowType", "window_start");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
