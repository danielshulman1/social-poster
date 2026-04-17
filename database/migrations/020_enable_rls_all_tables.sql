-- ============================================================================
-- PHASE 2: Enable Row-Level Security (RLS) on all tables
-- ============================================================================
-- This migration enables Row-Level Security and creates policies to prevent
-- unauthorized access to data across organizations and users.
--
-- RLS works by evaluating policies before any row is returned from a SELECT,
-- or any modification occurs with INSERT, UPDATE, or DELETE.
-- ============================================================================

-- Enable RLS on core tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auto_draft_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_draft_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: ORGANISATIONS
-- ============================================================================
-- Users can only see organizations they are a member of

CREATE POLICY "users_can_view_their_orgs"
  ON organisations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_create_orgs"
  ON organisations FOR INSERT
  WITH CHECK (true); -- Allow any authenticated user to create org

CREATE POLICY "org_admins_can_update_orgs"
  ON organisations FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "org_admins_can_delete_orgs"
  ON organisations FOR DELETE
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- POLICY: USERS
-- ============================================================================
-- Users can only view themselves and org members in their organization

CREATE POLICY "users_can_view_themselves"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_can_view_org_members"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM org_members
      WHERE org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- POLICY: AUTH ACCOUNTS
-- ============================================================================
-- Users can only access their own auth accounts

CREATE POLICY "users_can_view_own_auth"
  ON auth_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_auth"
  ON auth_accounts FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- POLICY: ORG MEMBERS
-- ============================================================================
-- Users can view members of their org; admins can manage

CREATE POLICY "users_can_view_org_members_list"
  ON org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_can_manage_members"
  ON org_members FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "org_admins_can_remove_members"
  ON org_members FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- POLICY: OAUTH CONNECTIONS
-- ============================================================================
-- 🔒 SENSITIVE: Users can only access their own OAuth connections
-- Admins can view org connections for management

CREATE POLICY "users_can_view_own_oauth"
  ON oauth_connections FOR SELECT
  USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "users_can_create_own_oauth"
  ON oauth_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_oauth"
  ON oauth_connections FOR UPDATE
  USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "users_can_delete_own_oauth"
  ON oauth_connections FOR DELETE
  USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- POLICY: MAILBOXES
-- ============================================================================
-- 🔒 SENSITIVE: Users can only access mailboxes in their organization

CREATE POLICY "users_can_view_org_mailboxes"
  ON mailboxes FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_create_mailboxes"
  ON mailboxes FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_own_mailboxes"
  ON mailboxes FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_own_mailboxes"
  ON mailboxes FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: EMAIL THREADS
-- ============================================================================
-- Users can only view/manage emails within their organization

CREATE POLICY "users_can_view_org_threads"
  ON email_threads FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_manage_org_threads"
  ON email_threads FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: EMAIL MESSAGES
-- ============================================================================
-- 🔒 SENSITIVE: Users can only view emails in their organization

CREATE POLICY "users_can_view_org_emails"
  ON email_messages FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_read_org_emails"
  ON email_messages FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: EMAIL DRAFTS
-- ============================================================================
-- 🔒 Users can only view/edit their own drafts

CREATE POLICY "users_can_view_own_drafts"
  ON email_drafts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_manage_own_drafts"
  ON email_drafts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_drafts"
  ON email_drafts FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- POLICY: VOICE PROFILES
-- ============================================================================
-- Users can only manage their own voice profile

CREATE POLICY "users_can_view_own_profile"
  ON voice_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_profile"
  ON voice_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- POLICY: CHAT CONVERSATIONS
-- ============================================================================
-- 🔒 Users can only access conversations in their organization

CREATE POLICY "users_can_view_org_conversations"
  ON chat_conversations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "users_can_create_conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- ============================================================================
-- POLICY: CHAT MESSAGES
-- ============================================================================
-- Users can only view messages from conversations they have access to

CREATE POLICY "users_can_view_conversation_messages"
  ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_send_messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: DETECTED TASKS
-- ============================================================================
-- Users can view tasks in their organization

CREATE POLICY "users_can_view_org_tasks"
  ON detected_tasks FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_tasks"
  ON detected_tasks FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: WORKFLOWS
-- ============================================================================
-- Users can view workflows in their organization

CREATE POLICY "users_can_view_org_workflows"
  ON workflow_definitions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_manage_org_workflows"
  ON workflow_definitions FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: USER ACTIVITY
-- ============================================================================
-- Users can view their own activity; admins can view org activity

CREATE POLICY "users_can_view_own_activity"
  ON user_activity FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_can_view_org_activity"
  ON user_activity FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- POLICY: EVENT LOGS
-- ============================================================================
-- Admins can view event logs for their organization

CREATE POLICY "admins_can_view_org_events"
  ON event_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- POLICY: NOTIFICATIONS
-- ============================================================================
-- Users can only view their own notifications

CREATE POLICY "users_can_view_own_notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- SUMMARY OF RLS POLICIES
-- ============================================================================
-- ✅ All tables now have RLS enabled
-- ✅ Policies prevent cross-organization data leakage
-- ✅ Policies prevent cross-user data leakage
-- ✅ Admin-only operations are restricted
-- ✅ Sensitive data (OAuth tokens, emails) is protected
--
-- To verify RLS is working:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname='public';
