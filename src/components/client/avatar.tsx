import { useState } from 'react';

export const avatarUrl = (file: string) => `${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${file}`;

// Photo when the user has one (falls back to the initial if the file is gone), initial letter otherwise.
const UserAvatar = ({ name, avatar, className }: { name?: string; avatar?: string | null; className?: string }) => {
    const [failed, setFailed] = useState<string | null>(null);
    return avatar && failed !== avatar ? (
        <img src={avatarUrl(avatar)} alt="" className={className} onError={() => setFailed(avatar)} />
    ) : (
        <span className={className} aria-hidden="true">
            {name?.slice(0, 1)?.toUpperCase()}
        </span>
    );
};

export default UserAvatar;
