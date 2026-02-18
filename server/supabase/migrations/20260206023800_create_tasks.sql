-- Create tasks table for task management
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL,
    task_title TEXT NOT NULL,
    task_description TEXT,
    task_type TEXT NOT NULL CHECK (task_type IN ('Ekip Görevi', 'Bireysel', 'Rol tabanlı')),
    recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('Tek Seferlik', 'Her Gün', 'Haftanın Belirli Günleri', 'Ayın Belirli Günleri', 'Günlük Çoklu Görevler')),
    recurrence_details JSONB DEFAULT '{}',
    assigned_to JSONB DEFAULT '[]',
    priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Acil')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tasks_select_policy ON tasks
    FOR SELECT USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY tasks_insert_policy ON tasks
    FOR INSERT WITH CHECK (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY tasks_update_policy ON tasks
    FOR UPDATE USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY tasks_delete_policy ON tasks
    FOR DELETE USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

-- Create index for better query performance
CREATE INDEX idx_tasks_business_id ON tasks(business_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
