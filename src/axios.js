  
import axios from 'axios';
// const baseURL = process.env.REACT_APP_HOST_IP_ADDRESS + ':8000/';

const baseURL = 'http://localhost:8000';


const axiosInstance = axios.create({
	baseURL: baseURL,
	timeout: 20000,
	headers: {
		Authorization: localStorage.getItem('access_token')
			? 'JWT ' + localStorage.getItem('access_token')
			: null,
		'Content-Type': 'application/json',
		accept: 'application/json',
	}, 
});

export default axiosInstance;