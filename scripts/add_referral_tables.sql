-- Migration Script: Add Referral Tracking and Customer Referral Codes
USE Beautify;

-- 1. Add referral_code and referred_by_id columns to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(40) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_id BIGINT,
ADD CONSTRAINT IF NOT EXISTS fk_users_referred_by FOREIGN KEY (referred_by_id) REFERENCES users(id);

-- 2. Create referrals tracking table if not exists
CREATE TABLE IF NOT EXISTS referrals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    referrer_id BIGINT NOT NULL,
    referred_user_id BIGINT NOT NULL UNIQUE,
    referral_code VARCHAR(40) NOT NULL,
    status ENUM('REGISTERED', 'COMPLETED') NOT NULL DEFAULT 'REGISTERED',
    first_order_id BIGINT NULL,
    reward_amount DECIMAL(12, 2) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6) NULL,
    INDEX idx_referral_referrer (referrer_id),
    INDEX idx_referral_code (referral_code),
    CONSTRAINT fk_referrals_referrer FOREIGN KEY (referrer_id) REFERENCES users(id),
    CONSTRAINT fk_referrals_referred_user FOREIGN KEY (referred_user_id) REFERENCES users(id),
    CONSTRAINT fk_referrals_first_order FOREIGN KEY (first_order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
