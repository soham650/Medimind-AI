import { supabase } from '../lib/supabaseClient';

/**
 * Core Service 5: Pharmacy & Order Service
 * Manages medicine catalog, pharmacy inventory, digital Rx attachment,
 * cart checkout (Online/COD), and order fulfillment.
 */
export const pharmacyService = {
  // Get approved pharmacies
  async getApprovedPharmacies() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, name, pharmacy_name, pharmacy_address, gst_number')
      .eq('role', 'pharmacy')
      .eq('approval_status', 'approved');

    if (error) {
      console.warn('Could not fetch approved pharmacies:', error.message);
      return [];
    }
    return data || [];
  },

  // Get medicines catalog
  async getMedicines() {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .order('brand_name', { ascending: true });

    if (error) {
      console.warn('Fallback medicines catalog used:', error.message);
      return [
        { id: 'm1', brand_name: 'Paracetamol 650', generic_name: 'Acetaminophen', standard_price: 30.00, requires_prescription: false },
        { id: 'm2', brand_name: 'Augmentin 625', generic_name: 'Amoxicillin + Clavulanic Acid', standard_price: 210.00, requires_prescription: true },
        { id: 'm3', brand_name: 'Metformin 500', generic_name: 'Metformin Hydrochloride', standard_price: 45.00, requires_prescription: true },
        { id: 'm4', brand_name: 'Amlodipine 5', generic_name: 'Amlodipine Besylate', standard_price: 35.00, requires_prescription: true },
        { id: 'm5', brand_name: 'Cetirizine 10', generic_name: 'Cetirizine Hydrochloride', standard_price: 25.00, requires_prescription: false },
        { id: 'm6', brand_name: 'Pantoprazole 40', generic_name: 'Pantoprazole Sodium', standard_price: 90.00, requires_prescription: false }
      ];
    }
    return data || [];
  },

  // Place medicine order with pharmacy
  async placeOrder({ patientId, pharmacyId, prescriptionId = null, items = [], totalAmount, paymentMethod = 'online', deliveryAddress }) {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        patient_id: patientId,
        pharmacy_id: pharmacyId,
        prescription_id: prescriptionId,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
        delivery_status: 'processing',
        delivery_address: deliveryAddress
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items if items array is provided
    if (items.length > 0) {
      const orderItems = items.map(item => ({
        order_id: order.id,
        medicine_id: item.id,
        quantity: item.quantity,
        unit_price: item.price || item.standard_price,
        total_price: (item.price || item.standard_price) * item.quantity
      }));
      await supabase.from('order_items').insert(orderItems);
    }

    return order;
  },

  // Pharmacy view of received orders
  async getPharmacyOrders(pharmacyId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        patient:patient_id (full_name, mobile),
        prescription:prescription_id (rx_id, diagnosis, medicines)
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update order delivery status (e.g. ready_for_pickup, completed)
  async updateOrderStatus(orderId, deliveryStatus) {
    try {
      const action = deliveryStatus === 'completed' || deliveryStatus === 'delivered' ? 'deliver' :
                     deliveryStatus === 'dispatched' || deliveryStatus === 'out_for_delivery' ? 'dispatch' :
                     deliveryStatus === 'dispensed' || deliveryStatus === 'ready_for_pickup' ? 'dispense' : 'accept';

      await supabase.rpc('pharmacy_fulfill_prescription_tx', {
        p_order_id: orderId,
        p_pharmacy_id: '00000000-0000-0000-0000-000000000001',
        p_action: action
      });
    } catch (e) {
      console.warn('RPC fulfillment fallback:', e.message);
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ delivery_status: deliveryStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
