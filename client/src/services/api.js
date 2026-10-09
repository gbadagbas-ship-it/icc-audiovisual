import axios from "axios";

const apiHost = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === "production"
    ? "https://icc-audiovisual-1.onrender.com"
    : "http://localhost:3001"
);

const api = axios.create({
  baseURL: `${apiHost.replace(/\/$/, "")}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
