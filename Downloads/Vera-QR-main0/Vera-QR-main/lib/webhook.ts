import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase/types';

// Webhook event types
export type WebhookEvent = 
  | 'order.created'
  | 'order.updated'
  | 'order.completed'
  | 'order.cancelled';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  restaurant_id: string;
  data: any;
  metadata?: {
    table_number?: string;
    customer_name?: string;
    [key: string]: any;
  };
}

export interface WebhookConfig {
  id: string;
  restaurant_id: string;
  name: string;
  url: string;
  secret_key: string;
  events: string[];
  is_active: boolean;
  retry_enabled: boolean;
  max_retries: number;
  timeout_seconds: number;
  custom_headers?: Record<string, string>;
}

/**
 * Generate HMAC SHA256 signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Send webhook with retry logic
 */
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload,
  attemptNumber: number = 1
): Promise<{
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  responseTimeMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, config.secret_key);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'VERAQR-Webhook/1.0',
    'X-Webhook-Event': payload.event,
    'X-Webhook-Signature': signature,
    'X-Webhook-Timestamp': payload.timestamp,
    'X-Webhook-Attempt': attemptNumber.toString(),
    ...config.custom_headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout_seconds * 1000
    );

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTimeMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => '');

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.substring(0, 10000), // Limit to 10KB
      responseTimeMs,
    };
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    return {
      success: false,
      responseTimeMs,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Log webhook delivery attempt
 */
export async function logWebhookDelivery(
  supabase: ReturnType<typeof createClient<Database>>,
  {
    webhookConfigId,
    restaurantId,
    eventType,
    eventId,
    requestUrl,
    requestHeaders,
    requestBody,
    requestSignature,
    responseStatus,
    responseBody,
    responseTimeMs,
    status,
    attemptNumber,
    errorMessage,
    nextRetryAt,
  }: {
    webhookConfigId: string;
    restaurantId: string;
    eventType: string;
    eventId: string;
    requestUrl: string;
    requestHeaders: Record<string, string>;
    requestBody: any;
    requestSignature: string;
    responseStatus?: number;
    responseBody?: string;
    responseTimeMs: number;
    status: 'pending' | 'success' | 'failed' | 'retrying';
    attemptNumber: number;
    errorMessage?: string;
    nextRetryAt?: Date;
  }
) {
  const { error } = await (supabase.from('webhook_logs') as any).insert({
    webhook_config_id: webhookConfigId,
    restaurant_id: restaurantId,
    event_type: eventType,
    event_id: eventId,
    request_url: requestUrl,
    request_method: 'POST',
    request_headers: requestHeaders,
    request_body: requestBody,
    request_signature: requestSignature,
    response_status: responseStatus,
    response_body: responseBody,
    response_time_ms: responseTimeMs,
    status,
    attempt_number: attemptNumber,
    error_message: errorMessage,
    delivered_at: status === 'success' ? new Date().toISOString() : null,
    next_retry_at: nextRetryAt?.toISOString(),
  });

  if (error) {
    console.error('Failed to log webhook delivery:', error);
  }
}

/**
 * Calculate exponential backoff delay for retries
 */
export function calculateRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 1min, 5min, 30min
  const delays = [60, 300, 1800]; // seconds
  return delays[Math.min(attemptNumber - 1, delays.length - 1)] * 1000;
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  supabase: ReturnType<typeof createClient<Database>>,
  restaurantId: string,
  event: WebhookEvent,
  eventId: string,
  data: any,
  metadata?: Record<string, any>
): Promise<void> {
  // Fetch active webhook configs for this restaurant and event
  const { data: configs, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (error) {
    console.error('Failed to fetch webhook configs:', error);
    return;
  }

  if (!configs || configs.length === 0) {
    return; // No webhooks configured
  }

  const timestamp = new Date().toISOString();
  const payload: WebhookPayload = {
    event,
    timestamp,
    restaurant_id: restaurantId,
    data,
    metadata,
  };

  // Send webhooks in parallel
  const deliveryPromises = configs.map(async (config: any) => {
    const result = await sendWebhook(config as any, payload, 1);

    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, config.secret_key);

    // Determine status
    let status: 'success' | 'failed' | 'retrying' = result.success
      ? 'success'
      : 'failed';
    let nextRetryAt: Date | undefined;

    if (!result.success && config.retry_enabled && config.max_retries > 1) {
      status = 'retrying';
      nextRetryAt = new Date(Date.now() + calculateRetryDelay(1));
    }

    // Log the delivery
    await logWebhookDelivery(supabase, {
      webhookConfigId: config.id,
      restaurantId: config.restaurant_id,
      eventType: event,
      eventId,
      requestUrl: config.url,
      requestHeaders: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
      },
      requestBody: payload,
      requestSignature: signature,
      responseStatus: result.statusCode,
      responseBody: result.responseBody,
      responseTimeMs: result.responseTimeMs,
      status,
      attemptNumber: 1,
      errorMessage: result.error,
      nextRetryAt,
    });

    // Update last_triggered_at
    await (supabase
      .from('webhook_configs') as any)
      .update({ last_triggered_at: timestamp })
      .eq('id', config.id);
  });

  await Promise.allSettled(deliveryPromises);
}

/**
 * Retry failed webhooks (should be called by a cron job)
 */
export async function retryFailedWebhooks(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<void> {
  const now = new Date();

  // Fetch pending retries
  const { data: logs, error } = await (supabase
    .from('webhook_logs')
    .select('*, webhook_configs(*)')
    .eq('status', 'retrying')
    .lte('next_retry_at', now.toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(100) as any);

  if (error || !logs || logs.length === 0) {
    return;
  }

  for (const log of logs as any[]) {
    const config = log.webhook_configs as any;
    if (!config || !config.is_active) continue;

    const nextAttempt = log.attempt_number + 1;
    if (nextAttempt > config.max_retries) {
      // Max retries reached, mark as failed
      await (supabase
        .from('webhook_logs') as any)
        .update({
          status: 'failed',
          error_message: `Max retries (${config.max_retries}) exceeded`,
        })
        .eq('id', log.id);
      continue;
    }

    // Retry the webhook
    const result = await sendWebhook(
      config,
      log.request_body as WebhookPayload,
      nextAttempt
    );

    let status: 'success' | 'failed' | 'retrying' = result.success
      ? 'success'
      : 'failed';
    let nextRetryAt: Date | undefined;

    if (!result.success && nextAttempt < config.max_retries) {
      status = 'retrying';
      nextRetryAt = new Date(Date.now() + calculateRetryDelay(nextAttempt));
    }

    // Log the retry attempt
    await logWebhookDelivery(supabase, {
      webhookConfigId: config.id,
      restaurantId: log.restaurant_id,
      eventType: log.event_type,
      eventId: log.event_id,
      requestUrl: config.url,
      requestHeaders: log.request_headers as Record<string, string>,
      requestBody: log.request_body,
      requestSignature: log.request_signature,
      responseStatus: result.statusCode,
      responseBody: result.responseBody,
      responseTimeMs: result.responseTimeMs,
      status,
      attemptNumber: nextAttempt,
      errorMessage: result.error,
      nextRetryAt,
    });

    // Update original log if this was the final attempt
    if (status === 'failed' || status === 'success') {
      await (supabase
        .from('webhook_logs') as any)
        .update({ status })
        .eq('id', log.id);
    }
  }
}
