const Config = {
  ApiHost: (import.meta.env.VITE_API_HOST as string) || window.location.origin,
  ApiPrefix: (import.meta.env.VITE_API_PREFIX as string) || "/api/v1",
};

export default Config;
