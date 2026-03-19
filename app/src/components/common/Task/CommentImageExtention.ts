import { Image as TipTapImage } from '@tiptap/extension-image';
import { toast } from 'react-toastify';

export const CustomImageExtension = (deleteFile: any) =>
  TipTapImage.extend({
    addAttributes() {
      return {
        ...(this as any).parent?.(),
        key: {
          default: null,
          parseHTML: (el: any) => el.getAttribute('data-key'),
          renderHTML: (attrs: any) => (attrs.key ? { 'data-key': attrs.key } : {}),
        },
      };
    },
    addNodeView() {
      return ({ node, getPos, editor }: any) => {
        const wrapper = document.createElement('span');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.margin = '4px';

        const img = document.createElement('img');
        img.src = node.attrs.src;
        img.alt = node.attrs.alt || '';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '6px';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '×';
        Object.assign(btn.style, {
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        });

        btn.onclick = async () => {
          try {
            const key = node.attrs.key;
            if (key) await deleteFile({ key }).unwrap();
            const pos = getPos();
            editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
          } catch {
            toast.error('Unable to delete image');
          }
        };

        wrapper.appendChild(img);
        wrapper.appendChild(btn);

        return {
          dom: wrapper,
          update(updatedNode: any) {
            if (updatedNode.type.name !== 'image') return false;
            img.src = updatedNode.attrs.src;
            return true;
          },
        };
      };
    },
  });
