import { supabase } from '../lib/supabaseClient';

/**
 * Production Pharmacy Service
 * Direct integration with live Supabase database tables:
 * - pharmacies
 * - pharmacy_inventory
 * - medicines
 * - medicine_orders
 * - order_items
 * - pharmacy_verifications
 * - notifications
 * - audit_logs
 * - storage: pharmacy-documents
 */
export const pharmacyService = {
  // --------------------------------------------------------------------------
  // 1. MASTER MEDICINE CATALOG
  // --------------------------------------------------------------------------
  async getMedicines(searchTerm = '', category = 'All') {
    let query = supabase.from('medicines').select('*');

    if (category && category !== 'All') {
      query = query.eq('dosage_form', category.toLowerCase());
    }

    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      query = query.or(`brand_name.ilike.%${term}%,generic_name.ilike.%${term}%,manufacturer.ilike.%${term}%`);
    }

    const { data, error } = await query.order('brand_name', { ascending: true });
    if (error) {
      console.warn('Error querying medicines:', error.message);
      return [];
    }
    return (data || []).map(med => ({
      ...med,
      standard_price: med.price ?? 0,
      sku: `MED-${med.id.slice(0, 8).toUpperCase()}`,
      barcode: `890${med.id.replace(/\D/g, '').padEnd(10, '0').slice(0, 10)}`
    }));
  },

  // --------------------------------------------------------------------------
  // 2. PHARMACY INVENTORY & BATCH MANAGEMENT (FEFO)
  // --------------------------------------------------------------------------
  async getPharmacyInventory(pharmacyId) {
    if (!pharmacyId) return [];

    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        id,
        pharmacy_id,
        medicine_id,
        batch_number,
        expiry_date,
        stock_quantity,
        unit_price,
        reorder_level,
        created_at,
        updated_at,
        medicine:medicine_id (
          id,
          brand_name,
          generic_name,
          dosage_form,
          strength,
          manufacturer,
          requires_prescription,
          price
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.warn('Error fetching pharmacy inventory:', error.message);
      return [];
    }

    return (data || []).map(item => {
      const expiry = item.expiry_date ? new Date(item.expiry_date) : null;
      const now = new Date();
      const diffDays = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

      let stockStatus = 'in_stock';
      if (item.stock_quantity === 0) stockStatus = 'out_of_stock';
      else if (item.stock_quantity <= (item.reorder_level || 10)) stockStatus = 'low_stock';

      let expiryStatus = 'valid';
      if (diffDays !== null && diffDays <= 0) expiryStatus = 'expired';
      else if (diffDays !== null && diffDays <= 90) expiryStatus = 'near_expiry';

      return {
        ...item,
        diffDays,
        stockStatus,
        expiryStatus
      };
    });
  },

  async getBatches(pharmacyId) {
    return this.getPharmacyInventory(pharmacyId);
  },

  async saveBatch(pharmacyId, batchData) {
    const { id, medicine_id, stock_quantity, unit_price, batch_number, expiry_date, reorder_level } = batchData;
    const payload = {
      pharmacy_id: pharmacyId,
      medicine_id,
      stock_quantity: parseInt(stock_quantity, 10),
      unit_price: parseFloat(unit_price),
      batch_number: (batch_number || `BATCH-${Date.now().toString().slice(-6)}`).toUpperCase(),
      expiry_date: expiry_date || null,
      reorder_level: parseInt(reorder_level || 10, 10),
      updated_at: new Date().toISOString()
    };

    if (id) {
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .update(payload)
        .eq('id', id)
        .eq('pharmacy_id', pharmacyId)
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

  async deleteBatch(batchId, pharmacyId) {
    const { error } = await supabase
      .from('pharmacy_inventory')
      .delete()
      .eq('id', batchId)
      .eq('pharmacy_id', pharmacyId);
    if (error) throw new Error(error.message);
    return true;
  },

  // --------------------------------------------------------------------------
  // 3. ORDERS QUEUE & PRESCRIPTION DISPENSATION
  // --------------------------------------------------------------------------
  async getPharmacyOrders(pharmacyId, statusFilter = 'all') {
    if (!pharmacyId) return [];

    let query = supabase
      .from('medicine_orders')
      .select(`
        id,
        order_number,
        patient_id,
        pharmacy_id,
        prescription_id,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        delivery_address,
        notes,
        created_at,
        updated_at,
        patient:patient_id (
          id,
          full_name,
          phone,
          blood_group,
          gender
        ),
        prescription:prescription_id (
          id,
          rx_id,
          diagnosis,
          medicines,
          instructions,
          general_advice,
          doctor:doctor_id (
            full_name,
            specialization,
            clinic_name
          )
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          medicine:medicine_id (
            id,
            brand_name,
            generic_name,
            dosage_form,
            strength,
            requires_prescription
          )
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('order_status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error querying pharmacy orders:', error.message);
      return [];
    }
    return data || [];
  },

  async getOrderDetails(orderId, pharmacyId) {
    const { data, error } = await supabase
      .from('medicine_orders')
      .select(`
        id,
        order_number,
        patient_id,
        pharmacy_id,
        prescription_id,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        delivery_address,
        notes,
        created_at,
        updated_at,
        patient:patient_id (
          id,
          full_name,
          phone,
          blood_group,
          gender
        ),
        prescription:prescription_id (
          id,
          rx_id,
          diagnosis,
          medicines,
          instructions,
          general_advice,
          doctor:doctor_id (
            full_name,
            specialization,
            clinic_name,
            license_number
          )
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          medicine:medicine_id (
            id,
            brand_name,
            generic_name,
            dosage_form,
            strength,
            requires_prescription
          )
        )
      `)
      .eq('id', orderId)
      .eq('pharmacy_id', pharmacyId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Transition order status
  async updateOrderStatus(orderId, pharmacyId, newStatus, notes = null) {
    const updates = {
      order_status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (notes) updates.notes = notes;

    const { data, error } = await supabase
      .from('medicine_orders')
      .update(updates)
      .eq('id', orderId)
      .eq('pharmacy_id', pharmacyId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Notify patient
    if (data?.patient_id) {
      await supabase.from('notifications').insert({
        user_id: data.patient_id,
        title: `Order Status Update: ${newStatus.toUpperCase()}`,
        message: `Your prescription order #${data.order_number} has been updated to: ${newStatus.replace(/_/g, ' ')}.`,
        type: 'order',
        notification_type: 'order',
        metadata: { order_id: orderId, status: newStatus }
      }).catch(() => null);
    }

    return data;
  },

  // Order acceptance: confirmed -> processing
  async acceptOrder(orderId, pharmacyId) {
    return this.updateOrderStatus(orderId, pharmacyId, 'processing', 'Order accepted and sent to dispensary workbench.');
  },

  // Order rejection: -> cancelled
  async rejectOrder(orderId, pharmacyId, reason = 'Out of stock') {
    return this.updateOrderStatus(orderId, pharmacyId, 'cancelled', `Order rejected by pharmacy. Reason: ${reason}`);
  },

  // Order packing: processing -> packed
  async markOrderPacked(orderId, pharmacyId) {
    return this.updateOrderStatus(orderId, pharmacyId, 'packed', 'Medicines verified and sealed in delivery packaging.');
  },

  // Fulfill / Dispatch order via atomic stored procedure
  async fulfillOrder(orderId, pharmacyId, trackingNumber = null) {
    const tracking = trackingNumber || `TRACK-${Date.now().toString().slice(-8)}`;
    const { data, error } = await supabase.rpc('pharmacy_fulfill_prescription_tx', {
      p_order_id: orderId,
      p_pharmacy_id: pharmacyId,
      p_tracking_number: tracking
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Mark delivered: shipped -> delivered
  async markOrderDelivered(orderId, pharmacyId) {
    return this.updateOrderStatus(orderId, pharmacyId, 'delivered', 'Prescription medication delivered to recipient.');
  },

  // --------------------------------------------------------------------------
  // 4. REAL DATABASE DASHBOARD AGGREGATES
  // --------------------------------------------------------------------------
  async getPharmacyDashboard(pharmacyId) {
    if (!pharmacyId) {
      return {
        orders: [],
        todayOrdersCount: 0,
        pendingOrdersCount: 0,
        acceptedOrdersCount: 0,
        readyOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalInventoryItems: 0,
        lowStockCount: 0,
        expiringBatchesCount: 0,
        totalRevenue: 0,
        recentActivity: [],
        notifications: []
      };
    }

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [ordersRes, inventoryRes, notifsRes] = await Promise.all([
        supabase
          .from('medicine_orders')
          .select(`
            id,
            order_number,
            patient_id,
            total_amount,
            order_status,
            payment_method,
            payment_status,
            delivery_address,
            created_at,
            patient:patient_id (full_name, phone),
            prescription:prescription_id (rx_id)
          `)
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('pharmacy_inventory')
          .select('id, stock_quantity, reorder_level, expiry_date, unit_price')
          .eq('pharmacy_id', pharmacyId),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', pharmacyId)
          .order('created_at', { ascending: false })
          .limit(6)
      ]);

      const orders = ordersRes.data || [];
      const inventory = inventoryRes.data || [];
      const notifications = notifsRes.data || [];

      const now = new Date();
      let lowStockCount = 0;
      let expiringBatchesCount = 0;

      inventory.forEach(item => {
        if (item.stock_quantity <= (item.reorder_level || 10)) {
          lowStockCount++;
        }
        if (item.expiry_date) {
          const exp = new Date(item.expiry_date);
          const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
          if (diffDays <= 90) {
            expiringBatchesCount++;
          }
        }
      });

      const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
      const pendingOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed');
      const acceptedOrders = orders.filter(o => o.order_status === 'processing');
      const readyOrders = orders.filter(o => o.order_status === 'packed' || o.order_status === 'shipped');
      const deliveredOrders = orders.filter(o => o.order_status === 'delivered');

      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        orders,
        todayOrdersCount: todayOrders.length,
        pendingOrdersCount: pendingOrders.length,
        acceptedOrdersCount: acceptedOrders.length,
        readyOrdersCount: readyOrders.length,
        deliveredOrdersCount: deliveredOrders.length,
        totalInventoryItems: inventory.length,
        lowStockCount,
        expiringBatchesCount,
        totalRevenue,
        recentActivity: orders.slice(0, 5),
        notifications
      };
    } catch (err) {
      console.error('Error computing pharmacy dashboard aggregates:', err);
      return {
        orders: [],
        todayOrdersCount: 0,
        pendingOrdersCount: 0,
        acceptedOrdersCount: 0,
        readyOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalInventoryItems: 0,
        lowStockCount: 0,
        expiringBatchesCount: 0,
        totalRevenue: 0,
        recentActivity: [],
        notifications: []
      };
    }
  },

  // --------------------------------------------------------------------------
  // 5. REAL DATABASE PHARMACY ANALYTICS
  // --------------------------------------------------------------------------
  async getPharmacyAnalytics(pharmacyId) {
    if (!pharmacyId) return null;

    const [ordersRes, inventoryRes] = await Promise.all([
      supabase
        .from('medicine_orders')
        .select(`
          id,
          total_amount,
          order_status,
          created_at,
          order_items (
            quantity,
            total_price,
            medicine:medicine_id (brand_name, generic_name)
          )
        `)
        .eq('pharmacy_id', pharmacyId),
      supabase
        .from('pharmacy_inventory')
        .select(`
          id,
          stock_quantity,
          unit_price,
          reorder_level,
          expiry_date,
          medicine:medicine_id (brand_name)
        `)
        .eq('pharmacy_id', pharmacyId)
    ]);

    const orders = ordersRes.data || [];
    const inventory = inventoryRes.data || [];

    // Orders by status
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    orders.forEach(o => {
      const s = o.order_status || 'confirmed';
      if (statusCounts[s] !== undefined) statusCounts[s]++;
    });

    // Revenue
    const completedOrders = orders.filter(o => o.order_status === 'delivered');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // Inventory Value
    const totalInventoryValue = inventory.reduce((sum, i) => sum + (Number(i.unit_price || 0) * Number(i.stock_quantity || 0)), 0);

    // Top Dispensed Medicines
    const medSales = {};
    orders.forEach(o => {
      if (o.order_status === 'delivered' && o.order_items) {
        o.order_items.forEach(oi => {
          const name = oi.medicine?.brand_name || 'Standard Medicine';
          medSales[name] = (medSales[name] || 0) + (oi.quantity || 1);
        });
      }
    });

    const topMedicines = Object.entries(medSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders: orders.length,
      statusCounts,
      totalRevenue,
      totalInventoryValue,
      totalInventoryBatches: inventory.length,
      topMedicines
    };
  },

  // --------------------------------------------------------------------------
  // 6. PHARMACY PROFILE & REGULATORY VERIFICATION
  // --------------------------------------------------------------------------
  async getPharmacyProfile(pharmacyId) {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', pharmacyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Pharmacy profile fetch notice:', error.message);
    }
    return data || null;
  },

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

  async getPharmacyVerification(pharmacyId) {
    const { data, error } = await supabase
      .from('pharmacy_verifications')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Verification record notice:', error.message);
    }
    return data || null;
  },

  async uploadPharmacyDocument(pharmacyId, file, documentType = 'Drug License') {
    const fileExt = file.name.split('.').pop();
    const cleanDocName = documentType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filePath = `${pharmacyId}/${Date.now()}_${cleanDocName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pharmacy-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Document upload failed: ${uploadError.message}`);

    const existingVerification = await this.getPharmacyVerification(pharmacyId);
    const prevDocs = existingVerification?.submitted_documents || [];
    const newDoc = {
      type: documentType,
      path: filePath,
      file_name: file.name,
      uploaded_at: new Date().toISOString()
    };

    const { data, error: dbError } = await supabase
      .from('pharmacy_verifications')
      .insert({
        pharmacy_id: pharmacyId,
        submitted_documents: [...prevDocs, newDoc],
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);
    return filePath;
  },

  async getDocumentSignedUrl(path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from('pharmacy-documents')
      .createSignedUrl(path, expiresIn);

    if (error) throw new Error(error.message);
    return data?.signedUrl;
  },

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
  }
};
