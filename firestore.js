// Firestore Integration for MenuLix Customer Menu
// Interacts with:
// - publicMenus/{restaurantId}
// - users/{restaurantId}/categories/{categoryId}
// - users/{restaurantId}/categories/{categoryId}/items/{itemId}

const MenuLixFirestore = {
  activeUnsubscribers: [],

  // Helper to safely get the Firestore database instance
  getDb() {
    return window.db || (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function' ? firebase.firestore() : null);
  },

  // Clear all real-time listeners
  clearListeners() {
    this.activeUnsubscribers.forEach(unsub => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (e) {
        console.warn('Error unsubscribing listener:', e);
      }
    });
    this.activeUnsubscribers = [];
  },

  /**
   * Listen to public restaurant profile
   * @param {string} restaurantId 
   * @param {function} onProfileUpdate 
   * @param {function} onError 
   */
  listenRestaurantProfile(restaurantId, onProfileUpdate, onError) {
    if (!restaurantId || typeof restaurantId !== 'string' || !restaurantId.trim()) {
      if (onError) onError(new Error('Missing or invalid restaurantId parameter'));
      return;
    }

    const firestoreDb = this.getDb();
    if (!firestoreDb) {
      if (onError) onError(new Error('Firestore SDK is not initialized. window.db is unavailable'));
      return;
    }

    try {
      const unsub = firestoreDb.collection('publicMenus').doc(restaurantId.trim())
        .onSnapshot(doc => {
          if (doc.exists) {
            onProfileUpdate({ id: doc.id, ...doc.data() });
          } else {
            // Profile document not found in publicMenus
            onProfileUpdate(null);
          }
        }, err => {
          console.error('[MenuLix Diagnostic] Error listening to publicMenus profile:', err);
          if (onError) onError(err);
        });

      this.activeUnsubscribers.push(unsub);
      return unsub;
    } catch (err) {
      console.error('[MenuLix Diagnostic] Failed to attach profile listener:', err);
      if (onError) onError(err);
    }
  },

  /**
   * Listen to categories and their nested items in real-time
   * @param {string} restaurantId 
   * @param {function} onMenuUpdate 
   * @param {function} onError 
   */
  listenMenuData(restaurantId, onMenuUpdate, onError) {
    if (!restaurantId || typeof restaurantId !== 'string' || !restaurantId.trim()) {
      if (onError) onError(new Error('Missing or invalid restaurantId parameter'));
      return;
    }

    const firestoreDb = this.getDb();
    if (!firestoreDb) {
      if (onError) onError(new Error('Firestore SDK is not initialized. window.db is unavailable'));
      return;
    }

    try {
      const categoriesRef = firestoreDb.collection('users').doc(restaurantId.trim()).collection('categories');
      const itemUnsubs = {};

      const unsubCategories = categoriesRef.orderBy('createdAt').onSnapshot(categorySnapshot => {
        const categoriesMap = {};
        const categoryOrder = [];

        if (categorySnapshot.empty) {
          onMenuUpdate([]);
          return;
        }

        categorySnapshot.docs.forEach(catDoc => {
          const catData = catDoc.data();
          const catId = catDoc.id;
          categoryOrder.push(catId);
          categoriesMap[catId] = {
            id: catId,
            name: catData.name || 'Category',
            icon: catData.icon || '🍽️',
            createdAt: catData.createdAt,
            items: []
          };

          // Attach listener for items under this category if not already listening
          if (!itemUnsubs[catId]) {
            const itemsRef = categoriesRef.doc(catId).collection('items');
            itemUnsubs[catId] = itemsRef.onSnapshot(itemSnapshot => {
              const items = itemSnapshot.docs.map(itemDoc => {
                const itemData = itemDoc.data();
                return {
                  id: itemDoc.id,
                  name: itemData.name || '',
                  description: itemData.description || '',
                  price: itemData.price !== undefined ? String(itemData.price) : '',
                  imageUrl: itemData.imageUrl || '',
                  available: itemData.available !== false,
                  category: itemData.category || categoriesMap[catId]?.name || '',
                  rating: typeof itemData.rating === 'number' ? itemData.rating : 0,
                  calories: typeof itemData.calories === 'number' ? itemData.calories : 0,
                  tags: Array.isArray(itemData.tags) ? itemData.tags : []
                };
              });

              if (categoriesMap[catId]) {
                categoriesMap[catId].items = items;
              }

              // Emit combined menu structure
              const compiledMenu = categoryOrder
                .map(id => categoriesMap[id])
                .filter(Boolean);
              onMenuUpdate(compiledMenu);
            }, err => {
              console.error(`[MenuLix Diagnostic] Error listening to items in category ${catId}:`, err);
            });

            this.activeUnsubscribers.push(itemUnsubs[catId]);
          }
        });

        // Clean up listeners for removed categories
        Object.keys(itemUnsubs).forEach(id => {
          if (!categoriesMap[id]) {
            try {
              itemUnsubs[id]();
            } catch (e) {}
            delete itemUnsubs[id];
          }
        });

        // Initial emission
        const compiledMenu = categoryOrder
          .map(id => categoriesMap[id])
          .filter(Boolean);
        onMenuUpdate(compiledMenu);
      }, err => {
        console.error('[MenuLix Diagnostic] Error listening to categories:', err);
        if (onError) onError(err);
      });

      this.activeUnsubscribers.push(unsubCategories);
      return unsubCategories;
    } catch (err) {
      console.error('[MenuLix Diagnostic] Failed to attach menu listeners:', err);
      if (onError) onError(err);
    }
  }
};

window.MenuLixFirestore = MenuLixFirestore;
