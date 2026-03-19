import { Router } from './navigation';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './mantine-overrides.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { ToastContainer } from 'react-toastify';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { SocketProvider } from './context/SocketContext';

export const App = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <MantineProvider
          theme={{
            components: {
              Input: {
                styles: {
                  input: {
                    '--input-bd-focus': 'var(--mantine-color-gray-4)',
                    boxShadow: 'none',
                  },
                },
              },
            },
          }}
        >
          <ToastContainer />
          <Router />
          <ColorSchemeScript />
        </MantineProvider>
      </SocketProvider>
    </Provider>
  );
};
