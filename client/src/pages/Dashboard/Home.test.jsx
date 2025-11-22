import { useAuth } from '../../context/AuthContext';

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Home Page</h1>
            <p>Welcome, {user?.name || 'Guest'}</p>
            <p>Role: {user?.role || 'N/A'}</p>
        </div>
    );
}
