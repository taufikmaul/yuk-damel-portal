import { loadSellerConfig } from './config';

export interface DispatchDeployPayload {
  clientName: string;
  clientSlug: string;
  cfAccountId: string;
  cfApiToken: string;
  customDomainDashboard?: string;
  customDomainApp?: string;
  deployMode: 'production' | 'seed' | 'demo'; // 'production' (polos bersih), 'seed' (data awal usaha), 'demo' (data dummy interaktif)
  seedDemoData?: boolean;
}

export interface DispatchResult {
  success: boolean;
  message: string;
  runUrl?: string;
}

/**
 * Memicu eksekusi GitHub Actions Workflow via Edge Serverless Function (/api/deploy)
 * PAT Token dikelola secara aman di Cloudflare Pages Environment Secrets (GITHUB_DISPATCH_PAT).
 */
export async function triggerGitHubDeploy(payload: DispatchDeployPayload): Promise<DispatchResult> {
  const config = loadSellerConfig();

  // Layer 1: Attempt Edge Serverless Function (/api/deploy) - Recommended & Secure
  try {
    const edgeRes = await fetch('/api/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientName: payload.clientName,
        clientSlug: payload.clientSlug,
        cfAccountId: payload.cfAccountId,
        cfApiToken: payload.cfApiToken,
        customDomainDashboard: payload.customDomainDashboard || '',
        customDomainApp: payload.customDomainApp || '',
        deployMode: payload.deployMode,
        seedDemoData: payload.seedDemoData ?? (payload.deployMode === 'demo'),
      }),
    });

    if (edgeRes.ok) {
      const data = await edgeRes.json();
      if (data.ok) {
        return {
          success: true,
          message: data.message || 'Deployment pipeline berhasil dipicu di Cloudflare Pages / GitHub Actions!',
          runUrl: data.runUrl,
        };
      }
    } else {
      const errorData = await edgeRes.json().catch(() => ({}));
      if (errorData.error && !errorData.error.includes('Serverless configuration error')) {
        return {
          success: false,
          message: errorData.error,
        };
      }
    }
  } catch (_) {
    // If running in local Vite dev without Pages Functions, proceed to local fallback check
  }

  // Layer 2: Local development fallback using optional browser PAT if configured
  const patToken = config.githubPatToken?.trim();
  if (!patToken) {
    return {
      success: false,
      message:
        'Pipeline deployment gagal: GITHUB_DISPATCH_PAT belum dikonfigurasi di Cloudflare Pages Secrets (atau GitHub PAT belum diisi di menu Admin Config).',
    };
  }

  let owner = 'taufikmaul';
  let repo = 'ngabsen';
  try {
    const urlParts = config.githubRepoUrl.replace('https://github.com/', '').split('/');
    if (urlParts.length >= 2) {
      owner = urlParts[0];
      repo = urlParts[1];
    }
  } catch (_) {}

  const workflowFile = config.githubWorkflowFile || 'deploy.yml';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${patToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          client_name: payload.clientName,
          client_slug: payload.clientSlug,
          cf_account_id: payload.cfAccountId,
          cf_api_token: payload.cfApiToken,
          custom_domain_dashboard: payload.customDomainDashboard || '',
          custom_domain_app: payload.customDomainApp || '',
          deploy_mode: payload.deployMode,
          seed_demo_data: payload.deployMode === 'demo' ? 'true' : 'false',
        },
      }),
    });

    if (res.status === 204 || res.ok) {
      return {
        success: true,
        message: 'Deployment pipeline berhasil dipicu di GitHub Actions! Sistem sedang di-build di Cloud.',
        runUrl: `https://github.com/${owner}/${repo}/actions`,
      };
    } else {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Gagal memicu GitHub Actions (Status ${res.status}).`,
      };
    }
  } catch (err: any) {
    console.error('GitHub dispatch error:', err);
    return {
      success: false,
      message: err?.message || 'Gagal menghubungi server GitHub API.',
    };
  }
}
