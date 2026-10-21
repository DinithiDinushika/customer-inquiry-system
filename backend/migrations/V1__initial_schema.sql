-- V1: Initial Schema for Customer Inquiry Management System

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('agent', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inquiry_status AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table (Staff Accounts)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(120) NOT NULL,
    contact_info VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status inquiry_status NOT NULL DEFAULT 'NEW',
    
    -- Ownership & Assignment (Addresses 'who is handling a request')
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Optimistic Concurrency Control (Version tracking for stale data handling)
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON inquiries(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_by ON inquiries(created_by_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_search ON inquiries(customer_name, contact_info, subject);
