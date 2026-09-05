import { supabase } from '../lib/supabaseClient';

/**
 * Production Pharmacy Service
 * Real queries for master medicines catalog, pharmacy inventory, and stock levels.
 */
export const pharmacyService = {
  // Get master medicines catalog
  async getMedicines(searchTerm = '', category = 'All') {
    let query = supabase.from('medicines').select('*');

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (searchTerm && searchTerm.trim()) {
      query = query.or(`brand_name.ilike.%${searchTerm.trim()}%,generic_name.ilike.%${searchTerm.trim()}%`);
    }

    const { data, error } = await query.order('brand_name', { ascending: true });
    if (error) {
      console.warn('Error querying medicines:', error.message);
      return [];
    }
    return data || [];
  },

  // Get approved pharmacies for dispensing
  async getApprovedPharmacies() {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, pharmacy_name, contact_person, phone, address, drug_license_number, gstin')
      .eq('verification_status', 'approved')
      .eq('is_active', true);

    if (error) {
      console.warn('Error fetching approved pharmacies:', error.message);
      return [];
    }
    return data || [];
  },

  // Get stock for specific pharmacy
  async getPharmacyInventory(pharmacyId) {
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        id,
        stock_quantity,
        unit_price,
        reorder_level,
        is_available,
        medicine:medicine_id (*)
      `)
      .eq('pharmacy_id', pharmacyId);

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Update inventory pricing/stock
  async updateStock(pharmacyId, medicineId, stockQuantity, unitPrice) {
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .upsert({
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        stock_quantity: stockQuantity,
        unit_price: unitPrice,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Aggregated data for Pharmacy Dashboard
  async getPharmacyDashboard(pharmacyId) {
    try {
      const [ordersRes, inventoryRes] = await Promise.all([
        supabase
          .from('medicine_orders')
          .select(`
            id,
            order_number,
            total_amount,
            order_status,
            payment_method,
            payment_status,
            delivery_address,
            created_at,
            patient:patient_id (full_name, phone)
          `)
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('pharmacy_inventory')
          .select('id, stock_quantity, reorder_level')
          .eq('pharmacy_id', pharmacyId)
      ]);

      const orders = ordersRes.data || [];
      const inventory = inventoryRes.data || [];

      const pendingOrders = orders.filter(o => o.order_status !== 'delivered' && o.order_status !== 'cancelled');
      const completedOrders = orders.filter(o => o.order_status === 'delivered');
      const lowStockCount = inventory.filter(i => i.stock_quantity <= (i.reorder_level || 10)).length;

      return {
        orders,
        pendingOrdersCount: pendingOrders.length,
        completedOrdersCount: completedOrders.length,
        lowStockItemsCount: lowStockCount,
        totalRevenue: completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      };
    } catch (err) {
      console.error('Error loading pharmacy dashboard:', err);
      return {
        orders: [],
        pendingOrdersCount: 0,
        completedOrdersCount: 0,
        lowStockItemsCount: 0,
        totalRevenue: 0
      };
    }
  }
};
