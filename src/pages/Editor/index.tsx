import React from 'react';
import { AccessGuard } from 'components';
import editorHtml from '../../../test_editor/index.html?raw';

export const Editor = () => {
  return (
    <AccessGuard>
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
          srcDoc={editorHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px',
            background: '#0f1426'
          }}
        />
      </div>
    </AccessGuard>
  );
};
