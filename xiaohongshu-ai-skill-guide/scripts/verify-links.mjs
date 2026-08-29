import { fileURLToPath } from 'node:url';
import { SKILLS } from '../src/data/skills.js';

function asResult(url, response, method) {
  const finalUrl = response.url || url;
  return {
    url,
    status: response.status,
    method,
    reachable: response.ok,
    redirected: Boolean(response.redirected) || finalUrl !== url,
    finalUrl
  };
}

async function verifyOne(url, fetchImpl) {
  try {
    const head = await fetchImpl(url, { method: 'HEAD', redirect: 'follow' });
    if (head.ok) return asResult(url, head, 'HEAD');
  } catch {
    // Some hosts block HEAD at the transport layer; GET is still authoritative.
  }

  try {
    const get = await fetchImpl(url, { method: 'GET', redirect: 'follow' });
    return asResult(url, get, 'GET');
  } catch (error) {
    return {
      url,
      status: null,
      method: 'HEAD',
      reachable: false,
      redirected: false,
      finalUrl: url,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Verify release links without adding browser-bundle dependencies.
 * HEAD is attempted first; GitHub-compatible GET fallback handles hosts that
 * reject HEAD while preserving redirect and final-status information.
 */
export async function verifyLinks(urls, fetchImpl = fetch, { concurrency = 6 } = {}) {
  if (!Array.isArray(urls)) throw new TypeError('urls must be an array');
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('concurrency must be a positive integer');

  const results = new Array(urls.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (nextIndex < urls.length) {
      const index = nextIndex++;
      results[index] = await verifyOne(urls[index], fetchImpl);
    }
  });
  await Promise.all(workers);
  return results;
}

async function runCli() {
  const results = await verifyLinks(SKILLS.map((skill) => skill.githubUrl));
  const failures = results.filter((result) => !result.reachable);
  for (const result of results) {
    console.log(`${result.reachable ? 'OK' : 'FAIL'} ${result.status ?? 'network'} ${result.method} ${result.url}`);
  }
  if (failures.length > 0) {
    console.error(`${failures.length}/${results.length} catalog links are unreachable.`);
    process.exitCode = 1;
    return;
  }
  console.log(`Verified ${results.length} catalog links.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runCli();
