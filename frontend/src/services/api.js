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
