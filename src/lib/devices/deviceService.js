import { supabase } from '../supabase';

export function generateAssetTag() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ASSET-${suffix}`;
}

export async function fetchDevices(userId, tenantId) {
  let query = supabase
    .from('devices')
    .select('*')
    .order('created_at', { ascending: false });

  query = tenantId ? query.eq('tenant_id', tenantId) : query.eq('user_id', userId);

  const { data, error } = await query;

  return { data: data ?? [], error };
}

export async function fetchDeviceById(userId, deviceId, tenantId) {
  let query = supabase
    .from('devices')
    .select('*')
    .eq('id', deviceId)
  query = tenantId ? query.eq('tenant_id', tenantId) : query.eq('user_id', userId);

  const { data, error } = await query.single();

  return { data, error };
}

export async function fetchDeviceNotes(deviceId) {
  const { data, error } = await supabase
    .from('device_notes')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: true });

  return { data: data ?? [], error };
}

export async function fetchDeviceActivity(deviceId) {
  const { data, error } = await supabase
    .from('device_activity')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function createDevice(userId, payload, actor) {
  const { data, error } = await supabase
    .from('devices')
    .insert({
      user_id: userId,
      tenant_id: payload.tenant_id || undefined,
      asset_tag: payload.asset_tag?.trim() || generateAssetTag(),
      name: payload.name.trim(),
      device_type: payload.device_type || 'Laptop',
      serial_number: payload.serial_number?.trim() || null,
      assigned_user: payload.assigned_user?.trim() || null,
      department: payload.department?.trim() || null,
      location: payload.location?.trim() || null,
      manufacturer: payload.manufacturer?.trim() || null,
      model: payload.model?.trim() || null,
      purchase_date: payload.purchase_date || null,
      warranty_expiry: payload.warranty_expiry || null,
      health_status: payload.health_status || 'Healthy',
      notes: payload.notes?.trim() || null,
    })
    .select()
    .single();

  if (data && !error) {
    await supabase.from('device_activity').insert({
      device_id: data.id,
      user_id: userId,
      type: 'system',
      message: 'created device asset',
      actor_name: actor.name,
      actor_email: actor.email,
    });
  }

  return { data, error };
}

function activityMessage(field, previousValue, newValue) {
  return `updated ${field.replace('_', ' ')} from ${previousValue || 'None'} to ${newValue || 'None'}`;
}

export async function updateDevice(userId, currentDevice, updates, actor) {
  const { data, error } = await supabase
    .from('devices')
    .update(updates)
    .eq('id', currentDevice.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return { data: null, error };

  const entries = Object.entries(updates)
    .filter(([field, value]) => String(currentDevice[field] ?? '') !== String(value ?? ''))
    .map(([field, value]) => ({
      device_id: currentDevice.id,
      user_id: userId,
      type: field === 'health_status' ? 'status_change' : 'field_update',
      field,
      previous_value: currentDevice[field] ?? null,
      new_value: value ?? null,
      message: activityMessage(field, currentDevice[field], value),
      actor_name: actor.name,
      actor_email: actor.email,
    }));

  if (entries.length > 0) {
    await supabase.from('device_activity').insert(entries);
  }

  return { data, error: null };
}

export async function deleteDevice(userId, deviceId) {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', userId);

  return { error };
}

export async function addDeviceNote(userId, deviceId, body, actor) {
  const { data, error } = await supabase
    .from('device_notes')
    .insert({
      device_id: deviceId,
      user_id: userId,
      body: body.trim(),
      author_name: actor.name,
      author_email: actor.email,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  await supabase.from('device_activity').insert({
    device_id: deviceId,
    user_id: userId,
    type: 'note',
    message: 'added device note',
    actor_name: actor.name,
    actor_email: actor.email,
  });

  return { data, error: null };
}

export function getDeviceErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  if (error.code === '42P01') return 'Devices table not found. Run supabase/devices-schema.sql.';
  return error.message ?? 'Something went wrong.';
}
