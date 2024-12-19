export const handleTokenExpiration = (error: any) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }
};
