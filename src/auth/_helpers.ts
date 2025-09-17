import { User as Auth0UserModel } from '@auth0/auth0-spa-js';

import { getData, setData } from '@/utils';
import { type AuthModel } from './_models';

const AUTH_LOCAL_STORAGE_KEY = `${import.meta.env.VITE_APP_NAME}-auth-v${
  import.meta.env.VITE_APP_VERSION
}`;

const getAuth = (): AuthModel | undefined => {
  try {
    const auth = getData(AUTH_LOCAL_STORAGE_KEY) as AuthModel | undefined;

    if (auth) {
      return auth;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('AUTH LOCAL STORAGE PARSE ERROR', error);
  }
};

const setAuth = (auth: AuthModel | Auth0UserModel) => {
  setData(AUTH_LOCAL_STORAGE_KEY, auth);
};

const removeAuth = () => {
  if (!localStorage) {
    return;
  }

  try {
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('AUTH LOCAL STORAGE REMOVE ERROR', error);
  }
};

export function setupAxios(axios: any) {
  axios.defaults.headers.Accept = 'application/json';
  
  // Request interceptor - Add auth token to requests
  axios.interceptors.request.use(
    (config: { headers: { Authorization: string } }) => {
      const auth = getAuth();

      if (auth?.access_token) {
        config.headers.Authorization = `Bearer ${auth.access_token}`;
      }

      return config;
    },
    async (err: any) => await Promise.reject(err)
  );

  // Response interceptor - Handle 401 unauthorized responses
  axios.interceptors.response.use(
    (response: any) => {
      // If the response is successful, just return it
      return response;
    },
    async (error: any) => {
      const { response } = error;
      
      // Check if the error is 401 Unauthorized
      if (response && response.status === 401) {
        console.log('401 Unauthorized - Redirecting to login');
        
        // Clear the stored auth data
        removeAuth();
        
        // Redirect to login page
        window.location.href = '/auth/login';
      }
      
      // For all other errors, reject the promise
      return Promise.reject(error);
    }
  );
}

export { AUTH_LOCAL_STORAGE_KEY, getAuth, removeAuth, setAuth };
