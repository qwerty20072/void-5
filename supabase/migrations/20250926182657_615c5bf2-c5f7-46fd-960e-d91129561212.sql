-- Update Fayaaz's profile to only tutor interview prep but maintain consistent styling
UPDATE profiles 
SET 
  subjects = '{"exams": ["Interview prep"]}',
  exam_rates = '{"Interview prep": 25}',
  updated_at = now()
WHERE name = 'Fayaaz';