import { Env, getSystemConfig, jsonResponse } from './_db';
import { checkRateLimit } from './_ratelimit';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    // 1. Rate Limiting: Maksimal 5 deploy per 15 menit per IP
    const rateCheck = await checkRateLimit(context.env, context.request, 'deploy', 5, 900);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body: any = await context.request.json().catch(() => ({}));
    
    // Ambil GitHub PAT Token dari Database D1 / KV (dengan fallback ke Environment Variables)
    const patToken = await getSystemConfig(context.env, 'GITHUB_DISPATCH_PAT');

    // Fail gracefully if PAT is not configured on Cloudflare Database / Secrets
    if (!patToken) {
      return jsonResponse(
        {
          ok: false,
          error: 'Serverless configuration error: GITHUB_DISPATCH_PAT belum dikonfigurasi di Cloudflare Database atau Environment Secrets.',
        },
        500
      );
    }

    const {
      clientName,
      clientSlug,
      cfAccountId,
      cfApiToken,
      customDomainDashboard,
      customDomainApp,
      deployMode,
      seedDemoData,
    } = body;

    // Strict input validation to prevent injection or malicious dispatch payloads
    if (!clientName || typeof clientName !== 'string' || clientName.trim().length < 2 || clientName.trim().length > 100) {
      return jsonResponse({ ok: false, error: 'clientName wajib diisi (2-100 karakter).' }, 400);
    }

    if (!clientSlug || typeof clientSlug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clientSlug.trim()) || clientSlug.trim().length > 50) {
      return jsonResponse({ ok: false, error: 'Format clientSlug tidak valid (hanya huruf kecil, angka, dan tanda hubung).' }, 400);
    }

    if (!cfAccountId || typeof cfAccountId !== 'string' || !cfApiToken || typeof cfApiToken !== 'string') {
      return jsonResponse({ ok: false, error: 'cfAccountId dan cfApiToken wajib diisi.' }, 400);
    }

    if (cfApiToken.trim().length < 20 || cfApiToken.trim().length > 120) {
      return jsonResponse({ ok: false, error: 'Format Cloudflare API Token tidak valid.' }, 400);
    }

    // Validate Cloudflare Account ID format (typically 32 hex characters)
    const sanitizedAccountId = cfAccountId.trim();
    if (!/^[a-fA-F0-9]{32}$/.test(sanitizedAccountId)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Format Cloudflare Account ID tidak valid. Harus berupa 32 karakter hex.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize slug
    const cleanSlug = clientSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 50);

    const owner = context.env.GITHUB_REPO_OWNER || 'taufikmaul';
    const repo = context.env.GITHUB_REPO_NAME || 'ngabsen';
    const workflowFile = context.env.GITHUB_WORKFLOW_FILE || 'deploy.yml';

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;

    const githubRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${patToken.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Akugawe-Portal-Edge/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          client_name: String(clientName).slice(0, 100),
          client_slug: cleanSlug,
          cf_account_id: sanitizedAccountId,
          cf_api_token: cfApiToken.trim(),
          custom_domain_dashboard: customDomainDashboard ? String(customDomainDashboard).trim() : '',
          custom_domain_app: customDomainApp ? String(customDomainApp).trim() : '',
          deploy_mode: deployMode === 'seed' || deployMode === 'demo' ? deployMode : 'production',
          seed_demo_data: seedDemoData ? 'true' : 'false',
        },
      }),
    });

    if (githubRes.status === 204 || githubRes.ok) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: 'Deployment pipeline berhasil dipicu di GitHub Actions! Sistem sedang di-build di Cloud.',
          runUrl: `https://github.com/${owner}/${repo}/actions`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      const errorData: any = await githubRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          ok: false,
          error: errorData.message || `GitHub API Dispatch error (Status ${githubRes.status}).`,
        }),
        {
          status: githubRes.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err?.message || 'Internal Server Error pada proxy deployment.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
