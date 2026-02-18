-- Create operation_audit_surveys table
CREATE TABLE IF NOT EXISTS operation_audit_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for surveys
ALTER TABLE operation_audit_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY op_survey_select_policy ON operation_audit_surveys
    FOR SELECT USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY op_survey_insert_policy ON operation_audit_surveys
    FOR INSERT WITH CHECK (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY op_survey_update_policy ON operation_audit_surveys
    FOR UPDATE USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

CREATE POLICY op_survey_delete_policy ON operation_audit_surveys
    FOR DELETE USING (business_id = (current_setting('request.jwt.claims', true)::json->>'business_id')::uuid);

-- Create operation_audit_responses table
CREATE TABLE IF NOT EXISTS operation_audit_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES operation_audit_surveys(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES operation_audit_questions(id),
    question_text TEXT NOT NULL,
    weight INTEGER NOT NULL,
    is_yes BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Note: responses don't necessarily need business_id if they are always accessed via survey_id
-- But for extra security, we rely on the survey permissions.
ALTER TABLE operation_audit_responses ENABLE ROW LEVEL SECURITY;

-- Policy for responses: User can see/manage responses if they own the parent survey
CREATE POLICY op_response_policy ON operation_audit_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM operation_audit_surveys s
            WHERE s.id = survey_id
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_op_survey_business_id ON operation_audit_surveys(business_id);
CREATE INDEX IF NOT EXISTS idx_op_response_survey_id ON operation_audit_responses(survey_id);
