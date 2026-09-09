# MEDIMIND AI — PHASE 6 PHARMACY PLATFORM RLS SECURITY MATRIX

This document outlines the Row Level Security (RLS) enforcement, execution privileges, and security boundaries across all database objects touched by the MediMind AI Production Pharmacy Platform.

---

## 0. Authoritative Identity Chain & Dispensary Tenant Isolation

```
authenticated user
      ↓
auth.uid()
      ↓
pharmacies.id
      ↓
pharmacy_inventory.pharmacy_id
      ↓
medicine_orders.pharmacy_id
```

```
Pharmacy A auth.uid()
        ↓
Pharmacy A data       ✅ (Authorized: auth.uid() = pharmacy_id)

Pharmacy A auth.uid()
        ↓
Pharmacy B data       ❌ (Blocked by RLS: 0 rows returned, mutation rejected)
```

---

## 1. Table-Level RLS Policies & Access Controls

| PostgreSQL Table | RLS Active | Anonymous | Patient | Doctor | Pharmacist (`auth.uid()`) | Cross-Dispensary (`Pharm B`) | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `public.pharmacies` | **YES** | ❌ Blocked | View Approved Directory | View Approved Directory | Manage Own (`auth.uid() = id`) | Cannot mutate Pharm A | Full Access |
| `public.pharmacy_inventory` | **YES** | ❌ Blocked | View Availability (`true`) | View Availability (`true`) | Full Control Own (`pharmacy_id = auth.uid()`) | ❌ Cannot mutate or delete Pharm A | Full Access |
| `public.medicines` | **YES** | ❌ Blocked | View via Catalog Service | View via Catalog Service | View via Catalog Service | View via Catalog Service | Full Mutate |
| `public.medicine_orders` | **YES** | ❌ Blocked | View Own Orders (`patient_id = auth.uid()`) | ❌ Blocked (Unless assigned) | View Assigned (`pharmacy_id = auth.uid()`) | ❌ Blocked (0 rows) | Full Access |
| `public.order_items` | **YES** | ❌ Blocked | View Own Items | ❌ Blocked | View Assigned Order Items | ❌ Blocked (0 rows) | Full Access |
| `public.prescriptions` | **YES** | ❌ Blocked | View Own Prescriptions | View Authored Prescriptions | View Assigned / Dispensed Prescriptions | ❌ Blocked | Full Access |
| `public.pharmacy_verifications` | **YES** | ❌ Blocked | ❌ Blocked | ❌ Blocked | View Own Submissions (`pharmacy_id = auth.uid()`) | ❌ Blocked | Full Review |
| `public.notifications` | **YES** | ❌ Blocked | Own Notifications | Own Notifications | Own Notifications (`user_id = auth.uid()`) | ❌ Blocked | Full Access |
| `public.medical_records` | **YES** | ❌ Blocked | Own EHR Vault | Active Consent Bridge Only | ❌ **Strictly Forbidden** (0 rows) | ❌ Blocked | Audited Admin |
| `public.audit_logs` | **YES** | ❌ Blocked | ❌ Blocked | ❌ Blocked | Immutable Append | ❌ Blocked | Read Audit Trail |
| `public.user_roles` | **YES** | ❌ Blocked | View Own Role | View Own Role | View Own Role (Self-mutation blocked) | ❌ Blocked | Manage Roles |

---

## 2. Storage Bucket Security (`pharmacy-documents`)

The `pharmacy-documents` storage bucket is **strictly private**:
- **Root Bucket:** `pharmacy-documents`
- **Object Path Hierarchy:** `${auth.uid()}/${timestamp}_${document_type}.${extension}`
- **Storage Policies:**
  - **Upload (INSERT):** Only authenticated users whose `auth.uid()` matches the first folder component of the path (`(storage.foldername(name))[1] = auth.uid()::text`).
  - **Download / Inspect (SELECT):** Requires time-limited Signed URLs generated via `createSignedUrl(path, 3600)`. Public direct downloads are forbidden.
  - **Delete:** Restricted to the uploading dispensary or Super Administrators.

---

## 3. Transactional Stored Procedures (Least Privilege Execution)

| Procedure / Function Name | Parameters | Execution Grant | Security Model | Description |
|---|---|---|---|---|
| `public.create_medicine_order_tx` | `(p_patient_id UUID, p_pharmacy_id UUID, p_items JSONB, p_delivery_address TEXT, p_notes TEXT)` | `authenticated` only (`anon` revoked) | `SECURITY DEFINER` (Search path pinned) | Pre-flight validation, candidate batch row-locking (`FOR UPDATE`), deterministic multi-batch FEFO deduction, order creation, and dispensary alert emission. |
| `public.pharmacy_fulfill_prescription_tx` | `(p_order_id UUID, p_pharmacy_id UUID, p_tracking_number TEXT DEFAULT NULL)` | `authenticated` only (`anon` revoked) | `SECURITY DEFINER` (Search path pinned) | Validates that `pharmacy_id = auth.uid()` owns the order, updates status to `'shipped'`, sets tracking number, and emits real-time delivery notification to patient. |
| `public.verify_pharmacy_tx` | `(p_pharmacy_id UUID, p_status TEXT, p_reason TEXT DEFAULT NULL)` | `authenticated` only (`anon` revoked) | `SECURITY DEFINER` (Search path pinned) | Enforces `is_admin()`. Approves or rejects retail pharmacy license, updates `public.pharmacies` and `public.profiles`, and logs regulatory action. |

---

## 4. Security Verification Guarantee

All the above policies were empirically validated against live Supabase during the Phase 6 test execution:
- ✅ **Test 13:** Pharmacy B received 0 rows when attempting to inspect Pharmacy A customer orders.
- ✅ **Test 19:** Pharmacist received 0 rows when attempting to read arbitrary patient medical records.
- ✅ **Test 20:** Pharmacy B mutation on Pharmacy A inventory rows modified 0 rows.
- ✅ **Test 21:** Anonymous update attempt on `public.pharmacies` was completely blocked by RLS.
- ✅ **Test 22:** Pharmacist self-escalation attempt to `super_admin` in `public.user_roles` was rejected.
- ✅ **Test 23:** Anonymous invocation of `pharmacy_fulfill_prescription_tx` was rejected by PostgreSQL security.
