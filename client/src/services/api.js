import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api` 
    : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// const api = axios.create({
//     baseURL: 'http://localhost:3001/api',
//     headers: {
//         'Content-Type': 'application/json'
//     }
// });

export default api;