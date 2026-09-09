import { supabase } from '../lib/supabaseClient';

/**
 * Production Order Service
 * Manages medicine orders, atomic inventory decrementing, and delivery fulfillment.
 */
export const orderService = {
  // Place a new medicine order atomically with stock verification (Migration 0009 FEFO)
  async createOrder({ patientId, pharmacyId, prescriptionId = null, items, deliveryAddress, notes = '' }) {
    // Determine authenticated patient ID if not passed
    let pId = patientId;
    if (!pId) {
      const { data: { user } } = await supabase.auth.getUser();
      pId = user?.id;
    }
    if (!pId) {
      throw new Error('Authentication required: Patient must be signed in to place orders.');
    }

    const formattedItems = items.map(item => ({
      medicine_id: item.medicine_id || item.id,
      quantity: Number(item.quantity) || 1
    }));

    const orderNotes = notes || (prescriptionId ? `Attached Prescription: ${prescriptionId}` : '');

    const { data, error } = await supabase.rpc('create_medicine_order_tx', {
      p_patient_id: pId,
      p_pharmacy_id: pharmacyId,
      p_items: formattedItems,
      p_delivery_address: deliveryAddress,
      p_notes: orderNotes
    });

    if (error) throw new Error(this.friendlyError(error));
    return data;
  },

  // Cancel pending medicine order
  async cancelOrder(orderId) {
    const { data, error } = await supabase
      .from('medicine_orders')
      .update({
        order_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get orders placed by a patient
  async getPatientOrders(patientId) {
    const { data, error } = await supabase
      .from('medicine_orders')
      .select(`
        id,
        order_number,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        delivery_address,
        created_at,
        pharmacy:pharmacy_id (
          pharmacy_name,
          phone,
          address
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          medicine:medicine_id (
            brand_name,
            generic_name,
            dosage_form
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Update order delivery/fulfillment state
  async updateOrderStatus(orderId, orderStatus) {
    const { data, error } = await supabase
      .from('medicine_orders')
      .update({
        order_status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Module 5: Pharmacy Prescription Fulfillment & Tracking RPC
  async fulfillPrescriptionOrder(orderId, pharmacyId, trackingNumber = null) {
    const tracking = trackingNumber || `TRACK-${Date.now().toString().slice(-8)}`;
    const { data, error } = await supabase.rpc('pharmacy_fulfill_prescription_tx', {
      p_order_id: orderId,
      p_pharmacy_id: pharmacyId,
      p_tracking_number: tracking
    });

    if (error) throw new Error(error.message);
    return data;
  },

  friendlyError(err) {
    const msg = err.message || '';
    if (msg.includes('out of stock')) return 'One or more selected medicines are out of stock. Please adjust quantities.';
    if (msg.includes('Invalid quantity')) return 'Please specify a valid quantity for all medicines.';
    return msg || 'Failed to place order.';
  }
};
