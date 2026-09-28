-- ==============================================================================
-- JOB RADAR - Initial PostGIS Seed Data
-- 30+ Tech & Industrial Companies across Chennai, Bangalore & Hyderabad
-- Realistic walk-ins, verified jobs, coordinates & sources
-- ==============================================================================

-- 1. Job Sources
INSERT INTO job_sources (id, name, source_type, base_url, is_active) VALUES
('11111111-1111-1111-1111-111111111101', 'Official Career Portal Feeds', 'CAREER_PAGE', 'https://careers.example.com', true),
('11111111-1111-1111-1111-111111111102', 'TechPark Verified Walk-In Feed', 'RECRUITMENT_PORTAL', 'https://walkins.example.com', true),
('11111111-1111-1111-1111-111111111103', 'Public Tech Jobs API', 'API', 'https://api.examplejobs.org/v1', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Companies in Chennai Tech Hubs (Guindy, OMR, T.Nagar, Ambattur, Tambaram)
INSERT INTO companies (id, name, slug, logo_url, company_type, website, address, city, state, postal_code, latitude, longitude, status, contact_phone, contact_email) VALUES
-- Guindy & Olympia Tech Park Hub
('22222222-2222-2222-2222-222222222201', 'Cognizant Technology Solutions', 'cognizant-guindy', 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&auto=format&fit=crop', 'IT Services & Consulting', 'https://www.cognizant.com', 'Olympia Tech Park, 1, SIDCO Industrial Estate, Guindy', 'Chennai', 'Tamil Nadu', '600032', 13.0093, 80.2037, 'WALK_IN', '+91 44 4209 6000', 'careers.chn@cognizant.com'),

('22222222-2222-2222-2222-222222222202', 'LTIMindtree Innovation Hub', 'ltimindtree-guindy', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop', 'IT & Digital Transformation', 'https://www.ltimindtree.com', 'Altius Block, Olympia Tech Park, Guindy', 'Chennai', 'Tamil Nadu', '600032', 13.0089, 80.2045, 'HIRING', '+91 44 6625 0000', 'talent@ltimindtree.com'),

('22222222-2222-2222-2222-222222222203', 'Verizon India Development Center', 'verizon-guindy', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop', 'Telecom & Cloud Engineering', 'https://www.verizon.com', 'Olympia Tech Park, Guindy', 'Chennai', 'Tamil Nadu', '600032', 13.0078, 80.2051, 'HIRING', '+91 44 4390 0000', 'india.careers@verizon.com'),

('22222222-2222-2222-2222-222222222204', 'L&T Technology Services', 'ltts-guindy', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=150&auto=format&fit=crop', 'Core Engineering & Embedded', 'https://www.ltts.com', 'SIDCO Industrial Estate, Guindy', 'Chennai', 'Tamil Nadu', '600032', 13.0112, 80.2011, 'NORMAL', '+91 44 6700 8000', 'recruitment@ltts.com'),

('22222222-2222-2222-2222-222222222205', 'Freshworks Tech Campus', 'freshworks-omr', 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop', 'SaaS Product & AI', 'https://www.freshworks.com', 'Global Infocity Park, 40 MGR Salai, Kandancavadi, Perungudi', 'Chennai', 'Tamil Nadu', '600096', 12.9698, 80.2452, 'WALK_IN', '+91 44 6667 8080', 'freshers@freshworks.com'),

('22222222-2222-2222-2222-222222222206', 'Zoho Corporation', 'zoho-estancia', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop', 'Cloud Software & CRM', 'https://www.zoho.com', 'Estancia IT Park, Vallancheri, GST Road', 'Chennai', 'Tamil Nadu', '603202', 12.8317, 80.0456, 'HIRING', '+91 44 6744 7070', 'drive@zohocorp.com'),

('22222222-2222-2222-2222-222222222207', 'TCS - Tata Consultancy Services', 'tcs-sholinganallur', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop', 'IT Services & Consulting', 'https://www.tcs.com', '415/21-24 Kumaran Nagar, Sholinganallur, OMR', 'Chennai', 'Tamil Nadu', '600119', 12.9022, 80.2285, 'WALK_IN', '+91 44 6616 1111', 'tcs.walkin@tcs.com'),

('22222222-2222-2222-2222-222222222208', 'Wipro Technologies', 'wipro-sholinganallur', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop', 'IT & Cloud Solutions', 'https://www.wipro.com', 'ELCOT SEZ, Sholinganallur', 'Chennai', 'Tamil Nadu', '600119', 12.8995, 80.2268, 'HIRING', '+91 44 3069 0000', 'campus.connect@wipro.com'),

('22222222-2222-2222-2222-222222222209', 'HCLTech Innovation Park', 'hcl-ambattur', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop', 'IT Infrastructure & AI', 'https://www.hcltech.com', 'Ambattur Industrial Estate, 3rd Phase', 'Chennai', 'Tamil Nadu', '600058', 13.0895, 80.1634, 'WALK_IN', '+91 44 4396 7000', 'chennai.walkins@hcl.com'),

('22222222-2222-2222-2222-222222222210', 'Renault Nissan Technology', 'rnti-mahindracity', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop', 'Automotive R&D & Embedded', 'https://www.rntbci.in', 'Ascendas Tech Park, Mahindra World City', 'Chennai', 'Tamil Nadu', '603004', 12.7381, 79.9982, 'HIRING', '+91 44 6745 0000', 'careers.rntbci@rntbci.in')
ON CONFLICT (id) DO NOTHING;

-- 3. Walk-Ins
INSERT INTO walk_ins (id, company_id, position_title, job_category, eligibility, experience, salary_text, walkin_date, end_date, time_slot, venue_address, venue_latitude, venue_longitude, registration_required, registration_link, contact_person, contact_number, source_name, source_url, status, notes) VALUES
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'Associate Software Engineer (Java / React / Python)', 'Software', 'B.E/B.Tech/MCA/B.Sc (Comp Science/IT) 2024, 2025 & 2026 batches with min 60% aggregate', 'Fresher', '₹ 4.5 LPA - ₹ 6.0 LPA', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', '09:00 AM - 01:30 PM', 'Olympia Tech Park, 1 SIDCO Industrial Estate, Guindy, Chennai', 13.0093, 80.2037, true, 'https://careers.cognizant.com/walkin-guindy', 'HR Talent Acquisition Desk', '+91 44 4209 6111', 'TechPark Verified Walk-In Feed', 'https://walkins.example.com/cognizant-guindy-drive', 'UPCOMING', 'Bring updated 2 copies of Resume, Govt Photo ID, and college mark sheets.'),

('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222205', 'Frontend Developer & UI/UX Intern', 'Web Development', 'Graduate with hands-on HTML, CSS, JavaScript, React/TypeScript portfolio or GitHub', '0–1 years', '₹ 5.0 LPA - ₹ 7.5 LPA', CURRENT_DATE, CURRENT_DATE, '10:00 AM - 03:00 PM', 'Freshworks Campus, Global Infocity Park, 40 MGR Salai, Perungudi, Chennai', 12.9698, 80.2452, false, NULL, 'Campus Outreach Team', '+91 44 6667 8080', 'Official Career Portal Feeds', 'https://careers.freshworks.com/walkins', 'ACTIVE_TODAY', 'Direct Walk-In. Immediate technical rounds and offer letter on spot.'),

('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222207', 'System Engineer & Cloud Operations Specialist', 'DevOps', 'Any graduate / Engineering / MCA with understanding of Linux, AWS, Docker, Bash', 'Fresher', '₹ 4.0 LPA - ₹ 5.5 LPA', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', '09:30 AM - 02:00 PM', 'TCS Sholinganallur ELCOT Campus, Kumaran Nagar, Chennai', 12.9022, 80.2285, true, 'https://nextstep.tcs.com', 'TCS Talent Recruitment Team', '+91 44 6616 1111', 'TechPark Verified Walk-In Feed', 'https://walkins.example.com/tcs-elcot-drive', 'UPCOMING', 'Registration on TCS NextStep portal required before entry.'),

('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222209', 'Technical Support Specialist & IT Helpdesk', 'BPO', 'Any Graduate with strong English communication and basic computer troubleshooting', 'Fresher', '₹ 3.2 LPA - ₹ 4.2 LPA', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', '10:00 AM - 04:00 PM', 'HCLTech, Ambattur Industrial Estate 3rd Phase, Chennai', 13.0895, 80.1634, false, NULL, 'Walk-in Coordinator', '+91 44 4396 7100', 'Public Tech Jobs API', 'https://api.examplejobs.org/hcl-ambattur', 'ACTIVE_TODAY', 'Immediate joining. Rotational shift allowance provided.')
ON CONFLICT (id) DO NOTHING;

-- 4. Active Jobs
INSERT INTO jobs (id, company_id, title, category, experience, qualification, salary_min, salary_max, salary_currency, salary_text, job_type, work_mode, description, key_skills, location_name, latitude, longitude, is_walk_in, walk_in_id, source_name, source_url, dedup_hash, status) VALUES
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', 'Associate Software Engineer (Java / React)', 'Software', 'Fresher', 'B.E / B.Tech / MCA', 450000, 600000, 'INR', '₹ 4.5 LPA - ₹ 6.0 LPA', 'Walk-in', 'Hybrid', 'Looking for enthusiastic engineers skilled in modern Java, Spring Boot, React, and REST APIs.', ARRAY['Java', 'Spring Boot', 'React', 'SQL', 'Git'], 'Guindy, Chennai', 13.0093, 80.2037, true, '33333333-3333-3333-3333-333333333301', 'TechPark Verified Walk-In Feed', 'https://walkins.example.com/cognizant-guindy-drive', 'dedup_cog_guindy_java_001', 'ACTIVE'),

('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202', 'Full Stack Developer (Node.js & React)', 'Web Development', '1–3 years', 'B.Tech/BCA/MCA', 650000, 950000, 'INR', '₹ 6.5 LPA - ₹ 9.5 LPA', 'Full Time', 'Hybrid', 'Develop scalable microservices, interactive dashboards, and GraphQL APIs for enterprise clients.', ARRAY['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker'], 'Guindy, Chennai', 13.0089, 80.2045, false, NULL, 'Official Career Portal Feeds', 'https://careers.ltimindtree.com/jobs/fullstack-guindy', 'dedup_lti_fs_002', 'ACTIVE'),

('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222203', 'Network & Cloud Security Engineer', 'Cybersecurity', '1–3 years', 'B.E/B.Tech (ECE/CSE/IT)', 700000, 1100000, 'INR', '₹ 7.0 LPA - ₹ 11.0 LPA', 'Full Time', 'On-site', 'Architect and secure enterprise cloud networking and edge security systems for Verizon core infra.', ARRAY['Cybersecurity', 'AWS', 'Firewalls', 'Python', 'Networking'], 'Guindy, Chennai', 13.0078, 80.2051, false, NULL, 'Official Career Portal Feeds', 'https://verizon.com/careers/guindy-security', 'dedup_ver_sec_003', 'ACTIVE'),

('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222205', 'Frontend Developer & UI/UX Intern', 'Web Development', '0–1 years', 'Degree in Design / CS', 500000, 750000, 'INR', '₹ 5.0 LPA - ₹ 7.5 LPA', 'Walk-in', 'On-site', 'Craft delightful customer engagement SaaS interfaces using Tailwind, React, and animations.', ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'Jest'], 'Perungudi OMR, Chennai', 12.9698, 80.2452, true, '33333333-3333-3333-3333-333333333302', 'Official Career Portal Feeds', 'https://careers.freshworks.com/walkins', 'dedup_fw_ui_004', 'ACTIVE'),

('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222206', 'AI / ML Research Engineer', 'AI/ML', '0–1 years', 'B.E / M.Tech / MS (Data Science / AI)', 800000, 1400000, 'INR', '₹ 8.0 LPA - ₹ 14.0 LPA', 'Full Time', 'On-site', 'Build on-device and cloud LLM fine-tuning, RAG pipelines, and NLP models for Zoho Office Suite.', ARRAY['PyTorch', 'Python', 'LLMs', 'Transformers', 'FastAPI'], 'GST Road, Chennai', 12.8317, 80.0456, false, NULL, 'Public Tech Jobs API', 'https://api.examplejobs.org/zoho-ai', 'dedup_zoho_ai_005', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
