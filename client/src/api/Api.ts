import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.API_URL}/api` || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
