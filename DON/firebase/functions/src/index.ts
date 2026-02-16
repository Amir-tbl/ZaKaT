import * as admin from 'firebase-admin';
import {setGlobalOptions} from 'firebase-functions/v2';
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {defineSecret} from 'firebase-functions/params';
import * as nodemailer from 'nodemailer';

// Set region to Europe (matching Firestore EUR3)
setGlobalOptions({region: 'europe-west3'});

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Gmail secrets
const gmailUser = defineSecret('GMAIL_USER');
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD');

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: gmailUser.value(),
      pass: gmailAppPassword.value(),
    },
  });

  await transporter.sendMail({
    from: `"ZaKaT" <${gmailUser.value()}>`,
    to,
    subject,
    html,
  });
}

async function isAdmin(uid: string): Promise<boolean> {
  const adminDoc = await db.collection('admins').doc(uid).get();
  return adminDoc.exists;
}

async function requireAdmin(uid: string | undefined): Promise<void> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  const adminStatus = await isAdmin(uid);
  if (!adminStatus) {
    throw new HttpsError('permission-denied', 'User must be an admin');
  }
}

// ============================================
// ADMIN FUNCTIONS - REQUESTS
// ============================================

export const verifyRequest = onCall(async (request) => {
  const {requestId} = request.data;
  const uid = request.auth?.uid;

  await requireAdmin(uid);

  if (!requestId || typeof requestId !== 'string') {
    throw new HttpsError('invalid-argument', 'requestId is required');
  }

  const requestRef = db.collection('requests').doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new HttpsError('not-found', 'Request not found');
  }

  await requestRef.update({
    status: 'verified',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: uid,
  });

  // Create notification for the author
  const requestData = requestDoc.data();
  if (requestData?.authorUid) {
    await db.collection('notifications').add({
      userId: requestData.authorUid,
      type: 'request_verified',
      title: 'Demande approuvee',
      body: 'Votre demande a ete verifiee et est maintenant visible.',
      targetType: 'request',
      targetId: requestId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {success: true, message: 'Request verified successfully'};
});

export const rejectRequest = onCall(async (request) => {
  const {requestId, reason} = request.data;
  const uid = request.auth?.uid;

  await requireAdmin(uid);

  if (!requestId || typeof requestId !== 'string') {
    throw new HttpsError('invalid-argument', 'requestId is required');
  }

  const requestRef = db.collection('requests').doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new HttpsError('not-found', 'Request not found');
  }

  await requestRef.update({
    status: 'rejected',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: uid,
    reviewNote: reason || 'Demande rejetee',
  });

  // Create notification for the author
  const requestData = requestDoc.data();
  if (requestData?.authorUid) {
    await db.collection('notifications').add({
      userId: requestData.authorUid,
      type: 'request_rejected',
      title: 'Demande rejetee',
      body: reason || 'Votre demande n\'a pas ete approuvee.',
      targetType: 'request',
      targetId: requestId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {success: true, message: 'Request rejected successfully'};
});

// ============================================
// ADMIN FUNCTIONS - POSTS
// ============================================

export const verifyPost = onCall(async (request) => {
  const {postId} = request.data;
  const uid = request.auth?.uid;

  await requireAdmin(uid);

  if (!postId || typeof postId !== 'string') {
    throw new HttpsError('invalid-argument', 'postId is required');
  }

  const postRef = db.collection('posts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw new HttpsError('not-found', 'Post not found');
  }

  await postRef.update({
    status: 'verified',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: uid,
  });

  // Create notification for the author
  const postData = postDoc.data();
  if (postData?.authorUid) {
    await db.collection('notifications').add({
      userId: postData.authorUid,
      type: 'post_verified',
      title: 'Publication approuvee',
      body: 'Votre publication a ete verifiee et est maintenant visible.',
      targetType: 'post',
      targetId: postId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {success: true, message: 'Post verified successfully'};
});

export const rejectPost = onCall(async (request) => {
  const {postId, reason} = request.data;
  const uid = request.auth?.uid;

  await requireAdmin(uid);

  if (!postId || typeof postId !== 'string') {
    throw new HttpsError('invalid-argument', 'postId is required');
  }

  const postRef = db.collection('posts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw new HttpsError('not-found', 'Post not found');
  }

  await postRef.update({
    status: 'rejected',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: uid,
    reviewNote: reason || 'Publication rejetee',
  });

  // Create notification for the author
  const postData = postDoc.data();
  if (postData?.authorUid) {
    await db.collection('notifications').add({
      userId: postData.authorUid,
      type: 'post_rejected',
      title: 'Publication rejetee',
      body: reason || 'Votre publication n\'a pas ete approuvee.',
      targetType: 'post',
      targetId: postId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {success: true, message: 'Post rejected successfully'};
});

// ============================================
// ADMIN FUNCTIONS - ORGANIZATIONS
// ============================================

export const verifyOrganization = onCall(async (request) => {
  const {organizationId} = request.data;
  const uid = request.auth?.uid;

  await requireAdmin(uid);

  if (!organizationId || typeof organizationId !== 'string') {
    throw new HttpsError('invalid-argument', 'organizationId is required');
  }

  const orgRef = db.collection('organizations').doc(organizationId);
  const orgDoc = await orgRef.get();

  if (!orgDoc.exists) {
    throw new HttpsError('not-found', 'Organization not found');
  }

  await orgRef.update({
    status: 'verified',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: uid,
  });

  // Create notification for the owner
  const orgData = orgDoc.data();
  if (orgData?.ownerUid) {
    await db.collection('notifications').add({
      userId: orgData.ownerUid,
      type: 'organization_verified',
      title: 'Organisation approuvee',
      body: `Votre organisation "${orgData.name}" a ete verifiee.`,
      targetType: 'organization',
      targetId: organizationId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {success: true, message: 'Organization verified successfully'};
});

export const rejectOrganization = onCall(async (request) => {
  const {organizationId, reason} = request.data;
  const uid = request.auth?.uid;

  await requireAdmin(uid);

  if (!organizationId || typeof organizationId !== 'string') {
    throw new HttpsError('invalid-argument', 'organizationId is required');
  }

  const orgRef = db.collection('organizations').doc(organizationId);
  const orgDoc = await orgRef.get();

  if (!orgDoc.exists) {
    throw new HttpsError('not-found', 'Organization not found');
  }

  await orgRef.update({
    status: 'rejected',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: uid,
    reviewNote: reason || 'Organisation rejetee',
  });

  // Create notification for the owner
  const orgData = orgDoc.data();
  if (orgData?.ownerUid) {
    await db.collection('notifications').add({
      userId: orgData.ownerUid,
      type: 'organization_rejected',
      title: 'Organisation rejetee',
      body: reason || 'Votre organisation n\'a pas ete approuvee.',
      targetType: 'organization',
      targetId: organizationId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {success: true, message: 'Organization rejected successfully'};
});

// ============================================
// DONATION FUNCTIONS
// ============================================

export const processDonation = onCall(async (request) => {
  const {targetType, targetId, amountCents, donorUid, donorName, isAnonymous, message} = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (uid !== donorUid) {
    throw new HttpsError('permission-denied', 'Cannot donate on behalf of another user');
  }

  if (!targetType || !['treasury', 'request', 'organization'].includes(targetType)) {
    throw new HttpsError('invalid-argument', 'Invalid targetType');
  }

  if (!amountCents || typeof amountCents !== 'number' || amountCents < 100) {
    throw new HttpsError('invalid-argument', 'Amount must be at least 100 cents');
  }

  const batch = db.batch();

  // Create donation record
  const donationRef = db.collection('donations').doc();
  batch.set(donationRef, {
    donorUid,
    donorName: isAnonymous ? 'Anonyme' : donorName,
    isAnonymous: isAnonymous || false,
    amountCents,
    targetType,
    targetId: targetId || null,
    message: message || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update target counters
  if (targetType === 'request' && targetId) {
    const requestRef = db.collection('requests').doc(targetId);
    batch.update(requestRef, {
      receivedAmountCents: admin.firestore.FieldValue.increment(amountCents),
      donorCount: admin.firestore.FieldValue.increment(1),
    });
  } else if (targetType === 'organization' && targetId) {
    const orgRef = db.collection('organizations').doc(targetId);
    batch.update(orgRef, {
      walletBalanceCents: admin.firestore.FieldValue.increment(amountCents),
    });
  } else if (targetType === 'treasury') {
    const treasuryRef = db.collection('treasury').doc('main');
    batch.update(treasuryRef, {
      balanceCents: admin.firestore.FieldValue.increment(amountCents),
      totalDonationsCount: admin.firestore.FieldValue.increment(1),
    });
  }

  await batch.commit();

  return {success: true, donationId: donationRef.id};
});

// ============================================
// TRIGGER: New Follow Notification
// ============================================

export const onNewFollow = onDocumentCreated('follows/{followId}', async (event) => {
  const followData = event.data?.data();
  if (!followData) return;

  const {followingType, followingId, followerUid} = followData;

  // Get follower info
  const followerDoc = await db.collection('users').doc(followerUid).get();
  const followerData = followerDoc.data();
  const followerName = followerData?.displayName ||
    `${followerData?.firstName || ''} ${followerData?.lastName || ''}`.trim() ||
    'Quelqu\'un';

  let targetUserId: string | null = null;

  if (followingType === 'organization') {
    const orgDoc = await db.collection('organizations').doc(followingId).get();
    targetUserId = orgDoc.data()?.ownerUid || null;
  } else if (followingType === 'user') {
    targetUserId = followingId;
  }

  if (targetUserId && targetUserId !== followerUid) {
    await db.collection('notifications').add({
      userId: targetUserId,
      type: 'new_follower',
      title: 'Nouvel abonne',
      message: `${followerName} s'est abonne a vous.`,
      body: `${followerName} s'est abonne a vous.`,
      targetType: 'user',
      targetId: followerUid,
      // Extra data for action button
      actionLabel: 'Voir le profil',
      actionType: 'view_profile',
      followerName: followerName,
      followerUid: followerUid,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

// ============================================
// TRIGGER: New Donation Notification
// ============================================

function formatAmountEUR(amountCents: number): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const onNewDonation = onDocumentCreated('donations/{donationId}', async (event) => {
  const donationData = event.data?.data();
  if (!donationData) return;

  const {targetType, targetId, donorName, amountCents} = donationData;
  const amountFormatted = formatAmountEUR(amountCents);

  let targetUserId: string | null = null;
  let requestTitle: string | null = null;
  let organizationName: string | null = null;

  if (targetType === 'request' && targetId) {
    const requestDoc = await db.collection('requests').doc(targetId).get();
    const requestData = requestDoc.data();
    targetUserId = requestData?.authorUid || null;
    requestTitle = requestData?.title || null;
  } else if (targetType === 'organization' && targetId) {
    const orgDoc = await db.collection('organizations').doc(targetId).get();
    const orgData = orgDoc.data();
    targetUserId = orgData?.ownerUid || null;
    organizationName = orgData?.name || null;
  }

  if (targetUserId) {
    // Build detailed message
    let message = `Vous avez recu un don de ${amountFormatted} de la part de ${donorName}`;
    if (requestTitle) {
      message += ` pour votre demande "${requestTitle}"`;
    } else if (organizationName) {
      message += ` pour votre association "${organizationName}"`;
    }
    message += '.';

    await db.collection('notifications').add({
      userId: targetUserId,
      type: 'donation_received',
      title: 'Don recu',
      message: message,
      body: message,
      targetType: targetType,
      targetId: targetId,
      // Extra data for display
      donorName: donorName,
      amountCents: amountCents,
      amountFormatted: amountFormatted,
      requestTitle: requestTitle,
      organizationName: organizationName,
      actionLabel: 'Voir la demande',
      actionType: targetType === 'request' ? 'view_request' : 'view_organization',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

// ============================================
// ADMIN: Initialize Treasury (one-time setup)
// ============================================

export const initializeTreasury = onCall(async (request) => {
  const uid = request.auth?.uid;
  await requireAdmin(uid);

  const treasuryRef = db.collection('treasury').doc('main');
  const treasuryDoc = await treasuryRef.get();

  if (treasuryDoc.exists) {
    throw new HttpsError('already-exists', 'Treasury already initialized');
  }

  await treasuryRef.set({
    balanceCents: 0,
    totalDonationsCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {success: true, message: 'Treasury initialized'};
});

// ============================================
// PASSWORD RESET (6-digit code via email)
// ============================================

export const sendPasswordResetCode = onCall(
  {secrets: [gmailUser, gmailAppPassword]},
  async (request) => {
    const {email} = request.data;

    if (!email || typeof email !== 'string') {
      throw new HttpsError('invalid-argument', 'Email is required');
    }

    // Verify email exists in Firebase Auth
    try {
      await admin.auth().getUserByEmail(email);
    } catch {
      throw new HttpsError(
        'not-found',
        'Aucun compte associe a cet email'
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any existing codes for this email
    const existingCodes = await db
      .collection('passwordResetCodes')
      .where('email', '==', email)
      .where('used', '==', false)
      .get();
    const batch = db.batch();
    existingCodes.docs.forEach((d) => batch.update(d.ref, {used: true}));
    if (!existingCodes.empty) await batch.commit();

    // Store code in Firestore
    await db.collection('passwordResetCodes').add({
      email,
      code,
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 2 * 60 * 1000)
      ),
      used: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send email
    await sendEmail(
      email,
      'ZaKaT - Code de reinitialisation',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0EA5A4; margin: 0;">ZaKaT</h1>
        </div>
        <h2 style="color: #0F172A; text-align: center;">Reinitialisation du mot de passe</h2>
        <p style="color: #64748B; text-align: center;">
          Utilisez le code ci-dessous pour reinitialiser votre mot de passe.
          Ce code est valable pendant 2 minutes.
        </p>
        <div style="background: #F6FAFB; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0EA5A4;">${code}</span>
        </div>
        <p style="color: #64748B; font-size: 13px; text-align: center;">
          Si vous n'avez pas demande cette reinitialisation, ignorez cet email.
        </p>
      </div>
      `
    );

    return {success: true};
  }
);

export const verifyPasswordResetCode = onCall(async (request) => {
  const {email, code} = request.data;

  if (!email || !code) {
    throw new HttpsError('invalid-argument', 'Email and code are required');
  }

  const snapshot = await db
    .collection('passwordResetCodes')
    .where('email', '==', email)
    .where('code', '==', code)
    .where('used', '==', false)
    .get();

  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Code invalide');
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.expiresAt.toDate() < new Date()) {
    throw new HttpsError('deadline-exceeded', 'Le code a expire');
  }

  return {success: true};
});

export const confirmPasswordReset = onCall(async (request) => {
  const {email, code, newPassword} = request.data;

  if (!email || !code || !newPassword) {
    throw new HttpsError(
      'invalid-argument',
      'Email, code and new password are required'
    );
  }

  if (newPassword.length < 6) {
    throw new HttpsError(
      'invalid-argument',
      'Le mot de passe doit contenir au moins 6 caracteres'
    );
  }

  // Verify the code again
  const snapshot = await db
    .collection('passwordResetCodes')
    .where('email', '==', email)
    .where('code', '==', code)
    .where('used', '==', false)
    .get();

  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Code invalide');
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.expiresAt.toDate() < new Date()) {
    throw new HttpsError('deadline-exceeded', 'Le code a expire');
  }

  // Update password
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, {password: newPassword});

  // Mark code as used
  await doc.ref.update({used: true});

  return {success: true};
});

// ============================================
// TRIGGER: Welcome Email on Profile Creation
// ============================================

export const onUserProfileCreated = onDocumentCreated(
  {
    document: 'users/{userId}',
    secrets: [gmailUser, gmailAppPassword],
  },
  async (event) => {
    const userData = event.data?.data();
    if (!userData) return;

    const email = userData.email;
    if (!email) return;

    const displayName =
      userData.displayName ||
      `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
      '';

    const greeting = displayName ? `Bonjour ${displayName},` : 'Bonjour,';

    await sendEmail(
      email,
      'Bienvenue sur ZaKaT !',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0EA5A4; margin: 0;">ZaKaT</h1>
        </div>
        <h2 style="color: #0F172A; text-align: center;">Bienvenue sur ZaKaT !</h2>
        <p style="color: #0F172A; font-size: 16px;">${greeting}</p>
        <p style="color: #64748B; line-height: 1.6;">
          Nous sommes ravis de vous accueillir dans la communaute ZaKaT.
          Notre plateforme vous permet de faire des dons et d'aider ceux qui en ont besoin.
        </p>
        <p style="color: #64748B; line-height: 1.6;">
          Vous pouvez des maintenant :
        </p>
        <ul style="color: #64748B; line-height: 1.8;">
          <li>Decouvrir les demandes d'aide</li>
          <li>Faire un don a ceux qui en ont besoin</li>
          <li>Publier vos propres demandes</li>
          <li>Rejoindre des associations</li>
        </ul>
        <div style="text-align: center; margin: 32px 0;">
          <span style="background: #0EA5A4; color: white; padding: 12px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Ouvrez l'app pour commencer
          </span>
        </div>
        <p style="color: #64748B; font-size: 13px; text-align: center;">
          Merci de faire partie de ZaKaT.
        </p>
      </div>
      `
    );
  }
);
