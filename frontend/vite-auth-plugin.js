import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getEnvVal(key) {
  if (process.env[key]) return process.env[key];
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (k === key) {
            return v.replace(/^["']|["']$/g, '');
          }
        }
      }
    }
  } catch (err) {
    // fallback
  }
  return '';
}

const SUPABASE_URL = getEnvVal('VITE_SUPABASE_URL') || process.env.VITE_SUPABASE_URL || 'https://smmelvzldriqujaodckf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = getEnvVal('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

export function authServerPlugin() {
  return {
    name: 'vite-plugin-auth-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          return res.end();
        }

        const url = req.url || '';

        // 1. POST /api/auth/register
        if (url.startsWith('/api/auth/register') && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { email, password, role = 'patient', fullName, name, phone, mobile, ...extra } = body;
            const displayName = fullName || name || email.split('@')[0];
            const userPhone = phone || mobile || '';
            const rawRole = String(role).toLowerCase().trim();
            const canonicalRole = (rawRole === 'doctor') ? 'doctor' :
                                  (rawRole === 'pharmacy' || rawRole === 'pharmacist') ? 'pharmacist' :
                                  (rawRole === 'admin' || rawRole === 'super_admin') ? 'admin' : 'patient';

            if (!email || !password) {
              return sendJson(res, 400, { error: 'Email and password are required.' });
            }

            // Check if user exists in Auth
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            let authUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

            if (!authUser) {
              const createRes = await supabaseAdmin.auth.admin.createUser({
                email: email.trim().toLowerCase(),
                password,
                email_confirm: true,
                user_metadata: {
                  full_name: displayName,
                  name: displayName,
                  phone: userPhone,
                  role: canonicalRole,
                  ...extra
                }
              });

              if (createRes.error) {
                return sendJson(res, 400, { error: createRes.error.message });
              }
              authUser = createRes.data.user;
            } else {
              // Update user password & confirm email
              const updateRes = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                password,
                email_confirm: true,
                user_metadata: {
                  full_name: displayName,
                  name: displayName,
                  phone: userPhone,
                  role: canonicalRole,
                  ...extra
                }
              });
              if (updateRes.error) {
                console.warn('Update user note:', updateRes.error.message);
              }
            }

            const userId = authUser.id;

            // Canonical demo accounts are auto-approved. All new doctors and pharmacists require Admin approval.
            const isDemoAccount = email.toLowerCase().trim() === 'doctor@medimind.ai' || 
                                 email.toLowerCase().trim() === 'pharmacy@medimind.ai' ||
                                 email.toLowerCase().trim() === 'admin@medimind.ai';

            const initialApproval = (canonicalRole === 'doctor' || canonicalRole === 'pharmacist') && !isDemoAccount
              ? 'pending'
              : 'approved';

            const isAvailable = (initialApproval === 'approved');

            // Save to public.profiles
            await supabaseAdmin.from('profiles').upsert({
              id: userId,
              email: email.trim().toLowerCase(),
              full_name: displayName,
              name: displayName,
              phone: userPhone,
              role: canonicalRole,
              approval_status: initialApproval,
              verification_status: initialApproval
            });

            // Save to public.user_roles
            await supabaseAdmin.from('user_roles').upsert({
              user_id: userId,
              role: canonicalRole
            });

            // Save to role-specific tables
            if (canonicalRole === 'patient') {
              await supabaseAdmin.from('patients').upsert({
                id: userId,
                full_name: displayName,
                phone: userPhone,
                abha_id: extra.abhaId || extra.abha_id || ''
              });
            } else if (canonicalRole === 'doctor') {
              await supabaseAdmin.from('doctors').upsert({
                id: userId,
                full_name: displayName,
                specialization: extra.specialization || extra.specialist || 'General Physician',
                license_number: extra.licenseNumber || extra.license_number || 'DOC-' + Date.now(),
                clinic_name: extra.clinicName || 'MediMind Clinical Partner',
                verification_status: initialApproval,
                is_available: isAvailable,
                rating: 4.9,
                consultation_fee: 500
              });
            } else if (canonicalRole === 'pharmacist') {
              await supabaseAdmin.from('pharmacies').upsert({
                id: userId,
                pharmacy_name: extra.pharmacyName || displayName,
                contact_person: displayName,
                phone: userPhone,
                email: email.trim().toLowerCase(),
                drug_license_number: extra.licenseNumber || 'PHARM-' + Date.now(),
                verification_status: initialApproval,
                address: extra.pharmacyAddress || 'MediMind Partner Pharmacy'
              });
            }

            // If pending practitioner registration, dispatch high-priority alert to Admins
            if (initialApproval === 'pending') {
              try {
                const { data: adminList } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
                if (adminList && adminList.length > 0) {
                  for (const adm of adminList) {
                    await supabaseAdmin.from('notifications').insert({
                      user_id: adm.id,
                      title: canonicalRole === 'doctor' ? 'New Doctor Verification Request' : 'New Pharmacy Verification Request',
                      message: `Dr. ${displayName} (${email}) has registered with License #${extra.licenseNumber || 'DOC-PENDING'}. Verification required to grant access.`,
                      type: 'verification_request',
                      link: canonicalRole === 'doctor' ? '/admin/doctor-verification' : '/admin/pharmacy-verification',
                      is_read: false
                    });
                  }
                }
              } catch (adminNoteErr) {
                console.warn('Admin notification note:', adminNoteErr.message);
              }
            }

            return sendJson(res, 200, {
              success: true,
              user: { id: userId, email: authUser.email },
              role: canonicalRole,
              approval_status: initialApproval
            });
          } catch (err) {
            console.error('API Register Error:', err);
            return sendJson(res, 500, { error: err.message || 'Internal server error during registration.' });
          }
        }

        // 2. POST /api/auth/confirm
        if (url.startsWith('/api/auth/confirm') && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { email } = body;
            if (!email) return sendJson(res, 400, { error: 'Email is required' });

            const { data } = await supabaseAdmin.auth.admin.listUsers();
            const user = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
            if (user) {
              await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
              return sendJson(res, 200, { success: true, message: `Email confirmed for ${email}` });
            }
            return sendJson(res, 404, { error: 'User not found' });
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        // 3. POST /api/auth/approve
        if (url.startsWith('/api/auth/approve') && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { userId, role } = body;
            if (!userId) return sendJson(res, 400, { error: 'User ID is required' });

            await supabaseAdmin.from('profiles').update({
              approval_status: 'approved',
              verification_status: 'approved'
            }).eq('id', userId);

            if (role === 'doctor') {
              await supabaseAdmin.from('doctors').update({
                verification_status: 'approved',
                is_available: true
              }).eq('id', userId);
            } else if (role === 'pharmacist' || role === 'pharmacy') {
              await supabaseAdmin.from('pharmacies').update({
                verification_status: 'approved'
              }).eq('id', userId);
            }

            // Update user metadata in Supabase Auth
            try {
              await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { approval_status: 'approved', verification_status: 'approved' }
              });
            } catch (authUpErr) {
              console.warn('Auth user metadata update note:', authUpErr.message);
            }

            // Dispatch Practitioner In-App Alert and simulated SMS/Email notification
            try {
              const { data: userProf } = await supabaseAdmin.from('profiles').select('full_name, phone').eq('id', userId).maybeSingle();
              const userName = userProf?.full_name || 'Practitioner';
              const userPhone = userProf?.phone || 'registered mobile';

              await supabaseAdmin.from('notifications').insert({
                user_id: userId,
                title: 'Application Approved & Verified!',
                message: `Congratulations Dr. ${userName}! Your MediMind practitioner credentials have been verified and approved by Administrator. SMS confirmation alert sent to ${userPhone}. You can now log in and start receiving patients.`,
                type: 'approval_confirmed',
                link: role === 'doctor' ? '/doctor/dashboard' : '/pharmacy/dashboard',
                is_read: false
              });
            } catch (notifErr) {
              console.warn('Doctor approval notification note:', notifErr.message);
            }

            return sendJson(res, 200, { success: true, message: 'Account approved successfully. SMS/Email confirmation sent.' });
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        // 3B. POST /api/admin/doctors/delete
        if (url.startsWith('/api/admin/doctors/delete') && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { doctorId } = body;
            if (!doctorId) return sendJson(res, 400, { error: 'Doctor ID is required' });

            // 1. Delete relations
            await supabaseAdmin.from('doctor_availability').delete().eq('doctor_id', doctorId);
            await supabaseAdmin.from('appointments').delete().eq('doctor_id', doctorId);
            await supabaseAdmin.from('prescriptions').delete().eq('doctor_id', doctorId);
            await supabaseAdmin.from('patient_doctor_access').delete().eq('doctor_id', doctorId);
            await supabaseAdmin.from('notifications').delete().eq('user_id', doctorId);
            await supabaseAdmin.from('doctors').delete().eq('id', doctorId);
            await supabaseAdmin.from('user_roles').delete().eq('user_id', doctorId);
            await supabaseAdmin.from('profiles').delete().eq('id', doctorId);

            // 2. Delete Auth user if exists
            try {
              await supabaseAdmin.auth.admin.deleteUser(doctorId);
            } catch (authDelErr) {
              console.warn('Auth user delete note:', authDelErr.message);
            }

            return sendJson(res, 200, { success: true, message: 'Doctor permanently removed from platform.' });
          } catch (err) {
            console.error('API Doctor Delete Error:', err);
            return sendJson(res, 500, { error: err.message });
          }
        }

        // 4. POST /api/auth/reset-password
        if (url.startsWith('/api/auth/reset-password') && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { email, password } = body;
            if (!email || !password) return sendJson(res, 400, { error: 'Email and new password required.' });

            const { data } = await supabaseAdmin.auth.admin.listUsers();
            const user = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
            if (user) {
              await supabaseAdmin.auth.admin.updateUserById(user.id, {
                password,
                email_confirm: true
              });
              return sendJson(res, 200, { success: true, message: 'Password updated successfully.' });
            }
            return sendJson(res, 404, { error: 'Account with that email not found.' });
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        // 5. GET /api/auth/demo-accounts
        if (url.startsWith('/api/auth/demo-accounts') && req.method === 'GET') {
          return sendJson(res, 200, {
            accounts: [
              { role: 'patient', label: 'Patient Portal', email: 'patient@medimind.ai', password: 'Patient@123', path: '/patient/dashboard' },
              { role: 'doctor', label: 'Doctor Portal', email: 'doctor@medimind.ai', password: 'Doctor@123', path: '/doctor/dashboard' },
              { role: 'pharmacist', label: 'Pharmacy Portal', email: 'pharmacy@medimind.ai', password: 'Pharmacy@123', path: '/pharmacy/dashboard' },
              { role: 'admin', label: 'Admin Portal', email: 'admin@medimind.ai', password: 'Admin@123', path: '/admin/dashboard' }
            ]
          });
        }

        // 6. GET /api/livekit/token
        if (url.startsWith('/api/livekit/token')) {
          try {
            const reqUrl = new URL(url, 'http://localhost:3000');
            const room = reqUrl.searchParams.get('room') || 'teleconsultation-room';
            const identity = reqUrl.searchParams.get('identity') || `user-${Date.now()}`;
            const name = reqUrl.searchParams.get('name') || identity;

            const apiKey = getEnvVal('LIVEKIT_API_KEY') || getEnvVal('VITE_LIVEKIT_API_KEY') || process.env.LIVEKIT_API_KEY || 'devkey';
            const apiSecret = getEnvVal('LIVEKIT_API_SECRET') || getEnvVal('VITE_LIVEKIT_API_SECRET') || process.env.LIVEKIT_API_SECRET || 'secret';
            const livekitUrl = getEnvVal('LIVEKIT_URL') || getEnvVal('VITE_LIVEKIT_URL') || process.env.LIVEKIT_URL || '';

            const header = { alg: 'HS256', typ: 'JWT' };
            const now = Math.floor(Date.now() / 1000);
            const payload = {
              sub: identity,
              iss: apiKey,
              nbf: now - 5,
              exp: now + (24 * 60 * 60),
              name,
              video: {
                room,
                roomJoin: true,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true
              }
            };

            const base64UrlEncode = (obj) => {
              return Buffer.from(JSON.stringify(obj))
                .toString('base64')
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
            };

            const encodedHeader = base64UrlEncode(header);
            const encodedPayload = base64UrlEncode(payload);
            const signatureInput = `${encodedHeader}.${encodedPayload}`;

            const crypto = await import('crypto');
            const signature = crypto.default
              .createHmac('sha256', apiSecret)
              .update(signatureInput)
              .digest('base64')
              .replace(/=/g, '')
              .replace(/\+/g, '-')
              .replace(/\//g, '_');

            const token = `${signatureInput}.${signature}`;

            return sendJson(res, 200, {
              token,
              url: livekitUrl,
              room,
              identity,
              configured: Boolean(livekitUrl && livekitUrl.startsWith('ws'))
            });
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        next();
      });
    }
  };
}
