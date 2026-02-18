export const isAdminSubdomain = () => {
    return window.location.hostname.startsWith('admin.');
};

export const isResellerSubdomain = () => {
    return window.location.hostname.startsWith('bayi.');
};
