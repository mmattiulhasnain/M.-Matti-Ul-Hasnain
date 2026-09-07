import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, 
  onSnapshot, writeBatch, query, orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Candidate } from '../types';
import { records as seedRecords } from '../data';
import { parseSeniority, parseLocation, getDefaultRate } from '../utils';

const COLLECTION_NAME = 'candidates';
const ADMIN_PASSKEY_STORAGE_KEY = 'mihora_talent_admin_key';

export const getAdminPasskey = (): string => {
  try {
    return sessionStorage.getItem(ADMIN_PASSKEY_STORAGE_KEY) || 'MIHORAtlnt@1';
  } catch {
    return 'MIHORAtlnt@1';
  }
};

export const setAdminPasskey = (key: string): void => {
  try {
    sessionStorage.setItem(ADMIN_PASSKEY_STORAGE_KEY, key.trim());
  } catch {
    // Session storage not accessible
  }
};

// Sanitize data deeply for Firestore to guarantee no undefined fields are passed
export const cleanForFirestore = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.filter(v => v !== undefined).map(cleanForFirestore);
  }
  const cleaned: any = {};
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (val !== undefined) {
      cleaned[k] = cleanForFirestore(val);
    }
  }
  return JSON.parse(JSON.stringify(cleaned));
};

// Enrich initial seed records with parsed metadata, seniority and custom compensation fields
export const enrichCandidate = (raw: any): Candidate => {
  const seniority = raw.seniority || parseSeniority(raw.experience, raw.role);
  const { country, city } = parseLocation(raw.location);

  const hasHourly = typeof raw.hourlyRate === 'number' && !isNaN(raw.hourlyRate) && raw.hourlyRate > 0;
  const hasSalary = typeof raw.salaryExpectation === 'number' && !isNaN(raw.salaryExpectation) && raw.salaryExpectation > 0;
  const hasMinSalary = typeof raw.minSalary === 'number' && !isNaN(raw.minSalary) && raw.minSalary > 0;

  const result: Candidate = {
    id: raw.id,
    name: raw.name || 'Anonymous Candidate',
    role: raw.role || 'Unspecified Role',
    skills: raw.skills || '',
    experience: raw.experience || '',
    seniority,
    specialization: raw.specialization || '',
    location: raw.location || '',
    country,
    city,
    email: raw.email || '',
    whatsapp: raw.whatsapp || '',
    portfolio: raw.portfolio || '',
    cv: raw.cv || '',
    cvFileName: raw.cvFileName || (raw.cv ? 'Online CV / Portfolio' : ''),
    cvFileType: raw.cvFileType || '',
    cvFileData: raw.cvFileData || '',
    currency: raw.currency || 'USD',
    compensationType: raw.compensationType || (hasHourly ? 'Hourly' : hasSalary ? 'Monthly Salary' : undefined),
    employmentType: raw.employmentType || undefined,
    compensationNotes: raw.compensationNotes || undefined,
    benefits: Array.isArray(raw.benefits) ? raw.benefits : undefined,
    status: raw.status || 'Active',
    notes: raw.notes || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    updatedBy: raw.updatedBy || 'System',
    pipelineStage: raw.pipelineStage || 'Available on Bench',
  };

  if (hasHourly) result.hourlyRate = raw.hourlyRate;
  if (hasSalary) result.salaryExpectation = raw.salaryExpectation;
  if (hasMinSalary) result.minSalary = raw.minSalary;
  if (raw.scorecard) result.scorecard = raw.scorecard;
  if (raw.preferredTimezones) result.preferredTimezones = raw.preferredTimezones;

  return cleanForFirestore(result);
};

/**
 * Real-time Firestore Subscription.
 * Subscribes to the live candidate roster.
 * If the collection is empty or has fewer records than verified records, automatically seeds/merges verified candidates.
 */
export const subscribeToCandidates = (
  onData: (candidates: Candidate[]) => void,
  onError: (err: any) => void
) => {
  const candidatesRef = collection(db, COLLECTION_NAME);

  const unsubscribe = onSnapshot(candidatesRef, async (snapshot) => {
    try {
      if (snapshot.empty) {
        console.log("Firestore candidates collection is empty. Bootstrapping initial records...");
        const batch = writeBatch(db);
        const enrichedSeeds = seedRecords.map(enrichCandidate);
        
        for (const item of enrichedSeeds) {
          const docRef = doc(db, COLLECTION_NAME, item.id);
          batch.set(docRef, cleanForFirestore(item));
        }
        await batch.commit();
        onData(enrichedSeeds);
        return;
      }

      // If new records were added to the verified roster that aren't in Firestore yet, merge them
      if (snapshot.size < seedRecords.length) {
        console.log(`Firestore has ${snapshot.size} records. Synchronizing with ${seedRecords.length} verified roster candidates...`);
        const existingIds = new Set(snapshot.docs.map(d => d.id));
        const missingSeeds = seedRecords.filter(r => !existingIds.has(r.id)).map(enrichCandidate);
        
        if (missingSeeds.length > 0) {
          const batch = writeBatch(db);
          for (const item of missingSeeds) {
            const docRef = doc(db, COLLECTION_NAME, item.id);
            batch.set(docRef, cleanForFirestore(item));
          }
          await batch.commit();
          // The next snapshot trigger will receive all merged records
          return;
        }
      }

      const list: Candidate[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Candidate;
        const hasHourly = typeof data.hourlyRate === 'number' && !isNaN(data.hourlyRate) && data.hourlyRate > 0;
        const hasSalary = typeof data.salaryExpectation === 'number' && !isNaN(data.salaryExpectation) && data.salaryExpectation > 0;
        const hasMinSalary = typeof data.minSalary === 'number' && !isNaN(data.minSalary) && data.minSalary > 0;

        list.push({
          ...data,
          id: docSnap.id,
          hourlyRate: hasHourly ? data.hourlyRate : undefined,
          salaryExpectation: hasSalary ? data.salaryExpectation : undefined,
          minSalary: hasMinSalary ? data.minSalary : undefined,
          currency: data.currency || 'USD',
          compensationType: data.compensationType,
          employmentType: data.employmentType,
          compensationNotes: data.compensationNotes,
          benefits: data.benefits
        });
      });

      // Sort by ID naturally
      list.sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      onData(list);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      onError(error);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    onError(error);
  });

  return unsubscribe;
};

/**
 * Force-sync the entire verified dataset to Firestore and the server backend.
 * Replaces/merges the complete roster with the latest verified data.
 */
export const syncDatabaseWithSeedRecords = async (): Promise<number> => {
  const enrichedSeeds = seedRecords.map(raw => {
    const candidate = enrichCandidate(raw);
    const cleaned: any = cleanForFirestore(candidate);
    // Delete any key whose value is undefined
    for (const key of Object.keys(cleaned)) {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    }
    return cleaned;
  });

  try {
    const batch = writeBatch(db);
    for (const item of enrichedSeeds) {
      const docRef = doc(db, COLLECTION_NAME, item.id);
      batch.set(docRef, item, { merge: true });
    }
    await batch.commit();
  } catch (batchErr) {
    console.warn("WriteBatch sync encountered error, falling back to resilient document sets:", batchErr);
    // Resilient fallback: write individually via setDoc
    for (const item of enrichedSeeds) {
      try {
        const docRef = doc(db, COLLECTION_NAME, item.id);
        await setDoc(docRef, item, { merge: true });
      } catch (docErr) {
        console.warn(`Fallback sync for ${item.id} skipped:`, docErr);
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/sync-database', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPasskey()
        },
        body: JSON.stringify(enrichedSeeds)
      });
    } catch (err) {
      console.warn("Backend sync notification failed:", err);
    }
  }

  return enrichedSeeds.length;
};

/**
 * Add Candidate to Firestore in real-time
 */
export const addCandidateToFirestore = async (candidate: Partial<Candidate>, userEmail?: string): Promise<Candidate> => {
  const id = candidate.id || `ID-${Date.now().toString().slice(-4)}`;
  const enriched = enrichCandidate({
    ...candidate,
    id,
    updatedBy: userEmail || 'Recruiter',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, cleanForFirestore(enriched));
    
    // Also sync to server local storage as backup with admin authorization header
    fetch('/api/records', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-password': getAdminPasskey()
      },
      body: JSON.stringify(enriched)
    }).catch(() => {});

    return enriched;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};

/**
 * Update Candidate with Backend Authorization & Verification.
 * Sends the edit request to the backend server with password validation.
 * On server-side verification, persists to server storage (server-data.json)
 * and updates Firestore in real-time.
 */
export const updateCandidateWithBackend = async (
  id: string,
  updates: Partial<Candidate>,
  password: string,
  userEmail?: string
): Promise<Candidate> => {
  // 1. Send edit request to backend server for password verification and server persistence
  const response = await fetch(`/api/candidates/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-password': password
    },
    body: JSON.stringify({
      password,
      updates,
      userEmail: userEmail || 'Authorized Recruiter'
    })
  });

  const resJson = await response.json();

  if (!response.ok) {
    throw new Error(resJson.error || 'Backend rejected candidate update. Please verify your admin password.');
  }

  // Cache verified admin passkey for the session
  setAdminPasskey(password);

  const updatedCandidate: Candidate = resJson.record || { ...updates, id } as Candidate;

  // 2. Synchronize to Firestore so live listeners and multi-user sessions update instantly
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'Authorized Recruiter'
    };

    await updateDoc(docRef, cleanForFirestore(payload));
  } catch (firestoreErr) {
    console.warn("Firestore sync warning (backend update was successfully saved):", firestoreErr);
  }

  return updatedCandidate;
};

/**
 * Update Candidate in Firestore in real-time
 */
export const updateCandidateInFirestore = async (id: string, updates: Partial<Candidate>, userEmail?: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'Recruiter'
    };

    await updateDoc(docRef, cleanForFirestore(payload));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};

/**
 * Delete Candidate from Firestore
 */
export const deleteCandidateFromFirestore = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    // Sync to local server file with admin authorization header
    fetch(`/api/records/${id}`, { 
      method: 'DELETE',
      headers: { 'x-admin-password': getAdminPasskey() }
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};

/**
 * Bulk delete candidates in an atomic transaction
 */
export const bulkDeleteCandidatesFromFirestore = async (ids: string[]) => {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.delete(docRef);
      fetch(`/api/records/${id}`, { 
        method: 'DELETE',
        headers: { 'x-admin-password': getAdminPasskey() }
      }).catch(() => {});
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    throw error;
  }
};
