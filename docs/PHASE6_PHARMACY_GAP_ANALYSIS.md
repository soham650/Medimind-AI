# MEDIMIND AI — PHASE 6 PHARMACY PLATFORM GAP ANALYSIS
## Discovery & Architectural Audit for Production Medical Store / Pharmacy Platform

**Target Environment:** Live Supabase Cloud (`smmelvzldriqujaodckf.supabase.co`)  
**Database Baseline:** FROZEN through Migration 0009 (Strictly 0 new migrations unless a genuine, proven schema gap is discovered)  
**Practitioner / Pharmacist Identity:** Derived strictly from Supabase Auth Session (`auth.uid()`)  

---

## 1. Executive Summary

Phase 6 requires a production-grade Pharmacy and Medical Store portal fully integrated into the end-to-end healthcare lifecycle:
$$\text{Patient} \longrightarrow \text{Doctor} \longrightarrow \text{Prescription} \longrightarrow \text{Pharmacy} \longrightarrow \text{Inventory (FEFO)} \longrightarrow \text{Order} \longrightarrow \text{Fulfillment} \longrightarrow \text{Tracking}$$

A thorough discovery was conducted across the database schema, frontend components, services, and security boundaries. While core database entities (`pharmacies`, `pharmacy_inventory`, `medicines`, `medicine_orders`, `order_items`, `pharmacy_verifications`, `audit_logs`, `notifications`) and atomic RPCs (`create_medicine_order_tx`, `pharmacy_fulfill_prescription_tx`, `verify_pharmacy_tx`) are already deployed and verified in the live Supabase instance through Migration 0009, several frontend pages are either outdated, missing required views, or improperly wired to obsolete service methods.

---

## 2. Classification of System Components

### 2.1 Already Implemented & Verified
- **Database Schema (`pharmacies`, `medicines`, `pharmacy_inventory`, `medicine_orders`, `order_items`):** 44 public tables verified in Migration 0009.
- **FEFO Transactional Order Execution (`create_medicine_order_tx`):** Atomic stored procedure with `FOR UPDATE` row-level locking, sorting by `expiry_date ASC, created_at ASC`, multi-batch stock decrement, and notification insertion. (100% PASS in Migration 0009 and Phase 4 regression).
- **Fulfillment RPC (`pharmacy_fulfill_prescription_tx`):** Privileged function updating `order_status = 'shipped'` and notifying the patient with tracking information.
- **Admin Verification RPC (`verify_pharmacy_tx`):** Atomically updates `pharmacies.verification_status`, `profiles.approval_status`, logs to `pharmacy_verifications`, and sends notification.
- **Private Storage Bucket (`pharmacy-documents`):** Restricted private bucket with owner-only insert and owner/admin select via signed URLs.
- **Patient Storefront (`frontend/src/pages/patient/PharmacyStore.jsx`):** Allows patients to browse formulary, select licensed dispensary, attach digital prescription, and checkout via `createOrder` (`create_medicine_order_tx`).
- **Batch Management Component (`frontend/src/pages/pharmacy/BatchManagement.jsx`):** Comprehensive UI for batch creation, expiry monitoring, and FEFO sorting.

---

### 2.2 Partially Implemented
- **Pharmacy Dashboard (`frontend/src/pages/pharmacy/PharmacyDashboard.jsx`):**
  - *Current State:* Renders basic placeholder cards.
  - *Gap:* Imports legacy `pharmacyService` with hardcoded assumptions; filters by `delivery_status` instead of `order_status`; lacks real database aggregations for today's orders, low stock count, expiring batches, and notification feed.
- **Order Processing (`frontend/src/pages/pharmacy/OrderProcessing.jsx`):**
  - *Current State:* Displays a basic orders table.
  - *Gap:* Uses obsolete `delivery_status`; lacks modal or route for Order Details (`/pharmacy/orders/:id`); lacks explicit Accept / Reject / Stock Reservation flow; fails to surface attached digital prescription items.
- **Pharmacy Inventory (`frontend/src/pages/pharmacy/InventoryManagement.jsx`):**
  - *Current State:* Queries global `medicines` master catalog instead of pharmacy-specific stock in `pharmacy_inventory`.
  - *Gap:* Does not show pharmacy-specific stock quantities, batch details, reorder levels, or unit pricing.
- **Pharmacy Profile (`frontend/src/pages/pharmacy/PharmacyProfile.jsx`):**
  - *Current State:* Allows editing profile and uploading drug license documents.
  - *Gap:* Needs integration with `auth.uid()` identity protection and synchronization with `public.pharmacies`.

---

### 2.3 Missing
- **Dedicated Medicine Catalog Page (`/pharmacy/medicines`):** Required for browsing master medicines, checking SKU/barcode, dosage forms, manufacturer, and prescription-required flags.
- **Dedicated Verification Page (`/pharmacy/verification`):** Dedicated regulatory compliance tracking page showing submitted documents, signed URLs, approval state, rejection reasons, and resubmission.
- **Order Details Route / View (`/pharmacy/orders/:id`):** Deep view showing order details, customer contact, prescription verification, batch allocation, and fulfillment actions.
- **Pharmacy Analytics Page (`/pharmacy/analytics`):** Real database-driven metrics for orders by status, revenue, top dispensed medicines, low-stock alerts, and expiring batches.
- **Pharmacy Verification Test Suite (`scripts/verify_phase6_pharmacy_platform.js`):** End-to-end automated test suite covering all 34 required test categories on live Supabase.

---

### 2.4 Broken / Inconsistent
- **Service Name Conflict (`pharmacyService.js` vs `pharmacy.service.js`):**
  - `pharmacyService.js` (legacy) uses `from('orders')` with client-side inserts and `delivery_status`.
  - `pharmacy.service.js` (production) uses `from('medicine_orders')` and `from('pharmacy_inventory')`.
  - `OrderProcessing.jsx` and `PharmacyDashboard.jsx` import the legacy service instead of `pharmacy.service.js`!
- **RPC Signature Mismatch in `order.service.js`:**
  - `order.service.js` lines 111-115 calls `pharmacy_fulfill_prescription_tx` passing `p_action: action`.
  - The live PostgreSQL RPC signature is `(p_order_id UUID, p_pharmacy_id UUID, p_tracking_number TEXT DEFAULT NULL)`. Passing `p_action` triggers PostgREST parameter mismatch errors.

---

### 2.5 Security & Privacy Concerns
- **Role Alignment (`pharmacist` vs `pharmacy`):**
  - PostgreSQL `user_roles` constraint defines: `CHECK (role IN ('patient', 'doctor', 'pharmacist', 'admin', 'super_admin'))`. The canonical DB role is `'pharmacist'`.
  - Frontend route checks in `App.jsx` check `role === 'pharmacy'`.
  - *Remediation:* Normalize both `'pharmacist'` and `'pharmacy'` in `AuthContext`, `auth.service.js`, and `App.jsx` so access control is robust and aligned with DB truth.
- **Cross-Dispensary Isolation:**
  - Pharmacy A must never see or mutate Pharmacy B's inventory (`pharmacy_inventory`) or orders (`medicine_orders`).
  - Strict RLS check: `pharmacy_id = auth.uid()` must be validated both in UI queries and in PostgreSQL policies.
- **Patient Privacy Boundary:**
  - Pharmacies must receive ONLY the order items, patient contact for delivery, and attached prescription items.
  - Full clinical EHR (`medical_records`), consultations, and unrelated lab reports must NOT be queryable by pharmacies without explicit clinical access bridges.

---

### 2.6 Database Gap Analysis
- **Migration 0009 Assessment:**
  - Tables required: `pharmacies`, `pharmacy_inventory`, `medicines`, `medicine_orders`, `order_items`, `prescriptions`, `prescription_items`, `pharmacy_verifications`, `notifications`, `audit_logs`.
  - ALL 9 tables are present and active in the live database.
  - RPCs required: `create_medicine_order_tx`, `pharmacy_fulfill_prescription_tx`, `verify_pharmacy_tx`.
  - ALL 3 RPCs are present in PostgreSQL.
  - **Verdict:** NO database migrations are needed. Database baseline remains FROZEN.

---

## 3. Required Implementation Plan

1. **Service Layer Consolidation:**
   - Unify `pharmacy.service.js` with comprehensive methods for:
     - Dashboard aggregates (real SQL queries for orders, low stock, expiring batches, revenue).
     - Pharmacy-specific inventory (`pharmacy_inventory` joined with `medicines`).
     - Real-time orders queue with status filtering and prescription attachment details.
     - Atomic order fulfillment calling `pharmacy_fulfill_prescription_tx(p_order_id, p_pharmacy_id, p_tracking_number)`.
     - Order status transitions (Accept, Reject with reason, Mark Ready, Fulfill, Cancel).
     - Document upload to `pharmacy-documents` with signed URLs.
   - Deprecate/clean up references to legacy `pharmacyService.js`.
2. **Component Upgrades & Creations:**
   - **`PharmacyDashboard.jsx`:** Revamp with 100% real database aggregates and KPI cards.
   - **`InventoryManagement.jsx`:** Rewire to show pharmacy-specific stock, batch numbers, reorder thresholds, and inline restock/batch adjustments.
   - **`MedicineCatalog.jsx` (NEW):** Master drug directory (`/pharmacy/medicines`) with SKU, barcode, therapeutic category, dosage forms, and prescription requirements.
   - **`OrderProcessing.jsx`:** Full orders queue with tabs (Pending, Processing, Ready, Fulfilled, Cancelled) and live modal/detail view.
   - **`OrderDetails.jsx` (NEW / Modal):** Deep order inspection, patient address, attached Rx validation, and fulfillment workflow.
   - **`PharmacyVerification.jsx` (NEW):** Regulatory submission portal (`/pharmacy/verification`) with private document uploads and status tracking.
   - **`PharmacyAnalytics.jsx` (NEW):** Real database performance metrics (`/pharmacy/analytics`).
   - **`PharmacyProfile.jsx`:** Enhanced with authoritative `auth.uid()` profile binding and operating details.
3. **Routing & Navigation (`App.jsx`):**
   - Register routes:
     - `/pharmacy/dashboard`
     - `/pharmacy/orders`
     - `/pharmacy/orders/:id`
     - `/pharmacy/inventory`
     - `/pharmacy/batches`
     - `/pharmacy/medicines`
     - `/pharmacy/verification`
     - `/pharmacy/analytics`
     - `/pharmacy/profile`
   - Update sidebar navigation items for the pharmacy portal.
   - Ensure role check supports both `'pharmacist'` and `'pharmacy'`.
4. **Automated Verification Suite:**
   - Create `scripts/verify_phase6_pharmacy_platform.js` covering 34 test criteria.
   - Execute regression tests (Phase 4, Phase 5, Migration 0009, ML service, Frontend build).
