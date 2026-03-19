import { Mention } from '@tiptap/extension-mention';
import tippy from 'tippy.js';

type User = { id: string; name: string };

export const CommentMentionsExtension = (triggerSearchProjectUsers: any, projectId?: string) =>
  Mention.configure({
    HTMLAttributes: {
      class: 'mention text-xs bg-bg-secondary text-text-subHeading px-1 py-0.5 rounded-sm',
    },
    suggestion: {
      char: '@',
      items: ({ query }: { query: string }) => {
        const q = (query || '').trim();
        if (!q || !projectId) return Promise.resolve([]);
        return triggerSearchProjectUsers({ projectId, search: q })
          .unwrap()
          .then((res: any) => {
            const users = res?.users || [];
            return users.slice(0, 8).map((u: User) => ({ id: u.id, name: u.name }));
          })
          .catch(() => []);
      },
      render: () => {
        let selectedIndex = 0;
        let popup: any;
        let component: HTMLElement;

        return {
          onStart: (props: any) => {
            component = document.createElement('div');
            component.className = 'ec-mention w-72 rounded-md border bg-white shadow-lg p-1';
            updatePopup(props);

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as any,
              appendTo: () => document.body,
              content: component,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            })[0];
          },
          onUpdate(props: any) {
            updatePopup(props);
            popup.setProps({
              getReferenceClientRect: props.clientRect as any,
            });
          },
          onKeyDown: ({ event }: any) => {
            const items = Array.from(
              component.querySelectorAll('[data-mention-item]'),
            ) as HTMLElement[];
            if (event.key === 'ArrowDown') {
              selectedIndex = (selectedIndex + 1) % items.length;
              highlight(items, selectedIndex);
              return true;
            }
            if (event.key === 'ArrowUp') {
              selectedIndex = (selectedIndex - 1 + items.length) % items.length;
              highlight(items, selectedIndex);
              return true;
            }
            if (event.key === 'Enter') {
              items[selectedIndex]?.click();
              return true;
            }
            if (event.key === 'Escape') {
              popup.hide();
              return true;
            }
            return false;
          },
          onExit() {
            popup.destroy();
          },
        };

        function updatePopup(props: any) {
          const { items = [], command } = props;
          selectedIndex = 0;
          component.innerHTML = '';

          if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'px-3 py-2 text-xs text-gray-500';
            empty.textContent = 'No users found';
            component.appendChild(empty);
            return;
          }

          items.forEach((item: User, idx: number) => {
            const row = document.createElement('button');
            row.type = 'button';
            row.dataset.mentionItem = 'true';
            row.className =
              'w-full flex items-center gap-2 px-2 py-1 mb-1 rounded text-left hover:bg-gray-100 focus:bg-gray-100';

            const avatar = document.createElement('div');
            avatar.className =
              'flex-none h-6 w-6 rounded-full bg-gray-200 text-gray-700 text-xs grid place-items-center';
            avatar.textContent = (item.name || '?').slice(0, 1).toUpperCase();

            const text = document.createElement('div');
            text.className = 'min-w-0';
            const name = document.createElement('div');
            name.className = 'text-sm font-medium truncate';
            name.textContent = item.name || '';
            const sub = document.createElement('div');
            sub.className = 'text-[11px] text-gray-500 truncate';
            sub.textContent = `@${item.name || ''}`;

            text.appendChild(name);
            text.appendChild(sub);
            row.appendChild(avatar);
            row.appendChild(text);

            row.onclick = () => command({ id: item.id, label: item.name });
            component.appendChild(row);

            if (idx === 0) row.classList.add('bg-gray-100');
          });
        }

        function highlight(items: HTMLElement[], index: number) {
          items.forEach((el) => el.classList.remove('bg-gray-100'));
          items[index]?.classList.add('bg-gray-100');
          items[index]?.scrollIntoView({ block: 'nearest' });
        }
      },
    },
  });
