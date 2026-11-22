export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

/**
 * Fetches JSON strictly, checking HTTP status and Content-Type before calling .json().
 * Throws descriptive errors including HTTP status code and request URL if HTML or non-JSON is returned.
 */
export async function fetchJsonStrict<T = any>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { timeoutMs = 25000, retries = 0, ...fetchInit } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const externalSignal = fetchInit.signal;
    let didTimeout = false;

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        throw new Error(`Request to ${url} was cancelled.`);
      }
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const timer = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isJson = contentType.includes('application/json');

      if (!response.ok) {
        let serverDetail = '';
        if (isJson) {
          try {
            const errJson = await response.json();
            serverDetail = errJson?.error || errJson?.message || '';
          } catch {
            // ignore body parse failure on error response
          }
        }
        const statusSummary = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
        const contentNote = isJson ? '' : ` (received "${contentType || 'non-JSON'}")`;
        throw new Error(
          serverDetail
            ? `${serverDetail} [${statusSummary} from ${url}]`
            : `Live request to ${url} failed with ${statusSummary}${contentNote}.`
        );
      }

      if (!isJson) {
        throw new Error(
          `Expected application/json response from ${url} (HTTP ${response.status}), but received "${contentType || 'unknown content-type'}".`
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (didTimeout) {
        lastError = new Error(`Request to ${url} timed out after ${Math.round(timeoutMs / 1000)}s.`);
      } else if (err?.name === 'AbortError') {
        throw new Error(`Request to ${url} was cancelled.`);
      } else {
        lastError = err instanceof Error ? err : new Error(String(err || `Request to ${url} failed.`));
      }

      // Retry only on transient timeout or 502/503/504 errors when retries remain
      const msg = lastError.message;
      const isTransient =
        didTimeout ||
        msg.includes('HTTP 502') ||
        msg.includes('HTTP 503') ||
        msg.includes('HTTP 504') ||
        msg.includes('Failed to fetch');

      if (attempt < retries && isTransient) {
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  throw lastError || new Error(`Request to ${url} failed.`);
}
