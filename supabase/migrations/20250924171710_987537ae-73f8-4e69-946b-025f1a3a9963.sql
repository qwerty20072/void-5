-- Update Pranav's rates to £25 for all exams
UPDATE profiles 
SET exam_rates = '{"TMUA": 25, "MAT": 25, "ESAT": 25, "Interview prep": 25}'::jsonb
WHERE name = 'Pranav' AND user_type = 'tutor';

-- Update Vincent's rates to £35 for all exams  
UPDATE profiles 
SET exam_rates = '{"TMUA": 35, "MAT": 35, "ESAT": 35, "Interview prep": 35}'::jsonb
WHERE name = 'Vincent' AND user_type = 'tutor';