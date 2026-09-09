# MEDIMIND AI — PHASE 6 PHARMACY PLATFORM QUERY MAP

This document details the exact PostgreSQL query, RPC, and data-flow mapping for every operational feature in the MediMind AI Production Pharmacy Platform. All operations integrate directly with live Supabase database tables at `smmelvzldriqujaodckf.supabase.co`.

---

## 1. Architectural Principles & Isolation Boundaries

- **Authoritative Identity:** The pharmacy's identity is derived strictly from `auth.uid()`, cross-checked against `public.user_roles` (`role = 'pharmacist'`).
- **Database Baseline:** Strictly frozen through **Migration 0009** (no schema changes or new migrations created).
- **Dispensary Isolation:** Each pharmacy only has access to its own inventory (`public.pharmacy_inventory`), incoming orders (`public.medicine_orders`), and accreditation verification documents (`public.pharmacy_verifications`).
- **Patient Confidentiality Boundary:** Pharmacies only see the clinical details attached to a prescription specifically fulfilled by their store (`diagnosis`, `medicines`, prescribing doctor). Arbitrary access to `public.medical_records` is blocked by RLS.

### 1.1 Tenant Identity & Access Propagation Chain

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

### 1.2 Cross-Tenant Isolation Enforcement (RLS Barrier)

```
Pharmacy A auth.uid()
        ↓
Pharmacy A data       ✅ (Authorized: auth.uid() = pharmacy_id)

Pharmacy A auth.uid()
        ↓
Pharmacy B data       ❌ (Blocked: 0 rows returned / 0 rows mutated)
```

- **Query Isolation:** `SELECT` queries on `public.pharmacy_inventory` and `public.medicine_orders` filter results strictly by `pharmacy_id = auth.uid()`.
- **Mutation Isolation:** `INSERT`, `UPDATE`, and `DELETE` on `public.pharmacy_inventory` are enforced by policy `pharmacy_inventory_owner_mutate` (`auth.uid() = pharmacy_id OR public.is_admin()`). Any write attempt by Pharmacy A against Pharmacy B inventory rows affects 0 rows.
- **Order Isolation:** `public.medicine_orders` allows read access strictly to participants via `medicine_orders_select` (`auth.uid() = patient_id OR auth.uid() = pharmacy_id OR public.is_admin()`). Pharmacy A cannot view, inspect, or modify customer orders assigned to Pharmacy B.

---

## 2. Comprehensive Query & Transaction Map

| # | Feature / UI Component | Client / Role | Target Table(s) / RPC | PostgreSQL Operations | Security & RLS Policy |
|---|------------------------|---------------|----------------------|-----------------------|-----------------------|
| 1 | **Pharmacy Dashboard** (`PharmacyDashboard.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders`, `pharmacy_inventory`, `notifications` | `SELECT` today's orders, status counts (`pending`, `processing`, `packed`, `shipped`, `delivered`), low-stock items, expiring batches, and realized revenue | `medicine_orders_select` (`auth.uid() = pharmacy_id`), `pharmacy_inventory_select` |
| 2 | **Order Queue & Search** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders` JOIN `patients`, `prescriptions`, `order_items`, `medicines` | `SELECT id, order_number, patient_id, total_amount, order_status, created_at, ...` filtered by `order_status` and search query | `medicine_orders_select` (`auth.uid() = pharmacy_id`) |
| 3 | **Order Inspection Drawer** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders` JOIN `order_items` JOIN `medicines` | `SELECT * FROM medicine_orders WHERE id = p_order_id AND pharmacy_id = auth.uid()` with itemized unit price and quantities | `medicine_orders_select` |
| 4 | **Attached Digital Rx Review** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | `prescriptions` JOIN `doctors` | `SELECT rx_id, diagnosis, medicines, instructions, valid_until, doctor(...) FROM prescriptions WHERE id = p_prescription_id` | `prescriptions_select` (Participant / Dispenser access) |
| 5 | **Order Acceptance** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders`, `notifications` | `UPDATE medicine_orders SET order_status = 'processing', notes = p_notes WHERE id = p_order_id AND pharmacy_id = auth.uid()` | Service layer / RPC mutation with audit trail |
| 6 | **Order Rejection with Reason** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders`, `notifications` | `UPDATE medicine_orders SET order_status = 'cancelled', notes = p_reason WHERE id = p_order_id AND pharmacy_id = auth.uid()` | Service layer / RPC mutation with audit trail |
| 7 | **Packaging Confirmation** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders`, `notifications` | `UPDATE medicine_orders SET order_status = 'packed' WHERE id = p_order_id AND pharmacy_id = auth.uid()` | Service layer / RPC mutation with audit trail |
| 8 | **Prescription Fulfillment & Courier Dispatch** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | RPC: `public.pharmacy_fulfill_prescription_tx(p_order_id, p_pharmacy_id, p_tracking_number)` | Atomic row verification, order status transition to `'shipped'`, patient notification emission, tracking number attachment | `GRANT EXECUTE TO authenticated` (Checks `pharmacy_id = auth.uid()`) |
| 9 | **Final Delivery Handover** (`OrderProcessing.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders`, `notifications` | `UPDATE medicine_orders SET order_status = 'delivered' WHERE id = p_order_id AND pharmacy_id = auth.uid()` | Service layer / RPC mutation with audit trail |
| 10 | **Stock Inventory Directory** (`InventoryManagement.jsx`) | Pharmacist (`auth.uid()`) | `pharmacy_inventory` JOIN `medicines` | `SELECT * FROM pharmacy_inventory WHERE pharmacy_id = auth.uid() ORDER BY expiry_date ASC` | `pharmacy_inventory_select`, `pharmacy_inventory_owner_mutate` |
| 11 | **Batch Creation / Restock** (`InventoryManagement.jsx`, `BatchManagement.jsx`) | Pharmacist (`auth.uid()`) | `pharmacy_inventory` | `INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, batch_number, expiry_date, stock_quantity, unit_price, reorder_level) VALUES (...)` | `pharmacy_inventory_owner_mutate` (`auth.uid() = pharmacy_id`) |
| 12 | **Batch Stock Adjustment** (`InventoryManagement.jsx`) | Pharmacist (`auth.uid()`) | `pharmacy_inventory` | `UPDATE pharmacy_inventory SET stock_quantity = p_qty, unit_price = p_price WHERE id = p_batch_id AND pharmacy_id = auth.uid()` | `pharmacy_inventory_owner_mutate` (`auth.uid() = pharmacy_id`) |
| 13 | **Batch Expiry & FEFO Sorting** (`BatchManagement.jsx`) | Pharmacist (`auth.uid()`) | `pharmacy_inventory` JOIN `medicines` | `SELECT * FROM pharmacy_inventory WHERE pharmacy_id = auth.uid() ORDER BY expiry_date ASC` with client-side computation of `diffDays` and visual tags (`expired`, `near_expiry`, `valid`) | `pharmacy_inventory_select` |
| 14 | **Master Medicine Directory** (`MedicineCatalog.jsx`) | Pharmacist (`auth.uid()`) | `medicines` | `SELECT * FROM medicines ORDER BY brand_name ASC` with brand/molecule/dosage form filtering | Service layer / Catalog query surface |
| 15 | **Pharmacy Verification & Compliance** (`PharmacyVerification.jsx`) | Pharmacist (`auth.uid()`) | `pharmacy_verifications`, Storage: `pharmacy-documents` | `SELECT * FROM pharmacy_verifications WHERE pharmacy_id = auth.uid() ORDER BY created_at DESC LIMIT 1`; Document upload to `${auth.uid()}/${filename}` via `createSignedUrl` | `pharmacy_verifications_select` (`auth.uid() = pharmacy_id`), Storage RLS |
| 16 | **Dispensary Financial & Inventory Analytics** (`PharmacyAnalytics.jsx`) | Pharmacist (`auth.uid()`) | `medicine_orders`, `pharmacy_inventory`, `order_items` | Real database aggregates: Total revenue from completed orders, inventory valuation ($\sum \text{quantity} \times \text{unit\_price}$), order distribution by status, top dispensed drugs | `medicine_orders_select`, `pharmacy_inventory_select` |
| 17 | **Dispensary Profile Management** (`PharmacyProfile.jsx`) | Pharmacist (`auth.uid()`) | `pharmacies`, `profiles` | `SELECT * FROM pharmacies WHERE id = auth.uid()`; `UPDATE pharmacies SET pharmacy_name, contact_person, phone, address, operating_hours WHERE id = auth.uid()` | `profiles_update_own`, Service layer integration |
| 18 | **Multi-Batch FEFO Order Transaction** (Patient E2E) | Patient (`auth.uid()`) | RPC: `public.create_medicine_order_tx(p_patient_id, p_pharmacy_id, p_items, p_delivery_address, p_notes)` | Pre-flight stock validation, candidate batch row-locking (`FOR UPDATE`), sequential FEFO consumption (`ORDER BY expiry_date ASC`), master order creation (`medicine_orders`), line item recording (`order_items`), real-time dispensary notification | `GRANT EXECUTE TO authenticated` (Checks `auth.uid() = p_patient_id`) |
| 19 | **Regulatory Admin Approval Gate** (Admin Governance) | Super Admin (`auth.uid()`) | RPC: `public.verify_pharmacy_tx(p_pharmacy_id, p_status, p_reason)` | Verify drug license, update `pharmacies.verification_status`, record in `pharmacy_verifications`, sync `profiles.approval_status`, notify pharmacy dispensary | `is_admin()` check in PostgreSQL |

---

## 3. Atomic Multi-Batch FEFO Deduct Algorithm

When `create_medicine_order_tx` is called, PostgreSQL executes the following deterministic transaction:

```sql
FOR v_batch_rec IN
    SELECT id, batch_number, expiry_date, stock_quantity, unit_price
    FROM public.pharmacy_inventory
    WHERE pharmacy_id = p_pharmacy_id 
      AND medicine_id = v_med_id 
      AND stock_quantity > 0
    ORDER BY expiry_date ASC, created_at ASC
    FOR UPDATE
LOOP
    EXIT WHEN v_remaining_to_fulfill <= 0;
    v_deduct := LEAST(v_batch_rec.stock_quantity, v_remaining_to_fulfill);
    UPDATE public.pharmacy_inventory
    SET stock_quantity = stock_quantity - v_deduct, updated_at = NOW()
    WHERE id = v_batch_rec.id;
    v_remaining_to_fulfill := v_remaining_to_fulfill - v_deduct;
END LOOP;
```

This guarantees:
1. Concurrency safety: `FOR UPDATE` serializes simultaneous orders on the same inventory batches.
2. Expiry compliance: Batches with the earliest expiry dates are exhausted first.
3. Rollback guarantee: If aggregate quantity across all active batches is insufficient, the transaction throws an exception and rolls back all deductions.
