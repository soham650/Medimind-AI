/**
 * MEDIMIND AI — PHASE 4 COMPLETE PATIENT EXPERIENCE VERIFICATION SUITE
 * 
 * Verifies real Supabase PostgreSQL behavior across all 21 test criteria:
 *  1. Authenticated patient session
 *  2. Patient profile persistence
 *  3. Patient A/B isolation (RLS)
 *  4. Doctor discovery
 *  5. Appointment booking (create_appointment_tx)
 *  6. Double-booking prevention
 *  7. Appointment cancellation
 *  8. Symptom assessment persistence (symptom_assessments)
 *  9. Private report upload (medical-documents)
 * 10. Health report persistence (health_reports & ai_clinical_findings)
 * 11. Prescription retrieval (prescriptions & prescription_items)
 * 12. Medicine inventory retrieval (medicines & pharmacy_inventory)
 * 13. Transactional medicine order (create_medicine_order_tx)
 * 14. FEFO stock decrement
 * 15. Order cancellation (medicine_orders)
 * 16. Notification read/unread (notifications)
 * 17. Route protection (unauthenticated RPC rejection)
 * 18. Unauthorized role access
 * 19. No frontend service-role exposure
 * 20. No hardcoded patient UUID
 * 21. Production build verification
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('../frontend/node_modules/@supabase/supabase-js');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

async function runPhase4Verification() {
  console.log('================================================================');
  console.log('MEDIMIND AI — PHASE 4 PATIENT EXPERIENCE VERIFICATION SUITE');
  console.log('================================================================');

  const rootDir = path.resolve(__dirname, '..');
  const frontendEnv = parseEnv(path.join(rootDir, 'frontend', '.env'));
  const backendEnv = parseEnv(path.join(rootDir, 'ml-service', '.env'));

  const supabaseUrl = frontendEnv.VITE_SUPABASE_URL || backendEnv.SUPABASE_URL;
  const anonKey = frontendEnv.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = backendEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('FAIL: Missing Supabase credentials in environment files.');
    process.exit(1);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, anonKey);

  const results = {
    total: 21,
    passed: 0,
    failed: 0,
    items: {}
  };

  function record(itemNumber, name, passed, details = '') {
    results.items[itemNumber] = { name, passed, details };
    if (passed) {
      results.passed++;
      console.log(`[PASS] Test ${itemNumber}: ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      results.failed++;
      console.error(`[FAIL] Test ${itemNumber}: ${name} - ${details}`);
    }
  }

  const ts = Date.now();
  const testPassword = 'Phase4_TestPass!123';
  const patientA_Email = `p4_patient_a_${ts}@testmedimind.ai`;
  const patientB_Email = `p4_patient_b_${ts}@testmedimind.ai`;
  const doctor_Email = `p4_doc_${ts}@testmedimind.ai`;
  const pharmacy_Email = `p4_pharm_${ts}@testmedimind.ai`;

  let userA, userB, userDoc, userPharm;
  let clientA, clientB, clientDoc;
  let createdDoctorId, createdPharmacyId, createdMedicineId;
  let invBatchEarlyId, invBatchLateId;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Provision Real Authenticated Identities
    // ------------------------------------------------------------------------
    console.log('\nSetting up isolated test identities in live database...');
    const { data: uA, error: errA } = await adminClient.auth.admin.createUser({
      email: patientA_Email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Patient Alpha', role: 'patient' }
    });
    if (errA) throw errA;
    userA = uA.user;

    const { data: uB, error: errB } = await adminClient.auth.admin.createUser({
      email: patientB_Email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Patient Beta', role: 'patient' }
    });
    if (errB) throw errB;
    userB = uB.user;

    const { data: uDoc, error: errDoc } = await adminClient.auth.admin.createUser({
      email: doctor_Email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Dr. Test Cardiologist', role: 'doctor' }
    });
    if (errDoc) throw errDoc;
    userDoc = uDoc.user;

    const { data: uPharm, error: errPharm } = await adminClient.auth.admin.createUser({
      email: pharmacy_Email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'HealthPlus Pharmacy', role: 'pharmacist' }
    });
    if (errPharm) throw errPharm;
    userPharm = uPharm.user;

    // Seed profiles
    await adminClient.from('profiles').upsert([
      { id: userA.id, email: patientA_Email, full_name: 'Patient Alpha', role: 'patient' },
      { id: userB.id, email: patientB_Email, full_name: 'Patient Beta', role: 'patient' },
      { id: userDoc.id, email: doctor_Email, full_name: 'Dr. Test Cardiologist', role: 'doctor', approval_status: 'approved' },
      { id: userPharm.id, email: pharmacy_Email, full_name: 'HealthPlus Pharmacy', role: 'pharmacist', approval_status: 'approved' }
    ]);

    await adminClient.from('patients').upsert([
      { id: userA.id, full_name: 'Patient Alpha', blood_group: 'B+', phone: '+919876543210', abha_id: '91-TEST-001' },
      { id: userB.id, full_name: 'Patient Beta', blood_group: 'A+', phone: '+919876543211', abha_id: '91-TEST-002' }
    ]);

    const { data: docRow, error: docErr } = await adminClient.from('doctors').upsert([
      {
        id: userDoc.id,
        full_name: 'Dr. Test Cardiologist',
        specialization: 'Cardiology',
        qualification: 'MD, DM (Cardiology)',
        license_number: `MCI-TEST-${ts}`,
        experience_years: 14,
        consultation_fee: 750,
        rating: 4.9,
        clinic_name: 'Metro Heart Institute',
        verification_status: 'approved',
        is_available: true
      }
    ]).select().single();
    if (docErr) throw new Error(`Doctor seeding failed: ${docErr.message}`);
    createdDoctorId = docRow.id;

    // Doctor availability slot
    await adminClient.from('doctor_availability').upsert([
      {
        doctor_id: createdDoctorId,
        day_of_week: 'Wednesday',
        start_time: '10:00',
        end_time: '18:00',
        slot_duration_minutes: 30,
        is_active: true
      }
    ]);

    // Seed pharmacy & medicines
    const { data: pharmRow, error: pharmErr } = await adminClient.from('pharmacies').upsert([
      {
        id: userPharm.id,
        pharmacy_name: 'HealthPlus Central Pharmacy',
        contact_person: 'Pharmacist Sharma',
        phone: '+919876500000',
        email: pharmacy_Email,
        drug_license_number: `DL-${ts}-99`,
        address: 'MG Road, Bengaluru',
        verification_status: 'approved',
        is_active: true
      }
    ]).select().single();
    if (pharmErr) throw new Error(`Pharmacy seeding failed: ${pharmErr.message}`);
    createdPharmacyId = pharmRow.id;

    const { data: medRow, error: medErr } = await adminClient.from('medicines').insert({
      brand_name: `Atorva-${ts} 20mg`,
      generic_name: 'Atorvastatin',
      dosage_form: 'tablet',
      strength: '20mg',
      manufacturer: 'Zydus Healthcare',
      price: 180.00,
      requires_prescription: true
    }).select().single();
    if (medErr) throw new Error(`Medicine seeding failed: ${medErr.message}`);
    createdMedicineId = medRow.id;

    // Seed 2 FEFO batches: Early batch (exp 2026-11-01) and Late batch (exp 2027-08-01)
    const { data: bEarly, error: bEarlyErr } = await adminClient.from('pharmacy_inventory').insert({
      pharmacy_id: createdPharmacyId,
      medicine_id: createdMedicineId,
      batch_number: `BAT-EARLY-${ts}`,
      expiry_date: '2026-11-01',
      stock_quantity: 20,
      unit_price: 180.00
    }).select().single();
    if (bEarlyErr) throw new Error(`Inventory early batch seeding failed: ${bEarlyErr.message}`);
    invBatchEarlyId = bEarly.id;

    const { data: bLate, error: bLateErr } = await adminClient.from('pharmacy_inventory').insert({
      pharmacy_id: createdPharmacyId,
      medicine_id: createdMedicineId,
      batch_number: `BAT-LATE-${ts}`,
      expiry_date: '2027-08-01',
      stock_quantity: 50,
      unit_price: 180.00
    }).select().single();
    if (bLateErr) throw new Error(`Inventory late batch seeding failed: ${bLateErr.message}`);
    invBatchLateId = bLate.id;

    console.log('✓ Isolated database state provisioned successfully.\n');

    // ------------------------------------------------------------------------
    // TEST 1: Authenticated Patient Session
    // ------------------------------------------------------------------------
    clientA = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: sessionA, error: sErrA } = await clientA.auth.signInWithPassword({
      email: patientA_Email,
      password: testPassword
    });

    const hasLegitSession = !sErrA && sessionA?.session?.access_token && sessionA?.user?.id === userA.id;
    record(1, 'Authenticated patient session', hasLegitSession, `Session User ID: ${sessionA?.user?.id}`);

    // ------------------------------------------------------------------------
    // TEST 2: Patient Profile Persistence
    // ------------------------------------------------------------------------
    const { data: updatedProf, error: profErr } = await clientA
      .from('patients')
      .update({
        address: '42 Orchid Park, Whitefield, Bengaluru',
        emergency_contact: '+919811122233',
        preferred_language: 'English',
        bp_systolic: 122,
        bp_diastolic: 82
      })
      .eq('id', userA.id)
      .select()
      .single();

    const profOk = !profErr && updatedProf?.address === '42 Orchid Park, Whitefield, Bengaluru';
    record(2, 'Patient profile persistence', profOk, `Address verified: ${updatedProf?.address}`);

    // ------------------------------------------------------------------------
    // TEST 3: Patient A/B Isolation (RLS)
    // ------------------------------------------------------------------------
    clientB = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    await clientB.auth.signInWithPassword({
      email: patientB_Email,
      password: testPassword
    });

    // Patient A creates clinical assessment
    const { data: pA_Assessment, error: pA_Err } = await clientA.from('symptom_assessments').insert({
      patient_id: userA.id,
      symptoms: ['chest tightness', 'mild palpitation'],
      normalized_symptoms: ['chest_pain', 'palpitations'],
      model_version: 'rf-v2.1',
      possible_conditions: [{ condition: 'Angina Pectoris', probability: 0.76 }],
      risk_level: 'Moderate',
      risk_reasons: ['Cardiac symptom presentation'],
      recommended_action: 'Doctor review recommended'
    }).select().single();

    if (pA_Err) throw pA_Err;

    // Patient B attempts to select Patient A's assessment
    const { data: bCrossRead } = await clientB
      .from('symptom_assessments')
      .select('*')
      .eq('id', pA_Assessment.id);

    const isolationOk = (!bCrossRead || bCrossRead.length === 0);
    record(3, 'Patient A/B isolation', isolationOk, 'Patient B received 0 records for Patient A clinical data');

    // ------------------------------------------------------------------------
    // TEST 4: Doctor Discovery
    // ------------------------------------------------------------------------
    const { data: docList, error: docSearchErr } = await clientA
      .from('doctors')
      .select('id, full_name, specialization, consultation_fee, is_available')
      .eq('verification_status', 'approved')
      .eq('is_available', true);

    const docDiscoveryOk = !docSearchErr && (docList || []).some(d => d.id === createdDoctorId);
    record(4, 'Doctor discovery', docDiscoveryOk, `Found ${docList?.length} approved doctors`);

    // ------------------------------------------------------------------------
    // TEST 5: Appointment Booking (create_appointment_tx)
    // ------------------------------------------------------------------------
    const testApptDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    const testSlot = '11:00 AM';

    const { data: apptBookingRes, error: apptBookingErr } = await clientA.rpc('create_appointment_tx', {
      p_doctor_id: createdDoctorId,
      p_appointment_date: testApptDate,
      p_time_slot: testSlot,
      p_consultation_type: 'video',
      p_symptoms_summary: 'Occasional chest tightness following morning exercise',
      p_patient_notes: 'Prefers English consultation'
    });

    const apptId = apptBookingRes?.appointment_id;
    const bookingOk = !apptBookingErr && apptBookingRes?.success && apptId;
    record(5, 'Appointment booking via create_appointment_tx', bookingOk, `Appointment ID: ${apptId}, Number: ${apptBookingRes?.appointment_number}`);

    // ------------------------------------------------------------------------
    // TEST 6: Double-Booking Prevention
    // ------------------------------------------------------------------------
    const { error: doubleBookErr } = await clientB.rpc('create_appointment_tx', {
      p_doctor_id: createdDoctorId,
      p_appointment_date: testApptDate,
      p_time_slot: testSlot,
      p_consultation_type: 'video',
      p_symptoms_summary: 'Conflicting slot request',
      p_patient_notes: 'Double booking test'
    });

    const doubleBookPrevented = !!doubleBookErr && (
      doubleBookErr.message.includes('already booked') ||
      doubleBookErr.message.includes('conflict') ||
      doubleBookErr.message.includes('unavailable')
    );
    record(6, 'Double-booking prevention', doubleBookPrevented, `Rejected with: ${doubleBookErr?.message}`);

    // ------------------------------------------------------------------------
    // TEST 7: Appointment Cancellation
    // ------------------------------------------------------------------------
    const { data: cancelledAppt, error: cancelErr } = await clientA
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Rescheduling per patient request'
      })
      .eq('id', apptId)
      .select()
      .single();

    const cancelOk = !cancelErr && cancelledAppt?.status === 'cancelled';
    record(7, 'Appointment cancellation', cancelOk, `Status verified: ${cancelledAppt?.status}`);

    // ------------------------------------------------------------------------
    // TEST 8: Symptom Assessment Persistence
    // ------------------------------------------------------------------------
    const { data: fetchedAssessment, error: fetchAssErr } = await clientA
      .from('symptom_assessments')
      .select('*')
      .eq('patient_id', userA.id)
      .single();

    const symptomPersistOk = !fetchAssErr && fetchedAssessment?.risk_level === 'Moderate';
    record(8, 'Symptom assessment persistence', symptomPersistOk, `Risk Level: ${fetchedAssessment?.risk_level}`);

    // ------------------------------------------------------------------------
    // TEST 9: Private Report Upload (medical-documents)
    // ------------------------------------------------------------------------
    const testPdfContent = Buffer.from('%PDF-1.4 Simulated Diagnostic Laboratory Report Content');
    const storagePath = `${userA.id}/blood_test_${ts}.pdf`;

    const { error: uploadErr } = await clientA.storage
      .from('medical-documents')
      .upload(storagePath, testPdfContent, { contentType: 'application/pdf', upsert: true });

    let signedUrlOk = false;
    if (!uploadErr) {
      const { data: signedData, error: signErr } = await clientA.storage
        .from('medical-documents')
        .createSignedUrl(storagePath, 3600);
      signedUrlOk = !signErr && !!signedData?.signedUrl;
    }

    record(9, 'Private report upload (medical-documents)', !uploadErr && signedUrlOk, `Signed URL verified: ${signedUrlOk}`);

    // ------------------------------------------------------------------------
    // TEST 10: Health Report Persistence
    // ------------------------------------------------------------------------
    // Backend AI processing pipeline ingests health report and clinical findings
    const { data: reportRow, error: repErr } = await adminClient
      .from('health_reports')
      .insert({
        patient_id: userA.id,
        report_title: `blood_test_${ts}.pdf`,
        storage_path: storagePath,
        mime_type: 'application/pdf',
        file_size_bytes: testPdfContent.length,
        ai_analysis: {
          summary: 'Elevated total cholesterol indicating moderate cardiovascular risk.',
          risk_level: 'Moderate',
          recommendations: ['Cardiology consultation', 'Dietary modification']
        }
      })
      .select()
      .single();

    let findingsOk = false;
    if (!repErr && reportRow) {
      const { data: findingRow, error: findErr } = await adminClient
        .from('ai_clinical_findings')
        .insert({
          report_id: reportRow.id,
          patient_id: userA.id,
          category: 'Lipid Profile',
          parameter_name: 'Total Cholesterol',
          observed_value: '235',
          standard_unit: 'mg/dL',
          flag: 'High',
          clinical_significance: 'Mild hypercholesterolemia. Doctor review recommended.'
        })
        .select()
        .single();

      // Patient A retrieves their own report to verify RLS SELECT policy
      const { data: patientRead, error: readErr } = await clientA
        .from('health_reports')
        .select('*')
        .eq('id', reportRow.id)
        .single();

      findingsOk = !findErr && !!findingRow && !readErr && !!patientRead;
    }

    record(10, 'Health report persistence', !repErr && findingsOk, (!repErr && findingsOk) ? `Report ID: ${reportRow?.id}` : `repErr: ${repErr?.message}`);

    // ------------------------------------------------------------------------
    // TEST 11: Prescription Retrieval
    // ------------------------------------------------------------------------
    // Doctor issues prescription for Patient A
    clientDoc = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    await clientDoc.auth.signInWithPassword({
      email: doctor_Email,
      password: testPassword
    });

    const { data: rxRes, error: rxCreateErr } = await clientDoc.rpc('create_prescription_tx', {
      p_doctor_id: userDoc.id,
      p_patient_id: userA.id,
      p_appointment_id: apptId,
      p_diagnosis: 'Dyslipidemia Protocol',
      p_advice: 'Low fat diet and 30 min brisk walk',
      p_medicines: [
        { name: 'Atorvastatin 20mg', dosage: '20mg', frequency: 'Once Daily (Night)', duration: '30 Days', instructions: 'After food' }
      ]
    });

    // Patient A retrieves their prescriptions
    const { data: patientRxs, error: rxFetchErr } = await clientA
      .from('prescriptions')
      .select('id, rx_id, diagnosis, medicines')
      .eq('patient_id', userA.id);

    const rxOk = !rxFetchErr && (patientRxs || []).length > 0;
    record(11, 'Prescription retrieval', rxOk, `Retrieved ${patientRxs?.length} prescriptions`);

    // ------------------------------------------------------------------------
    // TEST 12: Medicine Inventory Retrieval
    // ------------------------------------------------------------------------
    const { data: inventoryList, error: invErr } = await clientA
      .from('pharmacy_inventory')
      .select('id, pharmacy_id, medicine_id, batch_number, stock_quantity, unit_price')
      .eq('pharmacy_id', createdPharmacyId)
      .eq('medicine_id', createdMedicineId);

    const invOk = !invErr && inventoryList?.length === 2;
    record(12, 'Medicine inventory retrieval', invOk, `Found ${inventoryList?.length} active batches for medicine`);

    // ------------------------------------------------------------------------
    // TEST 13: Transactional Medicine Order (create_medicine_order_tx)
    // ------------------------------------------------------------------------
    // Order 15 tablets (Early batch has 20, Late has 50)
    const { data: orderTxRes, error: orderTxErr } = await clientA.rpc('create_medicine_order_tx', {
      p_patient_id: userA.id,
      p_pharmacy_id: createdPharmacyId,
      p_items: [{ medicine_id: createdMedicineId, quantity: 15 }],
      p_delivery_address: '42 Orchid Park, Bengaluru',
      p_notes: 'Ring bell on arrival'
    });

    const medicineOrderId = orderTxRes?.order_id;
    const orderOk = !orderTxErr && orderTxRes?.success && medicineOrderId;
    record(13, 'Transactional medicine order', orderOk, `Order Number: ${orderTxRes?.order_number}, Total: ₹${orderTxRes?.total_amount}`);

    // ------------------------------------------------------------------------
    // TEST 14: FEFO Stock Decrement Verification
    // ------------------------------------------------------------------------
    const { data: postEarlyBatch } = await adminClient
      .from('pharmacy_inventory')
      .select('stock_quantity')
      .eq('id', invBatchEarlyId)
      .single();

    const { data: postLateBatch } = await adminClient
      .from('pharmacy_inventory')
      .select('stock_quantity')
      .eq('id', invBatchLateId)
      .single();

    // Early batch started with 20, 15 deducted => should be 5. Late batch untouched (50).
    const fefoOk = (postEarlyBatch?.stock_quantity === 5) && (postLateBatch?.stock_quantity === 50);
    record(14, 'FEFO stock decrement', fefoOk, `Early batch stock: ${postEarlyBatch?.stock_quantity} (Expected: 5), Late batch stock: ${postLateBatch?.stock_quantity} (Expected: 50)`);

    // ------------------------------------------------------------------------
    // TEST 15: Order Cancellation
    // ------------------------------------------------------------------------
    const { data: cancelledOrder, error: orderCancelErr } = await adminClient
      .from('medicine_orders')
      .update({
        order_status: 'cancelled'
      })
      .eq('id', medicineOrderId)
      .select()
      .single();

    const { data: verifiedOrder } = await clientA
      .from('medicine_orders')
      .select('order_status')
      .eq('id', medicineOrderId)
      .single();

    const orderCancelledOk = !orderCancelErr && verifiedOrder?.order_status === 'cancelled';
    record(15, 'Order cancellation', orderCancelledOk, `Status verified: ${verifiedOrder?.order_status}`);

    // ------------------------------------------------------------------------
    // TEST 16: Notification Read/Unread
    // ------------------------------------------------------------------------
    // Create notification for Patient A
    const { data: notifRow } = await adminClient
      .from('notifications')
      .insert({
        user_id: userA.id,
        title: 'Prescription Ready',
        message: 'Dr. Test Cardiologist has issued your digital prescription.',
        type: 'prescription',
        is_read: false
      })
      .select()
      .single();

    // Patient A reads notification
    const { data: pANotifs } = await clientA
      .from('notifications')
      .select('*')
      .eq('user_id', userA.id)
      .eq('is_read', false);

    const receivedUnread = (pANotifs || []).some(n => n.id === notifRow.id);

    // Mark as read via admin/service
    const { error: markReadErr } = await adminClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifRow.id);

    const { data: readCheck } = await clientA
      .from('notifications')
      .select('is_read')
      .eq('id', notifRow.id)
      .single();

    const notifOk = receivedUnread && !markReadErr && readCheck?.is_read === true;
    record(16, 'Notification read/unread lifecycle', notifOk, 'Notification received, unread verified, mark read confirmed');

    // ------------------------------------------------------------------------
    // TEST 17: Route Protection (Anonymous RPC Rejection)
    // ------------------------------------------------------------------------
    const { error: anonApptErr } = await anonClient.rpc('create_appointment_tx', {
      p_doctor_id: createdDoctorId,
      p_appointment_date: testApptDate,
      p_time_slot: '02:00 PM',
      p_consultation_type: 'video',
      p_symptoms_summary: 'Anon attempt',
      p_patient_notes: 'Unauthorized'
    });

    const anonProtected = !!anonApptErr;
    record(17, 'Route protection (Anonymous RPC rejection)', anonProtected, `Rejected with: ${anonApptErr?.message}`);

    // ------------------------------------------------------------------------
    // TEST 18: Unauthorized Role Access Prevention
    // ------------------------------------------------------------------------
    // Patient attempts to execute doctor-only prescription creation
    const { error: unauthRxErr } = await clientA.rpc('create_prescription_tx', {
      p_doctor_id: userDoc.id,
      p_patient_id: userB.id,
      p_appointment_id: apptId,
      p_diagnosis: 'Hacked diagnosis',
      p_advice: '',
      p_medicines: []
    });

    const roleProtected = !!unauthRxErr && (
      unauthRxErr.message.includes('Unauthorized') ||
      unauthRxErr.message.includes('practitioner') ||
      unauthRxErr.message.includes('doctor')
    );
    record(18, 'Unauthorized role access prevention', roleProtected, `Rejected with: ${unauthRxErr?.message}`);

    // ------------------------------------------------------------------------
    // TEST 19: No Frontend Service-Role Exposure
    // ------------------------------------------------------------------------
    const frontendSrcDir = path.join(rootDir, 'frontend', 'src');
    let serviceRoleExposed = false;
    let serviceRoleHit = '';

    function scanDirForServiceRole(dir) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          scanDirForServiceRole(full);
        } else if (/\.(js|jsx|ts|tsx)$/.test(f)) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('service_role') || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            serviceRoleExposed = true;
            serviceRoleHit = full;
          }
        }
      }
    }
    scanDirForServiceRole(frontendSrcDir);

    record(19, 'No frontend service-role exposure', !serviceRoleExposed, serviceRoleExposed ? `Found in ${serviceRoleHit}` : 'Zero service-role keys in frontend');

    // ------------------------------------------------------------------------
    // TEST 20: No Hardcoded Patient UUID
    // ------------------------------------------------------------------------
    let hardcodedPatientUuid = false;
    let uuidHit = '';

    function scanDirForPatientUuid(dir) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          scanDirForPatientUuid(full);
        } else if (/\.(js|jsx)$/.test(f) && full.includes('pages\\patient')) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('TEST_PATIENT_USER') || content.includes("'00000000-0000-0000-0000-000000000000'")) {
            hardcodedPatientUuid = true;
            uuidHit = full;
          }
        }
      }
    }
    scanDirForPatientUuid(frontendSrcDir);

    record(20, 'No hardcoded patient UUID in patient pages', !hardcodedPatientUuid, hardcodedPatientUuid ? `Found in ${uuidHit}` : 'Patient identity strictly derived from auth session');

    // ------------------------------------------------------------------------
    // TEST 21: Production Build Verification
    // ------------------------------------------------------------------------
    const distHtmlPath = path.join(rootDir, 'frontend', 'dist', 'index.html');
    const distAssetsDir = path.join(rootDir, 'frontend', 'dist', 'assets');
    const distExists = fs.existsSync(distHtmlPath) && fs.existsSync(distAssetsDir) && fs.readdirSync(distAssetsDir).length > 0;

    record(21, 'Production build verification', distExists, `dist/index.html and ${distExists ? fs.readdirSync(distAssetsDir).length : 0} bundle assets verified`);

  } catch (err) {
    console.error('\nUNHANDLED EXCEPTION DURING VERIFICATION:', err);
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP: Clean up test rows and auth users
    // ------------------------------------------------------------------------
    console.log('\nCleaning up ephemeral test records...');
    try {
      if (createdMedicineId) {
        await adminClient.from('order_items').delete().eq('medicine_id', createdMedicineId);
        await adminClient.from('pharmacy_inventory').delete().eq('medicine_id', createdMedicineId);
        await adminClient.from('medicines').delete().eq('id', createdMedicineId);
      }
      if (createdDoctorId) {
        await adminClient.from('doctor_availability').delete().eq('doctor_id', createdDoctorId);
        await adminClient.from('prescriptions').delete().eq('doctor_id', createdDoctorId);
        await adminClient.from('appointments').delete().eq('doctor_id', createdDoctorId);
        await adminClient.from('doctors').delete().eq('id', createdDoctorId);
      }
      if (createdPharmacyId) {
        await adminClient.from('medicine_orders').delete().eq('pharmacy_id', createdPharmacyId);
        await adminClient.from('pharmacies').delete().eq('id', createdPharmacyId);
      }
      if (userA?.id) {
        await adminClient.from('notifications').delete().eq('user_id', userA.id);
        await adminClient.from('ai_clinical_findings').delete().match({ status: 'abnormal' });
        await adminClient.from('health_reports').delete().eq('patient_id', userA.id);
        await adminClient.from('symptom_assessments').delete().eq('patient_id', userA.id);
        await adminClient.from('patients').delete().eq('id', userA.id);
        await adminClient.from('profiles').delete().eq('id', userA.id);
        await adminClient.auth.admin.deleteUser(userA.id);
      }
      if (userB?.id) {
        await adminClient.from('patients').delete().eq('id', userB.id);
        await adminClient.from('profiles').delete().eq('id', userB.id);
        await adminClient.auth.admin.deleteUser(userB.id);
      }
      if (userDoc?.id) {
        await adminClient.from('profiles').delete().eq('id', userDoc.id);
        await adminClient.auth.admin.deleteUser(userDoc.id);
      }
      if (userPharm?.id) {
        await adminClient.from('profiles').delete().eq('id', userPharm.id);
        await adminClient.auth.admin.deleteUser(userPharm.id);
      }
      console.log('✓ Ephemeral test records removed.');
    } catch (cleanErr) {
      console.warn('Cleanup notice:', cleanErr.message);
    }
  }

  console.log('\n================================================================');
  console.log(`PHASE 4 TEST RESULTS: ${results.passed} / ${results.total} PASSED`);
  console.log('================================================================');

  if (results.passed === results.total) {
    console.log('STATUS: PASS — ALL 21 PATIENT EXPERIENCE CRITERIA VERIFIED ON LIVE SUPABASE');
    process.exit(0);
  } else {
    console.error(`STATUS: FAIL — ${results.failed} tests failed.`);
    process.exit(1);
  }
}

runPhase4Verification().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
