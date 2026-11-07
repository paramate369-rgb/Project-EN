import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectItem } from '../types';
import { handleFirestoreError, OperationType } from '../firebaseErrors';

export interface FirebaseSettingData {
  sheetUrl: string;
  syncInterval: number;
  lastUpdated: string;
}

// Generate a deterministic and clean document ID
function generateDocId(name: string, project: string, index: number): string {
  return `proj_${String(index + 1).padStart(2, '0')}`;
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
        items.push({
          id: data.id || '',
          name: data.name || '',
          role: data.role || '',
          project: data.project || '',
          price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
          status: data.status || 'กำลังดำเนินการ',
        });
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

/**
 * Sync / Replace projects in Firestore
 */
export async function syncProjectsToFirestore(projects: ProjectItem[]): Promise<void> {
  const path = 'projects';
  try {
    const colRef = collection(db, path);
    const existingSnap = await getDocs(colRef);
    const existingDocIds = new Set(existingSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    const newDocIds = new Set<string>();

    projects.forEach((item, index) => {
      const docId = generateDocId(item.name, item.project, index);
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

    // Delete removed docs to stay synchronized
    existingDocIds.forEach((oldId) => {
      if (!newDocIds.has(oldId)) {
        batch.delete(doc(db, path, oldId));
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
      handleFirestoreError(error, OperationType.GET, `${path}/config`);
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
    handleFirestoreError(error, OperationType.WRITE, `${path}/config`);
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
    console.warn('Could not check if Firestore is empty:', error);
    return true;
  }
}
