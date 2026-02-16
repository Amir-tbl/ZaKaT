import {httpsCallable} from 'firebase/functions';
import {functions} from '../../lib/firebase';

// Export admin check functions
export {isCurrentUserAdmin, isUserAdmin} from './adminService';

/**
 * Initialize the treasury (one-time setup)
 * Must be called by an admin user
 */
export async function initializeTreasury(): Promise<{success: boolean; message: string}> {
  const fn = httpsCallable(functions, 'initializeTreasury');
  const result = await fn({});
  return result.data as {success: boolean; message: string};
}

/**
 * Verify a request (admin only)
 */
export async function verifyRequest(requestId: string): Promise<{success: boolean; message: string}> {
  const fn = httpsCallable(functions, 'verifyRequest');
  const result = await fn({requestId});
  return result.data as {success: boolean; message: string};
}

/**
 * Reject a request (admin only)
 */
export async function rejectRequest(requestId: string, reason?: string): Promise<{success: boolean; message: string}> {
  const fn = httpsCallable(functions, 'rejectRequest');
  const result = await fn({requestId, reason});
  return result.data as {success: boolean; message: string};
}

/**
 * Verify a post (admin only)
 */
export async function verifyPost(postId: string): Promise<{success: boolean; message: string}> {
  const fn = httpsCallable(functions, 'verifyPost');
  const result = await fn({postId});
  return result.data as {success: boolean; message: string};
}

/**
 * Reject a post (admin only)
 */
export async function rejectPost(postId: string, reason?: string): Promise<{success: boolean; message: string}> {
  const fn = httpsCallable(functions, 'rejectPost');
  const result = await fn({postId, reason});
  return result.data as {success: boolean; message: string};
}

/**
 * Verify an organization (admin only)
 */
export async function verifyOrganization(organizationId: string): Promise<{success: boolean; message: string}> {
  const fn = httpsCallable(functions, 'verifyOrganization');
  const result = await fn({organizationId});
  return result.data as {success: boolean; message: string};
}

/**
 * Reject an organization (admin only)
 */
export async function rejectOrganization(organizationId: string, reason?: string): Promise<{success: boolean; message: string}> {
  const fn = httpsCallable(functions, 'rejectOrganization');
  const result = await fn({organizationId, reason});
  return result.data as {success: boolean; message: string};
}
