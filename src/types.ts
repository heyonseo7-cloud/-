export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  thumbnail: string;
  category: string;
  password?: string;
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  theme: {
    background: string;
    foreground: string;
    accent: string;
  };
  fonts: {
    sans: string;
  };
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}
