type DesktopResume = {
  id: number;
  title: string;
  type: string;
  updated: string;
  score: number;
  tag: string;
  tone: string;
  source: "local";
  claims: string[];
};

interface Window {
  tycheDesktop?: {
    getInfo(): Promise<{ dataDirectory: string; runtime: "desktop"; networkPolicy: "local-only" }>;
    listResumes(): Promise<DesktopResume[]>;
    saveUpload(input: { resume: DesktopResume; filename: string; contentType: string; bytes: Uint8Array }): Promise<DesktopResume>;
    saveResumes(resumes: DesktopResume[]): Promise<void>;
    openDataFolder(): Promise<string>;
  };
}
