-- Create operation_audit_questions table
CREATE TABLE IF NOT EXISTS operation_audit_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) NOT NULL,
    question_text TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE operation_audit_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY op_audit_select_policy ON operation_audit_questions
    FOR SELECT USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY op_audit_insert_policy ON operation_audit_questions
    FOR INSERT WITH CHECK (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY op_audit_update_policy ON operation_audit_questions
    FOR UPDATE USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY op_audit_delete_policy ON operation_audit_questions
    FOR DELETE USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_op_audit_business_id ON operation_audit_questions(business_id);
CREATE INDEX IF NOT EXISTS idx_op_audit_status ON operation_audit_questions(status);
