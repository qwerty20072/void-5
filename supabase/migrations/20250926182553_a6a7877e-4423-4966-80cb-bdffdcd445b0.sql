-- Update Fayaaz's profile to have comprehensive exam coverage like other tutors
UPDATE profiles 
SET 
  subjects = '{"exams": ["MAT", "ESAT", "TMUA", "Interview prep"]}',
  exam_rates = '{"MAT": 25, "ESAT": 25, "TMUA": 25, "Interview prep": 25}',
  updated_at = now()
WHERE name = 'Fayaaz';