import React from 'react';

export const Editor = () => {
  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 140px)',
        maxWidth: '1600px'
      }}
      className='flex'
    >
      <iframe
        title="Editor"
        src="/editor/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px',
          background: '#0f1426'
        }}
      />
    </div>
  );
};
