-- =============================================================================
-- KA² — HEAVEN MASTER DATABASE SCHEMA (PostgreSQL)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    pin_hash VARCHAR(255),
    biometric_key TEXT,
    presence_status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (presence_status IN ('online', 'offline', 'typing', 'in_call')),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEVICES & SESSIONS TABLE
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(150) NOT NULL,
    device_type VARCHAR(20) NOT NULL DEFAULT 'web' CHECK (device_type IN ('ios', 'android', 'web', 'desktop')),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    refresh_token_hash VARCHAR(255),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'file')),
    media_url TEXT,
    thumbnail_url TEXT,
    media_meta JSONB,
    voice_meta JSONB,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 4. MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON message_reactions(message_id);

-- 5. CALLS TABLE
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    call_type VARCHAR(10) NOT NULL DEFAULT 'voice' CHECK (call_type IN ('voice', 'video')),
    status VARCHAR(20) NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'busy')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    recording_url TEXT,
    is_recorded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calls_caller_receiver ON calls(caller_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);

-- 6. MEMORIES TABLE
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    memory_date DATE NOT NULL,
    location VARCHAR(200),
    category VARCHAR(20) NOT NULL DEFAULT 'photos' CHECK (category IN ('photos', 'videos', 'voice', 'moments')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'audio')),
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_memory_date ON memories(memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_favorite ON memories(is_favorite);

-- 7. LOVE NOTES TABLE
CREATE TABLE IF NOT EXISTS love_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    stationery_style VARCHAR(50) NOT NULL DEFAULT 'romantic_parchment',
    photo_url TEXT,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_opened BOOLEAN NOT NULL DEFAULT false,
    opened_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_love_notes_receiver ON love_notes(receiver_id);

-- 8. VAULT ITEMS TABLE
CREATE TABLE IF NOT EXISTS vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_type VARCHAR(20) NOT NULL DEFAULT 'shared' CHECK (vault_type IN ('shared', 'personal')),
    title VARCHAR(200) NOT NULL,
    item_type VARCHAR(20) NOT NULL DEFAULT 'note' CHECK (item_type IN ('note', 'photo', 'video', 'document', 'secret')),
    encrypted_data TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL DEFAULT '',
    file_url TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_owner_type ON vault_items(owner_id, vault_type);

-- 9. TIMELINE MILESTONES TABLE
CREATE TABLE IF NOT EXISTS timeline_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    milestone_date DATE NOT NULL,
    month_year VARCHAR(30) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'milestone',
    icon VARCHAR(50) NOT NULL DEFAULT 'heart',
    media_url TEXT,
    related_memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
    related_love_note_id UUID REFERENCES love_notes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestones_date ON timeline_milestones(milestone_date DESC);

-- 10. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
