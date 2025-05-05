export const saveUserData = (token, user) => {
  console.log('Saving auth data, token:', token ? 'present' : 'missing');
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUserData = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  const token = localStorage.getItem('token');
  console.log('Getting token:', token ? 'present' : 'missing');
  return token;
};

export const isAuthenticated = () => {
  const isAuth = !!getToken();
  console.log('Auth check result:', isAuth);
  return isAuth;
};

export const logout = () => {
  console.log('Logging out, clearing auth data');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};