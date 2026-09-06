import { TopNav } from './TopNav';
import { CopilotDrawer } from '../../features/copilot/CopilotDrawer';
import './AppShell.css';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="app-main">
        {children}
      </main>
      <CopilotDrawer />
    </div>
  );
};
