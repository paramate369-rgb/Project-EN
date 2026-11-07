import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectItem } from '../types';
import { handleFirestoreError, OperationType } from '../firebaseErrors';

export interface FirebaseSettingData {
  sheetUrl: string;
  syncInterval: number;
  lastUpdated: string;
}

export const INITIAL_FALLBACK_PROJECTS: ProjectItem[] = [
  { id: 'E001', name: "P'Sith", role: 'ผู้จัดการ', project: 'CUGM CRTT', price: 5000000, status: 'กำลังดำเนินการ' },
  { id: 'E002', name: 'Top', role: 'Project Engineer', project: 'KTC', price: 250000, status: 'เสร็จ' },
  { id: 'E002', name: 'Top', role: 'Project Engineer', project: 'การบินไทย AP', price: 170000, status: 'กำลังดำเนินการ' },
  { id: 'E002', name: 'Top', role: 'Project Engineer', project: 'Toyota อับดุล', price: 1454040, status: 'เสร็จ' },
  { id: 'E002', name: 'Top', role: 'Project Engineer', project: 'ซีคอน', price: 25800, status: 'เสร็จ' },
  { id: 'E003', name: 'Nu', role: 'Project Engineer', project: 'KAT', price: 500000, status: 'กำลังดำเนินการ' },
  { id: 'E003', name: 'Nu', role: 'Project Engineer', project: 'มาริลี่', price: 500000, status: 'กำลังดำเนินการ' },
  { id: 'E003', name: 'Nu', role: 'Project Engineer', project: 'โกเบลโก้', price: 500000, status: 'กำลังดำเนินการ' },
  { id: 'E004', name: 'Benz', role: 'Project Engineer', project: 'D.I.Y', price: 500000, status: 'กำลังดำเนินการ' },
  { id: 'E005', name: 'Kosol', role: 'Project Engineer', project: 'ฤทธา office', price: 689785, status: 'เสนอราคา' },
  { id: 'E005', name: 'Kosol', role: 'Project Engineer', project: 'ฤทธา AP', price: 308120, status: 'เสนอราคา' },
  { id: 'E005', name: 'Kosol', role: 'Project Engineer', project: 'GEM แกลอรี่', price: 200000, status: 'เสนอราคา' },
  { id: 'E005', name: 'Kosol', role: 'Project Engineer', project: 'BankX', price: 65000, status: 'เสนอราคา' },
];

// Generate clean zero-padded document IDs (e.g., proj_01, proj_02)
function generateDocId(index: number): string {
  return `proj_${String(index + 1).padStart(2, '0')}`;
}

/**
 * Fetch projects directly from Firestore collection
 */
export async function getProjectsFromFirestore(): Promise<ProjectItem[]> {
  const path = 'projects';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }

    const items: ProjectItem[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data && data.name && data.project) {
        items.push({
          id: data.id || '',
          name: data.name || '',
          role: data.role || '',
          project: data.project || '',
          price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
          status: data.status || 'กำลังดำเนินการ',
        });
      }
    });

    return items;
  } catch (error) {
    console.warn('Could not read from Firestore, falling back to local cache:', error);
    return [];
  }
}

/**
 * Subscribe in real-time to projects collection in Firestore
 */
export function subscribeToProjects(
  onData: (projects: ProjectItem[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'projects';
  const colRef = collection(db, path);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: ProjectItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data && data.name && data.project) {
          items.push({
            id: data.id || '',
            name: data.name || '',
            role: data.role || '',
            project: data.project || '',
            price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
            status: data.status || 'กำลังดำเนินการ',
          });
        }
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot warning:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Sync / Replace projects in Firestore
 */
export async function syncProjectsToFirestore(projects: ProjectItem[]): Promise<void> {
  const path = 'projects';
  if (!projects || projects.length === 0) return;

  try {
    const colRef = collection(db, path);
    const existingSnap = await getDocs(colRef);
    const existingDocIds = new Set(existingSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    const newDocIds = new Set<string>();

    projects.forEach((item, index) => {
      const docId = generateDocId(index);
      newDocIds.add(docId);
      const docRef = doc(db, path, docId);
      batch.set(
        docRef,
        {
          id: item.id || '',
          name: item.name || '',
          role: item.role || '',
          project: item.project || '',
          price: item.price || 0,
          status: item.status || 'กำลังดำเนินการ',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });

    // Delete obsolete docs
    existingDocIds.forEach((oldId) => {
      if (!newDocIds.has(oldId)) {
        batch.delete(doc(db, path, oldId));
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Failed to sync projects into Firestore:', error);
    // Don't crash the client on write failure
  }
}

/**
 * Subscribe to settings in Firestore
 */
export function subscribeToSettings(
  onData: (settings: FirebaseSettingData) => void
): () => void {
  const path = 'settings';
  const docRef = doc(db, path, 'config');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FirebaseSettingData;
        onData(data);
      }
    },
    (error) => {
      console.warn('Settings subscription warning:', error);
    }
  );
}

/**
 * Save settings to Firestore
 */
export async function saveSettingsToFirestore(settings: Partial<FirebaseSettingData>): Promise<void> {
  const path = 'settings';
  try {
    const docRef = doc(db, path, 'config');
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('Failed to save settings to Firestore:', error);
  }
}

/**
 * Check if projects collection is empty in Firestore
 */
export async function isProjectsCollectionEmpty(): Promise<boolean> {
  const path = 'projects';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.empty;
  } catch (error) {
    return true;
  }
}
