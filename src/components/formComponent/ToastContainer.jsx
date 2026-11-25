import React from 'react';

const getColorByType = (type) => {
    switch (type) {
        case 'success':
            return '#28a745'; // green
        case 'error':
            return '#dc3545'; // red
        case 'info':
            return '#17a2b8'; // blue
        case 'warning':
            return '#ffc107'; // yellow
        default:
            return '#ffffff'; // white or fallback
    }
};

const CustomCloseButton = ({ closeToast, type }) => {
    const isModern = document.documentElement.dataset.design === 'modern';

    // old view: original colored ✖, unchanged
    if (!isModern) {
        return (
            <strong
                onClick={closeToast}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: getColorByType(type),
                }}
            >
                ✖
            </strong>
        );
    }

    return (
        <button
            type="button"
            onClick={closeToast}
            aria-label="Close notification"
            style={{
                background: 'transparent',
                border: 'none',
                alignSelf: 'center',
                flexShrink: 0,
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                lineHeight: 1,
                cursor: 'pointer',
                color: '#94A3B8',
                transition: 'background .15s, color .15s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.12)';
                e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94A3B8';
            }}
        >
            ✕
        </button>
    );
};

export default CustomCloseButton;
