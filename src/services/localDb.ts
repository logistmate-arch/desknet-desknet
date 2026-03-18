import { v4 as uuidv4 } from 'uuid';

// Types to mimic Firebase
export type User = {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'client' | 'engineer';
  [key: string]: any;
};

class LocalDb {
  private getData(collection: string): any[] {
    const data = localStorage.getItem(`desklink_${collection}`);
    return data ? JSON.parse(data) : [];
  }

  private setData(collection: string, data: any[]) {
    try {
      localStorage.setItem(`desklink_${collection}`, JSON.stringify(data));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn(`LocalStorage quota exceeded for collection: ${collection}. Attempting to prune...`);
        
        // If we are saving messages, prune the data itself
        if (collection === 'messages') {
          const prunedData = data.slice(Math.floor(data.length / 2));
          try {
            localStorage.setItem(`desklink_${collection}`, JSON.stringify(prunedData));
            console.log(`Pruned ${data.length - prunedData.length} messages to free up space.`);
            return;
          } catch (retryError) {
            console.error('Failed to prune messages:', retryError);
          }
        } else {
          // If we are saving something else, try to prune messages to make room
          const messages = this.getData('messages');
          if (messages.length > 10) {
            const prunedMessages = messages.slice(Math.floor(messages.length / 2));
            try {
              localStorage.setItem(`desklink_messages`, JSON.stringify(prunedMessages));
              console.log(`Pruned ${messages.length - prunedMessages.length} messages to make room for ${collection}.`);
              // Try setting the original data again
              localStorage.setItem(`desklink_${collection}`, JSON.stringify(data));
              return;
            } catch (retryError) {
              console.error('Failed to prune messages to make room:', retryError);
            }
          }
        }
        
        console.error("Local storage is full. Some old data might be lost or new data cannot be saved.");
      } else {
        throw e;
      }
    }
  }

  // Auth Mocks
  async signIn(email: string, pass: string): Promise<User> {
    const users = this.getData('users');
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('auth/user-not-found');
    // In a real mock we'd check password, but for local storage we'll just allow it
    localStorage.setItem('desklink_current_user', JSON.stringify(user));
    return user;
  }

  async signUp(email: string, pass: string, role: string): Promise<User> {
    const users = this.getData('users');
    if (users.find(u => u.email === email)) throw new Error('auth/email-already-in-use');
    
    const newUser: User = {
      uid: uuidv4(),
      email,
      role: role as any,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    this.setData('users', users);
    localStorage.setItem('desklink_current_user', JSON.stringify(newUser));
    return newUser;
  }

  signOut() {
    localStorage.removeItem('desklink_current_user');
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('desklink_current_user');
    return user ? JSON.parse(user) : null;
  }

  // Firestore Mocks
  async addDoc(collectionName: string, data: any) {
    const items = this.getData(collectionName);
    const newDoc = {
      ...data,
      id: uuidv4(),
      createdAt: data.createdAt || new Date().toISOString(),
    };
    items.push(newDoc);
    this.setData(collectionName, items);
    return { id: newDoc.id };
  }

  async setDoc(collectionName: string, id: string, data: any, options?: { merge?: boolean }) {
    const items = this.getData(collectionName);
    const index = items.findIndex(item => item.uid === id || item.id === id);
    
    if (index > -1) {
      if (options?.merge) {
        items[index] = { ...items[index], ...data };
      } else {
        items[index] = { ...data, id };
      }
    } else {
      items.push({ ...data, id: id || uuidv4() });
    }
    this.setData(collectionName, items);
  }

  async getDoc(collectionName: string, id: string) {
    const items = this.getData(collectionName);
    const item = items.find(i => i.uid === id || i.id === id);
    return {
      exists: () => !!item,
      data: () => item,
    };
  }

  async getDocs(collectionName: string, queryConstraints?: any[]) {
    let items = this.getData(collectionName);
    // Basic filtering if needed
    if (queryConstraints) {
      queryConstraints.forEach(constraint => {
        if (constraint.type === 'where') {
          const [field, op, value] = constraint.args;
          if (op === '==') {
            items = items.filter(item => item[field] === value);
          }
        }
      });
    }
    return items;
  }

  onSnapshot(collectionName: string, callback: (data: any[]) => void, queryConstraints?: any[]) {
    // Simple polling for mock snapshot or just initial load
    const load = async () => {
      const items = await this.getDocs(collectionName, queryConstraints);
      callback(items);
    };
    
    load();
    const interval = setInterval(load, 2000); // Poll every 2s to simulate real-time
    return () => clearInterval(interval);
  }

  async updateDoc(collectionName: string, id: string, data: any) {
    await this.setDoc(collectionName, id, data, { merge: true });
  }

  async deleteDoc(collectionName: string, id: string) {
    let items = this.getData(collectionName);
    items = items.filter(i => i.id !== id && i.uid !== id);
    this.setData(collectionName, items);
  }
}

export const localDb = new LocalDb();
