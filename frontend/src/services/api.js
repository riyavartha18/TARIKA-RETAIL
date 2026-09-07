const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Universal Login for all user types: Customer, Admin, Warehouse Manager, Delivery Partner.
 * The backend automatically determines the user's role.
 */
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.detail || 
                       data.non_field_errors?.[0] || 
                       data.email?.[0] || 
                       data.password?.[0] || 
                       'Invalid email or password. Please try again.';
      return { success: false, error: errorMsg, status: response.status };
    }

    return {
      success: true,
      user: data.user,
      tokens: data.tokens,
      role: data.user?.role,
      warehouseId: data.user?.warehouse_id,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Unable to connect to the backend server. Please make sure the Django server is running.',
      status: 0,
    };
  }
}

/**
 * Public Customer Registration.
 * Strictly assigns role CUSTOMER (no role is ever sent from the frontend).
 */
export async function registerCustomer({ fullName, email, phone, password, city, state }) {
  try {
    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      password,
    };

    if (phone) {
      const parsedPhone = parseInt(phone.replace(/\D/g, ''), 10);
      if (!isNaN(parsedPhone)) {
        payload.phone = parsedPhone;
      }
    }
    if (city) payload.city = city.trim();
    if (state) payload.state = state.trim();

    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMsg = 'Registration failed. Please check your information.';
      if (data.email) {
        errorMsg = Array.isArray(data.email) ? data.email[0] : data.email;
      } else if (data.password) {
        errorMsg = Array.isArray(data.password) ? data.password[0] : data.password;
      } else if (data.full_name) {
        errorMsg = Array.isArray(data.full_name) ? data.full_name[0] : data.full_name;
      } else if (data.detail) {
        errorMsg = data.detail;
      }
      return { success: false, error: errorMsg, status: response.status };
    }

    return {
      success: true,
      user: data.user,
      tokens: data.tokens,
      role: 'CUSTOMER',
    };
  } catch (err) {
    return {
      success: false,
      error: 'Unable to connect to the backend server. Please check your network connection.',
      status: 0,
    };
  }
}

/**
 * Log out the authenticated user.
 */
export async function logoutUser(token) {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.warn('Logout request failed or server unreachable', err);
  }
  return { success: true };
}

/**
 * Fetch authenticated profile from /api/auth/me/
 */
export async function getMe(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: 'Session expired' };
    }

    const data = await response.json();
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: 'Network error' };
  }
}

/* ==========================================================================
   CATALOG API HELPERS (Part 2A)
   ========================================================================== */

/**
 * Fetch all categories with product counts.
 */
export async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/categories/`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch categories' };
    }
    return {
      success: true,
      categories: Array.isArray(data) ? data : (data.categories || [])
    };
  } catch (err) {
    return { success: false, error: 'Network error fetching categories' };
  }
}

/**
 * Fetch products list with optional filters, search, sorting and pagination.
 */
export async function getProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.min_price) query.append('min_price', params.min_price);
    if (params.max_price) query.append('max_price', params.max_price);
    if (params.in_stock !== undefined && params.in_stock !== '') query.append('in_stock', params.in_stock);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);

    const qs = query.toString();
    const url = `${API_BASE_URL}/api/catalog/products/${qs ? '?' + qs : ''}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch products' };
    }

    return {
      success: true,
      products: data.results || [],
      count: data.count || 0,
      totalPages: data.total_pages || 1,
      currentPage: data.current_page || 1,
      hasNext: Boolean(data.next),
      hasPrevious: Boolean(data.previous),
    };
  } catch (err) {
    return { success: false, error: 'Network error fetching products' };
  }
}

/**
 * Fetch single product details by ID or slug.
 */
export async function getProductDetail(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/products/${productId}/`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch product details' };
    }
    return { success: true, product: data };
  } catch (err) {
    return { success: false, error: 'Network error fetching product' };
  }
}

/**
 * Fetch New Arrivals.
 */
export async function getNewArrivals(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/new-arrivals/?limit=${limit}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch new arrivals' };
    }
    return { success: true, products: data.results || [] };
  } catch (err) {
    return { success: false, error: 'Network error fetching new arrivals' };
  }
}

/**
 * Fetch Trending Products.
 */
export async function getTrending(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/trending/?limit=${limit}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch trending products' };
    }
    return { success: true, products: data.results || [] };
  } catch (err) {
    return { success: false, error: 'Network error fetching trending products' };
  }
}

/**
 * Fetch Sale / Discounted Products.
 */
export async function getSale(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/sale/?limit=${limit}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch sale products' };
    }
    return { success: true, products: data.results || [] };
  } catch (err) {
    return { success: false, error: 'Network error fetching sale products' };
  }
}

/* ==========================================================================
   WISHLIST API HELPERS (Part 2B)
   ========================================================================== */

/**
 * Get authenticated customer's wishlist.
 */
export async function getWishlist(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch wishlist' };
    }
    return {
      success: true,
      items: data.items || [],
      count: data.count || 0,
    };
  } catch (err) {
    return { success: false, error: 'Network error fetching wishlist' };
  }
}

/**
 * Add a product to customer's wishlist.
 */
export async function addToWishlist(token, productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to add to wishlist' };
    }
    return { success: true, item: data.item, message: data.message };
  } catch (err) {
    return { success: false, error: 'Network error adding to wishlist' };
  }
}

/**
 * Remove a product from customer's wishlist.
 */
export async function removeFromWishlist(token, productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/${productId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to remove from wishlist' };
    }
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, error: 'Network error removing from wishlist' };
  }
}

/* ==========================================================================
   BAG / CART API HELPERS (Part 2B)
   ========================================================================== */

/**
 * Get authenticated customer's bag/cart.
 */
export async function getBag(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to fetch bag' };
    }
    return {
      success: true,
      items: data.items || [],
      totalItems: data.total_items || 0,
      subtotal: data.subtotal || 0,
      total: data.total || 0,
    };
  } catch (err) {
    return { success: false, error: 'Network error fetching bag' };
  }
}

/**
 * Add a product to customer's bag.
 */
export async function addToBag(token, productId, quantity = 1) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to add product to bag' };
    }
    return {
      success: true,
      item: data.item,
      cart: data.cart,
      message: data.message,
    };
  } catch (err) {
    return { success: false, error: 'Network error adding product to bag' };
  }
}

/**
 * Update quantity of a bag item.
 */
export async function updateBagQuantity(token, productId, quantity) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${productId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to update quantity' };
    }
    return {
      success: true,
      item: data.item,
      cart: data.cart,
      message: data.message,
    };
  } catch (err) {
    return { success: false, error: 'Network error updating bag quantity' };
  }
}

/**
 * Remove an item completely from the customer's bag.
 */
export async function removeFromBag(token, productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${productId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to remove from bag' };
    }
    return {
      success: true,
      cart: data.cart,
      message: data.message,
    };
  } catch (err) {
    return { success: false, error: 'Network error removing from bag' };
  }
}

/**
 * Clear the entire bag.
 */
export async function clearBag(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/clear/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to clear bag' };
    }
    return {
      success: true,
      message: data.message,
    };
  } catch (err) {
    return { success: false, error: 'Network error clearing bag' };
  }
}
