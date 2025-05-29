import { axiosPrivate } from '../api/api';
import useAuth from './useAuth';

const useRefreshToken = () => {
    const { setUser } = useAuth();

    const refresh = async () => {
        const response = await axiosPrivate.get('/refresh', {
            withCredentials: true
        });
        setUser(prev => {
            console.log(JSON.stringify(prev));
            console.log(response.data.accessToken);
            return {
                ...prev,
                roles: response.data.roles,
                accessToken: response.data.accessToken
            }
        });
        return response.data.accessToken;
    }
    return refresh;
};

export default useRefreshToken;