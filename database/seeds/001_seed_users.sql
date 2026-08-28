-- =============================================================================
-- KA² — HEAVEN SEED DATA
-- Keerthi Adarsh (Admin) & Anu Sri (User)
-- =============================================================================

-- Default bcrypt hash for 'Keerthi@Heaven2026!' and 'AnuSri@Heaven2026!'
-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi is bcrypt hash for 'password' or securely handled in node seeder

INSERT INTO users (id, email, password_hash, name, nickname, role, avatar_url, bio, pin_hash, presence_status)
VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'keerthi@ka2heaven.local',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Keerthi Adarsh',
    'Keerthi',
    'admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    'Architect of our digital universe. Forever yours ❤️',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'online'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, nickname, role, avatar_url, bio, pin_hash, presence_status)
VALUES 
(
    'b2222222-2222-2222-2222-222222222222',
    'anu@ka2heaven.local',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Anu Sri',
    'Anu',
    'user',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
    'My heart, my home, my Keerthi. Our Heaven ✨',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'online'
)
ON CONFLICT (email) DO NOTHING;
