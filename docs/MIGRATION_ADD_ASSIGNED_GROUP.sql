-- Migration: Add assigned_group columns to sessions and responses tables
-- Date: December 17, 2025
-- Purpose: Track experimental group assignment across all data collection points

-- ============================================================================
-- PART 1: Add assigned_group to sessions table
-- ============================================================================

-- Add the column (allows NULL initially for existing data)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS assigned_group INTEGER;

-- For existing rows, set assigned_group from participant table
UPDATE sessions s
SET assigned_group = p.assigned_group
FROM participants p
WHERE s.participant_id = p.participant_id
AND s.assigned_group IS NULL;

-- Now make it NOT NULL with constraint
ALTER TABLE sessions 
ALTER COLUMN assigned_group SET NOT NULL,
ADD CONSTRAINT sessions_assigned_group_check 
CHECK (assigned_group BETWEEN 1 AND 6);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_sessions_assigned_group 
ON sessions(assigned_group);

-- Add comment for documentation
COMMENT ON COLUMN sessions.assigned_group IS 
'Experimental group (1-6) assigned to this session. Should match participant.assigned_group.';


-- ============================================================================
-- PART 2: Add assigned_group to responses table
-- ============================================================================

-- Add the column (allows NULL initially for existing data)
ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS assigned_group INTEGER;

-- For existing rows, set assigned_group from session table
UPDATE responses r
SET assigned_group = s.assigned_group
FROM sessions s
WHERE r.session_id = s.id
AND r.assigned_group IS NULL;

-- If any responses don't have a session, try to get from participant
UPDATE responses r
SET assigned_group = p.assigned_group
FROM participants p
WHERE r.participant_id = p.participant_id
AND r.assigned_group IS NULL;

-- Now make it NOT NULL with constraint
ALTER TABLE responses 
ALTER COLUMN assigned_group SET NOT NULL,
ADD CONSTRAINT responses_assigned_group_check 
CHECK (assigned_group BETWEEN 1 AND 6);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_responses_assigned_group 
ON responses(assigned_group);

-- Add comment for documentation
COMMENT ON COLUMN responses.assigned_group IS 
'Experimental group (1-6) for this response. Should match participant.assigned_group and session.assigned_group.';


-- ============================================================================
-- PART 3: Verification queries
-- ============================================================================

-- Check for any null values (should return 0)
DO $$
DECLARE
  null_sessions INTEGER;
  null_responses INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_sessions FROM sessions WHERE assigned_group IS NULL;
  SELECT COUNT(*) INTO null_responses FROM responses WHERE assigned_group IS NULL;
  
  IF null_sessions > 0 THEN
    RAISE NOTICE 'WARNING: % sessions have null assigned_group', null_sessions;
  ELSE
    RAISE NOTICE 'SUCCESS: All sessions have assigned_group';
  END IF;
  
  IF null_responses > 0 THEN
    RAISE NOTICE 'WARNING: % responses have null assigned_group', null_responses;
  ELSE
    RAISE NOTICE 'SUCCESS: All responses have assigned_group';
  END IF;
END $$;


-- Verify consistency across tables (should return 0 rows)
SELECT 
  'MISMATCH: participant vs session' as issue,
  s.id as session_id,
  s.participant_id,
  p.assigned_group as participant_group,
  s.assigned_group as session_group
FROM sessions s
JOIN participants p ON s.participant_id = p.participant_id
WHERE p.assigned_group != s.assigned_group

UNION ALL

SELECT 
  'MISMATCH: session vs response' as issue,
  r.session_id::text,
  r.participant_id,
  s.assigned_group as session_group,
  r.assigned_group as response_group
FROM responses r
JOIN sessions s ON r.session_id = s.id
WHERE s.assigned_group != r.assigned_group

UNION ALL

SELECT 
  'MISMATCH: participant vs response' as issue,
  r.session_id::text,
  r.participant_id,
  p.assigned_group as participant_group,
  r.assigned_group as response_group
FROM responses r
JOIN participants p ON r.participant_id = p.participant_id
WHERE p.assigned_group != r.assigned_group;


-- Show summary statistics
SELECT 
  'sessions' as table_name,
  assigned_group,
  COUNT(*) as count
FROM sessions
GROUP BY assigned_group
ORDER BY assigned_group

UNION ALL

SELECT 
  'responses' as table_name,
  assigned_group,
  COUNT(*) as count
FROM responses
GROUP BY assigned_group
ORDER BY assigned_group;


-- ============================================================================
-- PART 4: Rollback script (in case of issues)
-- ============================================================================

/*
-- ROLLBACK SCRIPT - Run this if you need to undo the migration

-- Drop constraints
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_assigned_group_check;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_assigned_group_check;

-- Drop indexes
DROP INDEX IF EXISTS idx_sessions_assigned_group;
DROP INDEX IF EXISTS idx_responses_assigned_group;

-- Drop columns
ALTER TABLE sessions DROP COLUMN IF EXISTS assigned_group;
ALTER TABLE responses DROP COLUMN IF EXISTS assigned_group;

-- Verify rollback
\d sessions
\d responses
*/


-- ============================================================================
-- Migration complete
-- ============================================================================
