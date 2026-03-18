import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';

const socket = io();

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  throw new Error(`Server error: ${res.status}. ${text.substring(0, 100)}`);
};

export const api = {
  get: async (collection: string): Promise<any[]> => {
    const res = await fetch(`/api/${collection}`);
    return handleResponse(res);
  },
  post: async (collection: string, data: any): Promise<any> => {
    const res = await fetch(`/api/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  put: async (collection: string, id: string, data: any): Promise<any> => {
    const res = await fetch(`/api/${collection}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (collection: string, id: string): Promise<any> => {
    const res = await fetch(`/api/${collection}/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
  auth: {
    signup: async (data: any): Promise<any> => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await handleResponse(res);
      } catch (err: any) {
        return { error: err.message };
      }
    },
    login: async (data: any): Promise<any> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await handleResponse(res);
      } catch (err: any) {
        return { error: err.message };
      }
    }
  },
  subscribe: (collection: string, callback: (data: any) => void): (() => void) => {
    socket.on(`${collection}:created`, callback);
    socket.on(`${collection}:updated`, callback);
    socket.on(`${collection}:deleted`, callback);
    return () => {
      socket.off(`${collection}:created`, callback);
      socket.off(`${collection}:updated`, callback);
      socket.off(`${collection}:deleted`, callback);
    };
  },
  updatePresence: (data: any): void => {
    socket.emit("presence:update", data);
  },
  subscribePresence: (callback: (data: any) => void): (() => void) => {
    socket.on("presence:updated", callback);
    return () => socket.off("presence:updated", callback);
  },
  updateTyping: (data: any): void => {
    socket.emit("typing:update", data);
  },
  subscribeTyping: (callback: (data: any) => void): (() => void) => {
    socket.on("typing:updated", callback);
    return () => socket.off("typing:updated", callback);
  }
};

// Mock Firebase-like functions for easier migration
export const db = {
  collection: (name: string) => ({
    name,
    add: (data: any) => api.post(name, data),
    doc: (id: string) => ({
      id,
      update: (data: any) => api.put(name, id, data),
      delete: () => api.delete(name, id)
    })
  })
};

export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: (user: any) => void) => {
    const storedUser = localStorage.getItem("desklink_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      auth.currentUser = user;
      callback(user);
    } else {
      callback(null);
    }
  },
  signOut: async () => {
    localStorage.removeItem("desklink_user");
    auth.currentUser = null;
    window.location.reload();
  }
};

export const onAuthStateChanged = (auth: any, callback: (user: any) => void): (() => void) => {
  const storedUser = localStorage.getItem("desklink_user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    auth.currentUser = user;
    callback(user);
  } else {
    callback(null);
  }
  return () => {};
};

export const signOut = async (auth: any) => {
  localStorage.removeItem("desklink_user");
  auth.currentUser = null;
  window.location.reload();
};

export const serverTimestamp = () => new Date().toISOString();

export const doc = (db: any, collectionName?: string, id?: string) => {
  if (typeof db === "string") {
    // doc(collectionRef, id)
    return { collection: db, id: collectionName || uuidv4() };
  }
  // doc(db, collection, id)
  return { collection: collectionName || "", id: id || uuidv4() };
};

export const collection = (db: any, ...pathSegments: string[]) => {
  if (typeof db === "string") {
    return [db, ...pathSegments].join("/");
  }
  return pathSegments.join("/");
};
export const query = (name: string, ...args: any[]) => name;
export const where = (field: string, op: string, value: any) => ({ field, op, value });
export const orderBy = (field: string, direction: string = "asc") => ({ field, direction });
export const limit = (n: number) => ({ limit: n });
export const onSnapshot = (q: any, callback: (snapshot: any) => void, errorCallback?: (err: any) => void): (() => void) => {
  const collectionName = typeof q === "string" ? q : q.name;
  
  const fetchData = async () => {
    try {
      const data = await api.get(collectionName);
      const docs = Array.isArray(data) ? data : [];
      callback({
        docs: docs.map((item: any) => ({
          id: item.id || item.uid,
          data: () => item,
          exists: () => true,
          metadata: { hasPendingWrites: false }
        })),
        docChanges: () => [] // Mock docChanges to prevent crashes
      });
    } catch (err) {
      if (errorCallback) errorCallback(err);
    }
  };

  fetchData();
  return api.subscribe(collectionName, fetchData);
};

export const addDoc = (collectionName: string, data: any) => api.post(collectionName, data);
export const updateDoc = (docRef: any, data: any) => api.put(docRef.collection, docRef.id, data);
export const deleteDoc = (docRef: any) => api.delete(docRef.collection, docRef.id);
export const getDocs = async (q: any) => {
  const collectionName = typeof q === "string" ? q : q.name;
  const data = await api.get(collectionName);
  const docs = Array.isArray(data) ? data : [];
  return {
    docs: docs.map((item: any) => ({
      id: item.id || item.uid,
      data: () => item,
      metadata: { hasPendingWrites: false }
    }))
  };
};

export const getDoc = async (docRef: any) => {
  const data = await api.get(docRef.collection);
  const docs = Array.isArray(data) ? data : [];
  const item = docs.find((i: any) => i.id === docRef.id || i.uid === docRef.id);
  return {
    exists: () => !!item,
    data: () => item,
    metadata: { hasPendingWrites: false }
  };
};

export const setDoc = (docRef: any, data: any, options?: any) => api.put(docRef.collection, docRef.id, data);

export const signInWithEmailAndPassword = async (auth: any, email: string, pass: string) => {
  const res = await api.auth.login({ email, password: pass });
  if (res.error) {
    const error: any = new Error(res.error);
    if (res.error === "Invalid credentials" || res.error === "User not found") {
      error.code = 'auth/invalid-credential';
    }
    throw error;
  }
  localStorage.setItem("desklink_user", JSON.stringify(res.user));
  auth.currentUser = res.user;
  return { user: res.user };
};

export const createUserWithEmailAndPassword = async (auth: any, email: string, pass: string, role?: string, name?: string, uid?: string) => {
  const res = await api.auth.signup({ email, password: pass, role, name, uid });
  if (res.error) {
    const error: any = new Error(res.error);
    throw error;
  }
  localStorage.setItem("desklink_user", JSON.stringify(res.user));
  auth.currentUser = res.user;
  return { user: res.user };
};

export const isFirebaseConfigured = true;

export const firebaseConfig = {
  apiKey: "mock",
  authDomain: "mock",
  projectId: "mock",
  storageBucket: "mock",
  messagingSenderId: "mock",
  appId: "mock"
};

export const handleFirestoreError = (err: any, op: any, path: any) => {
  console.error(`Error in ${op} at ${path}:`, err);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
