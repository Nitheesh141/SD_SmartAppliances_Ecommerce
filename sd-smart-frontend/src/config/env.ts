export const ENV = {
    // API_BASE_URL: 'https://sdsmart.in/api'
    API_BASE_URL: 'http://localhost:5001/api'
};

export const getAbsoluteImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/SD-logo.png";
  
  const apiBase = ENV.API_BASE_URL.replace(/\/api$/, "");
  
  // Normalize localhost port mismatch
  if (url.startsWith("http://localhost:5000")) {
    return url.replace("http://localhost:5000", apiBase);
  }
  
  if (url.startsWith("/")) {
    return `${apiBase}${url}`;
  }
  
  return url;
};