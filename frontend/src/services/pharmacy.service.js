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
  },

  // Get batches with lot numbers and expiry dates
  async getBatches(pharmacyId) {
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        id,
        pharmacy_id,
        medicine_id,
        stock_quantity,
        unit_price,
        reorder_level,
        batch_number,
        expiry_date,
        is_available,
        updated_at,
        medicine:medicine_id (
          id,
          brand_name,
          generic_name,
          category,
          dosage_form,
          manufacturer
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.warn('Batches query notice:', error.message);
      return [];
    }
    return data || [];
  },

  // Add or update an inventory batch
  async saveBatch(pharmacyId, batchData) {
    const { id, medicine_id, stock_quantity, unit_price, batch_number, expiry_date, reorder_level } = batchData;
    const payload = {
      pharmacy_id: pharmacyId,
      medicine_id,
      stock_quantity: parseInt(stock_quantity, 10),
      unit_price: parseFloat(unit_price),
      batch_number: batch_number || `BATCH-${Date.now().toString().slice(-5)}`,
      expiry_date: expiry_date || null,
      reorder_level: parseInt(reorder_level || 15, 10),
      is_available: parseInt(stock_quantity, 10) > 0,
      updated_at: new Date().toISOString()
    };

    if (id) {
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  },

  // Get pharmacy profile
  async getPharmacyProfile(pharmacyId) {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', pharmacyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Pharmacy profile notice:', error.message);
    }
    return data || null;
  },

  // Update pharmacy profile
  async updatePharmacyProfile(pharmacyId, updates) {
    const { id, created_at, verification_status, ...allowedUpdates } = updates;
    const { data, error } = await supabase
      .from('pharmacies')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', pharmacyId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Upload pharmacy verification document to pharmacy-documents bucket
  async uploadPharmacyDocument(pharmacyId, file, documentType = 'Drug License') {
    const fileExt = file.name.split('.').pop();
    const filePath = `${pharmacyId}/${Date.now()}_${documentType.toLowerCase().replace(/\s+/g, '_')}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pharmacy-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Document upload failed: ${uploadError.message}`);

    await supabase.from('pharmacy_verifications').insert({
      pharmacy_id: pharmacyId,
      submitted_documents: [{
        type: documentType,
        path: filePath,
        file_name: file.name,
        uploaded_at: new Date().toISOString()
      }],
      status: 'pending'
    });

    return filePath;
  }
};
