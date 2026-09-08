-- ============================================================================
-- MEDIMIND AI — MIGRATION 0009: PRODUCTION ISSUE REMEDIATION
-- ============================================================================
-- Narrowly scoped, idempotent, and non-destructive.
-- Addresses:
-- 1. Multi-Batch Inventory Decrement: Deterministic FEFO/FIFO Batch Allocation
--    with row-locking (FOR UPDATE) in create_medicine_order_tx.
-- 2. Doctor Access RLS: Participant SELECT policy on patient_doctor_access
--    and recursion-safe has_patient_doctor_access() SECURITY DEFINER helper.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ISSUE 1: DETERMINISTIC MULTI-BATCH FEFO ALLOCATION IN create_medicine_order_tx
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_medicine_order_tx(
    p_patient_id UUID,
    p_pharmacy_id UUID,
    p_items JSONB,
    p_delivery_address TEXT,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_total_calculated NUMERIC(10,2) := 0.00;
    v_item JSONB;
    v_med_id UUID;
    v_qty INTEGER;
    v_total_stock_for_med INTEGER;
    v_remaining_to_fulfill INTEGER;
    v_batch_rec RECORD;
    v_deduct INTEGER;
    v_med_total NUMERIC(10,2);
BEGIN
    -- 1. Authorization: Only the patient or an administrator can place orders
    IF auth.uid() <> p_patient_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User cannot place orders on behalf of another patient';
    END IF;

    -- 2. Validate non-empty item list
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Order requires at least one medicine item.';
    END IF;

    -- 3. Pre-flight & Row-Locking Batch Allocation per Medicine Item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_med_id := (v_item->>'medicine_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;
        v_med_total := 0.00;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity for medicine item %', v_med_id;
        END IF;

        -- Check total available stock across all active batches for this pharmacy and medicine
        SELECT COALESCE(SUM(stock_quantity), 0) INTO v_total_stock_for_med
        FROM public.pharmacy_inventory
        WHERE pharmacy_id = p_pharmacy_id 
          AND medicine_id = v_med_id 
          AND stock_quantity > 0;

        IF v_total_stock_for_med = 0 THEN
            RAISE EXCEPTION 'Medicine % is not stocked or out of stock at selected pharmacy', v_med_id;
        END IF;

        IF v_total_stock_for_med < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for medicine %. Available: %, Requested: %', v_med_id, v_total_stock_for_med, v_qty;
        END IF;

        -- Deterministic FEFO (First-Expiry, First-Out) Allocation
        -- Locks only the candidate batches for update
        v_remaining_to_fulfill := v_qty;

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

            -- Deduct only from the specific allocated batch row
            UPDATE public.pharmacy_inventory
            SET stock_quantity = stock_quantity - v_deduct,
                updated_at = NOW()
            WHERE id = v_batch_rec.id;

            v_med_total := v_med_total + (v_batch_rec.unit_price * v_deduct);
            v_remaining_to_fulfill := v_remaining_to_fulfill - v_deduct;
        END LOOP;

        IF v_remaining_to_fulfill > 0 THEN
            RAISE EXCEPTION 'Concurrent allocation conflict: Unable to fulfill requested quantity for medicine %', v_med_id;
        END IF;

        v_total_calculated := v_total_calculated + v_med_total;
    END LOOP;

    -- 4. Create the Master Order
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    INSERT INTO public.medicine_orders (
        order_number, patient_id, pharmacy_id, total_amount, payment_method,
        payment_status, order_status, delivery_address, notes
    )
    VALUES (
        v_order_number, p_patient_id, p_pharmacy_id, v_total_calculated, 'cash_on_delivery',
        'pending', 'confirmed', p_delivery_address, p_notes
    )
    RETURNING id INTO v_order_id;

    -- 5. Record Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_med_id := (v_item->>'medicine_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;

        -- Retrieve current catalogue unit price or default
        SELECT unit_price INTO v_batch_rec.unit_price
        FROM public.pharmacy_inventory
        WHERE pharmacy_id = p_pharmacy_id AND medicine_id = v_med_id
        ORDER BY expiry_date ASC
        LIMIT 1;

        INSERT INTO public.order_items (
            order_id, medicine_id, quantity, unit_price, total_price
        )
        VALUES (
            v_order_id, v_med_id, v_qty, COALESCE(v_batch_rec.unit_price, 0.00), (COALESCE(v_batch_rec.unit_price, 0.00) * v_qty)
        );
    END LOOP;

    -- 6. Emit real-time notification to the pharmacy
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_pharmacy_id,
        'New Prescription Order Received',
        'Order ' || v_order_number || ' received. Total: ₹' || v_total_calculated,
        'order',
        'order',
        jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_calculated
    );
END;
$$;

-- Ensure privileged execution permissions remain strictly enforced
REVOKE ALL ON FUNCTION public.create_medicine_order_tx(UUID, UUID, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_medicine_order_tx(UUID, UUID, JSONB, TEXT, TEXT) TO authenticated;


-- ----------------------------------------------------------------------------
-- ISSUE 2: PATIENT_DOCTOR_ACCESS RLS PARTICIPANT SELECT POLICY & HELPER
-- ----------------------------------------------------------------------------

-- Ensure RLS is enabled on patient_doctor_access
ALTER TABLE public.patient_doctor_access ENABLE ROW LEVEL SECURITY;

-- 1. Helper function: has_patient_doctor_access (Immune to RLS recursion)
CREATE OR REPLACE FUNCTION public.has_patient_doctor_access(p_patient_id UUID, p_doctor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.patient_doctor_access
        WHERE patient_id = p_patient_id
          AND doctor_id = p_doctor_id
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > now())
    );
$$;

REVOKE ALL ON FUNCTION public.has_patient_doctor_access(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_patient_doctor_access(UUID, UUID) TO authenticated;

-- 2. Participant-only SELECT policy
DROP POLICY IF EXISTS "patient_doctor_access_participant_select" ON public.patient_doctor_access;
CREATE POLICY "patient_doctor_access_participant_select" ON public.patient_doctor_access
FOR SELECT TO authenticated
USING (
    auth.uid() = patient_id 
    OR auth.uid() = doctor_id 
    OR public.is_admin()
);

-- 3. Patient manage policy (patients can grant/revoke their own doctor access; admins can manage)
DROP POLICY IF EXISTS "patient_doctor_access_patient_manage" ON public.patient_doctor_access;
CREATE POLICY "patient_doctor_access_patient_manage" ON public.patient_doctor_access
FOR ALL TO authenticated
USING (
    auth.uid() = patient_id OR public.is_admin()
)
WITH CHECK (
    auth.uid() = patient_id OR public.is_admin()
);

-- ============================================================================
-- END OF MIGRATION 0009
-- ============================================================================
