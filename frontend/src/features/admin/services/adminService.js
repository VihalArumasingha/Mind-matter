import { Platform } from 'react-native';
import { API_BASE_URL } from '../../../config/api';

const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API Request: ${method} ${url}`);
    
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}`);
    const text = await response.text();
    console.log(`📄 Response text preview: ${text.substring(0, 200)}...`);
    if (text.trim().startsWith('<')) {
      console.error('❌ Received HTML instead of JSON. Backend might be down or route not found.');
      throw new Error('Backend server returned HTML. Please check if server is running.');
    }
    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (parseError) {
      console.error('❌ JSON Parse error:', parseError);
      console.error('📄 Raw response:', text);
      throw new Error('Invalid JSON response from server');
    }
    
  } catch (error) {
    console.error(`❌ API Error (${endpoint}):`, error.message);
    throw error;
  }
};

export const getDashboardStats = async (token) => {
  try {
    const response = await apiRequest('/api/admin/overview', 'GET', null, token);
    return response;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getUsersApi = async (token, search = '', status = 'all', role = 'all') => {
  try {
    const query = `?search=${encodeURIComponent(search)}&status=${status}&role=${role}`;
    const response = await apiRequest(`/api/admin/users${query}`, 'GET', null, token);
    return response.users || response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const warnUserApi = async (token, id, reason) => {
  try {
    const response = await apiRequest(`/api/admin/users/${id}/warn`, 'PUT', { reason }, token);
    return response.user || response;
  } catch (error) {
    console.error('Error warning user:', error);
    throw error;
  }
};

export const suspendUserApi = async (token, id, reason, days) => {
  try {
    const response = await apiRequest(`/api/admin/users/${id}/suspend`, 'PUT', { reason, days }, token);
    return response.user || response;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const unsuspendUserApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/users/${id}/unsuspend`, 'PUT', null, token);
    return response.user || response;
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw error;
  }
};

export const getProfessionalApplicationsApi = async (token, status = 'all') => {
  try {
    const query = status !== 'all' ? `?status=${status}` : '';
    const response = await apiRequest(`/api/admin/professionals/applications${query}`, 'GET', null, token);
    return response.applications || response;
  } catch (error) {
    console.error('Error fetching professional applications:', error);
    throw error;
  }
};

export const submitTherapistApplicationWithFiles  = async (formData) => {
  try {
    console.log('Submitting application - Form email:', formData.email, 'Account email:', formData.userEmail);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/professionals/applications/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email, // Save form email as-is in the application
        accountEmail: formData.userEmail, // Use logged-in user's email for account linking
        phone: formData.phone || '',
        profession: formData.profession || 'Clinical Psychologist',
        licenseNum: formData.licenseNum,
        specialization: formData.specialization || 'General Mental Health Support',
        expYears: formData.expYears || 1,
        bio: formData.bio || '',
        userId: formData.userId || formData.user?._id || null, // Use logged-in user's ID
        documents: formData.documents || [],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit application');
    }
    
    return data;
  } catch (error) {
    console.error(' Error submitting application:', error);
    throw error;
  }
};
export const approveProfessionalApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/professionals/applications/${id}/approve`, 'PUT', null, token);
    return response.application || response;
  } catch (error) {
    console.error('Error approving professional:', error);
    throw error;
  }
};

export const rejectProfessionalApi = async (token, id, reason) => {
  try {
    const response = await apiRequest(`/api/admin/professionals/applications/${id}/reject`, 'PUT', { reason }, token);
    return response.application || response;
  } catch (error) {
    console.error('Error rejecting professional:', error);
    throw error;
  }
};

export const getCommunitiesApi = async (token) => {
  try {
    const response = await apiRequest('/api/admin/communities', 'GET', null, token);
    return response.communities || response;
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
};

export const warnCommunityApi = async (token, id, message) => {
  try {
    const response = await apiRequest(`/api/admin/communities/${id}/warn`, 'PUT', { message }, token);
    return response.community || response;
  } catch (error) {
    console.error('Error warning community:', error);
    throw error;
  }
};

export const restrictCommunityApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/communities/${id}/restrict`, 'PUT', null, token);
    return response.community || response;
  } catch (error) {
    console.error('Error restricting community:', error);
    throw error;
  }
};

export const removeCommunityApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/communities/${id}`, 'DELETE', null, token);
    return response.community || response;
  } catch (error) {
    console.error('Error removing community:', error);
    throw error;
  }
};

export const getPostsApi = async (token) => {
  try {
    const response = await apiRequest('/api/admin/posts', 'GET', null, token);
    return response.posts || response;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const keepPostApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/posts/${id}/keep`, 'PUT', null, token);
    return response.post || response;
  } catch (error) {
    console.error('Error keeping post:', error);
    throw error;
  }
};

export const restrictPostApi = async (token, id, reason) => {
  try {
    const response = await apiRequest(`/api/admin/posts/${id}/restrict`, 'PUT', { reason }, token);
    return response.post || response;
  } catch (error) {
    console.error('Error restricting post:', error);
    throw error;
  }
};

export const removePostApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/posts/${id}`, 'DELETE', null, token);
    return response.post || response;
  } catch (error) {
    console.error('Error removing post:', error);
    throw error;
  }
};

export const getReportsApi = async (token, targetType = 'all', status = 'all') => {
  try {
    const query = `?targetType=${targetType}&status=${status}`;
    const response = await apiRequest(`/api/admin/reports${query}`, 'GET', null, token);
    return response.reports || response;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const investigateReportApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/reports/${id}/investigate`, 'PUT', null, token);
    return response.report || response;
  } catch (error) {
    console.error('Error investigating report:', error);
    throw error;
  }
};

export const resolveReportApi = async (token, id, actionTaken) => {
  try {
    const response = await apiRequest(`/api/admin/reports/${id}/resolve`, 'PUT', { actionTaken }, token);
    return response.report || response;
  } catch (error) {
    console.error('Error resolving report:', error);
    throw error;
  }
};

export const dismissReportApi = async (token, id) => {
  try {
    const response = await apiRequest(`/api/admin/reports/${id}/dismiss`, 'PUT', null, token);
    return response.report || response;
  } catch (error) {
    console.error('Error dismissing report:', error);
    throw error;
  }
};

export const getAnalyticsApi = async (token) => {
  try {
    const response = await apiRequest('/api/admin/analytics', 'GET', null, token);
    return response.analytics || response;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

export const createBroadcastApi = async (token, title, message, targetAudience) => {
  try {
    const response = await apiRequest('/api/admin/broadcasts', 'POST', { title, message, targetAudience }, token);
    return response.broadcast || response;
  } catch (error) {
    console.error('Error creating broadcast:', error);
    throw error;
  }
};

export const getBroadcastsApi = async (token) => {
  try {
    const response = await apiRequest('/api/admin/broadcasts', 'GET', null, token);
    return response.broadcasts || response;
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    throw error;
  }
};

export const getAuditLogs = async (token, search = '', action = 'all') => {
  try {
    const query = `?search=${encodeURIComponent(search)}&action=${action}`;
    const response = await apiRequest(`/api/admin/audit-logs${query}`, 'GET', null, token);
    return response.logs || response;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};