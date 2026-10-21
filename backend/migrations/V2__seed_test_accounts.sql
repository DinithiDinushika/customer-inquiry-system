-- V2: Seed Staff Accounts and Initial Inquiries

-- 1. Seed Staff Users (Password for all is 'Password123!')
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES 
    (
        'a0000000-0000-0000-0000-000000000001',
        'admin@coffeeninja.com',
        '$2b$10$TTE0eewKPI16czagOSJHeeFXnDjXCzIJ1xHE9QntYFQALCIa3byly',
        'Ellen Ripley',
        'admin'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'agent1@coffeeninja.com',
        '$2b$10$TTE0eewKPI16czagOSJHeeFXnDjXCzIJ1xHE9QntYFQALCIa3byly',
        'Sarah Connor',
        'agent'
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'agent2@coffeeninja.com',
        '$2b$10$TTE0eewKPI16czagOSJHeeFXnDjXCzIJ1xHE9QntYFQALCIa3byly',
        'John Doe',
        'agent'
    )
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Initial Inquiries for Testing
INSERT INTO inquiries (
    id, customer_name, contact_info, subject, description, status, created_by_id, assigned_to_id, version, created_at
)
VALUES 
    (
        'b0000000-0000-0000-0000-000000000001',
        'Alice Johnson',
        'alice.j@example.com',
        'Inquiry about Enterprise Catering Package',
        'We would like a quote for a weekly 50-person morning coffee and pastry catering service starting next month.',
        'NEW',
        'a0000000-0000-0000-0000-000000000002',
        NULL,
        1,
        NOW() - INTERVAL '2 hours'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'Michael Smith',
        '+1 555-019-2834',
        'Cold Brew Machine Calibration Issue',
        'The nitro tap is producing excess foam and pressure seems unstable. Needs urgent technician guidance.',
        'IN_PROGRESS',
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        1,
        NOW() - INTERVAL '5 hours'
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'David Miller',
        'david.miller@techhub.io',
        'Single Origin Espresso Beans Order Confirmation',
        'Customer asked for tracking number for invoice #4829. Dispatched via Express Courier.',
        'RESOLVED',
        'a0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        2,
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;
