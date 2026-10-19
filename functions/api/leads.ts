/**
 * Endpoint /api/leads
 * Sinkronisasi Data Prospek & Leads dari Mode Demo Aplikasi (app)
 * POST: Menerima data lead prospek dari demo app + trigger notifikasi Telegram
 * GET: Mengambil daftar prospek untuk ditampilkan di Admin Portal
 * OPTIONS: CORS Preflight
 */

import { Env, corsHeaders, handleOptions, jsonResponse, sendTelegramAlert } from './_db';

export const onRequestOptions = async () => {
  return handleOptions();
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const {
      email,
      name,
      phone,
      companyName,
      employeeCount,
      roleExplored = 'owner',
      source = 'app_demo',
    } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return jsonResponse({ ok: false, error: 'Email prospek wajib diisi.' }, 400);
    }

    const cleanPhone = (phone || '').trim();
    const cleanName = (name || '').trim();
    const cleanCompany = (companyName || '').trim();
    const cleanEmpCount = (employeeCount || '').trim();
    const leadId = crypto.randomUUID();

    if (context.env.DB) {
      // Periksa apakah email sudah ada di database leads
      const existing = await context.env.DB.prepare(
        'SELECT id, name, phone, company_name FROM leads WHERE email = ? LIMIT 1'
      ).bind(cleanEmail).first<any>();

      if (existing) {
        await context.env.DB.prepare(`
          UPDATE leads 
          SET name = COALESCE(?, name),
              phone = COALESCE(?, phone),
              company_name = COALESCE(?, company_name),
              employee_count = COALESCE(?, employee_count),
              role_explored = ?,
              source = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          cleanName || null,
          cleanPhone || null,
          cleanCompany || null,
          cleanEmpCount || null,
          roleExplored,
          source,
          existing.id
        ).run();
      } else {
        await context.env.DB.prepare(`
          INSERT INTO leads (
            id, email, name, phone, company_name, 
            employee_count, role_explored, source, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          leadId,
          cleanEmail,
          cleanName || null,
          cleanPhone || null,
          cleanCompany || null,
          cleanEmpCount || null,
          roleExplored,
          source
        ).run();
      }
    }

    // Kirim notifikasi instan ke Telegram Admin
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/\D/g, '')}` : null;
    const telegramText =
      `🔥 *NEW PROSPECT LEAD DARI DEMO APP!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Nama*: ${cleanName || '-'}\n` +
      `🏢 *Perusahaan*: *${cleanCompany || '-'}*\n` +
      `👥 *Karyawan*: ${cleanEmpCount || '-'}\n` +
      `📱 *WhatsApp*: ${cleanPhone || '-'}\n` +
      `✉️ *Email*: \`${cleanEmail}\`\n` +
      `🎯 *Role Demo*: ${roleExplored.toUpperCase()}\n` +
      `📍 *Sumber*: \`${source}\`\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      (waLink ? `👉 [Klik Chat WhatsApp Prospek](${waLink})` : `_Segera follow up untuk penawaran Free Tier 4 Bulan / Starter Rp 15rb!_`);

    await sendTelegramAlert(context.env, telegramText);

    return jsonResponse({
      ok: true,
      message: 'Lead berhasil disinkronkan ke Portal.',
      leadId,
    });
  } catch (err: any) {
    console.error('Error handling lead sync:', err);
    return jsonResponse({ ok: false, error: err?.message || 'Internal server error saat sync lead.' }, 500);
  }
};

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  try {
    if (context.env.DB) {
      const { results } = await context.env.DB.prepare(
        'SELECT * FROM leads ORDER BY created_at DESC LIMIT 200'
      ).all();

      const leads = (results || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        companyName: row.company_name,
        employeeCount: row.employee_count,
        roleExplored: row.role_explored,
        source: row.source,
        status: row.status,
        notes: row.notes,
        lastContactedAt: row.last_contacted_at,
        convertedOrderId: row.converted_order_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return jsonResponse({ ok: true, leads });
    }

    return jsonResponse({ ok: true, leads: [] });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message }, 500);
  }
};
