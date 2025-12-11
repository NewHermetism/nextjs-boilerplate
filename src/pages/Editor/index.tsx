import React, { useEffect, useMemo } from 'react';
import { AccessGuard } from 'components';
import characters from 'games/dino/config/data/characters.json';
import environments from 'games/dino/config/data/environments.json';
import editorHtml from '../../../test_editor/index.html?raw';

export const Editor = () => {
  useEffect(() => {
    (window as typeof window & { __EDITOR_DATA__?: unknown }).__EDITOR_DATA__ = {
      characters,
      environments
    };

    return () => {
      delete (window as typeof window & { __EDITOR_DATA__?: unknown }).__EDITOR_DATA__;
    };
  }, []);

  const htmlWithData = useMemo(() => {
    const serialized = JSON.stringify({ characters, environments }).replace(/<\/script/gi, '<\\/script');
    const injected = `<script>window.__EDITOR_DATA__ = ${serialized};</script>`;
    return editorHtml.includes('<!--EDITOR_DATA_INJECT-->')
      ? editorHtml.replace('<!--EDITOR_DATA_INJECT-->', injected)
      : `${injected}${editorHtml}`;
  }, []);

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
          srcDoc={htmlWithData}
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
