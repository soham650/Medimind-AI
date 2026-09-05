-- Seed Clinics
insert into public.clinics (id, name, speciality, location, rating) values
('clinic1', 'Apollo Cardiac Care', 'Cardiologist', 'Mumbai, India', 4.8),
('clinic2', 'Max Chest & Lung Clinic', 'Pulmonologist', 'Delhi, India', 4.6),
('clinic3', 'Fortis General Medicine', 'General Physician', 'Bangalore, India', 4.5)
on conflict (id) do nothing;

-- Seed Queues
insert into public.queues (clinic_id, current_number, waiting_list) values
('clinic1', 4, '{5,6}'),
('clinic2', 2, '{3,4}'),
('clinic3', 12, '{13,14,15}')
on conflict (clinic_id) do nothing;

-- Seed Specialists (19 Disease -> Specialist Mappings)
insert into public.specialists (disease, specialist_type) values
('Common Cold', 'General Physician'),
('Influenza', 'General Physician'),
('COVID-19', 'Pulmonologist'),
('Typhoid', 'General Physician'),
('Dengue', 'General Physician'),
('Malaria', 'General Physician'),
('Chikungunya', 'Rheumatologist'),
('Diabetes', 'Endocrinologist'),
('Hypertension', 'Cardiologist'),
('Coronary Heart Disease', 'Cardiologist'),
('Asthma', 'Pulmonologist'),
('Pneumonia', 'Pulmonologist'),
('Bronchitis', 'Pulmonologist'),
('Tuberculosis', 'Pulmonologist'),
('Gastritis', 'Gastroenterologist'),
('Food Poisoning', 'General Physician'),
('Jaundice', 'Hepatologist'),
('Allergic Rhinitis', 'Allergist / ENT'),
('Migraine', 'Neurologist')
on conflict (disease) do nothing;
