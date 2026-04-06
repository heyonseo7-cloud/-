import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Settings,
  Save,
  Lock,
  Unlock,
  AlertTriangle,
  X,
  LogOut
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { siteConfig } from './config';
import { Post } from './types';
import { cn } from './lib/utils';
import { 
  db, 
  auth, 
  signInWithPopup, 
  googleProvider, 
  signOut,
  handleFirestoreError,
  OperationType
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-md p-8 border border-black/10 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

const Header = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
      isScrolled ? "bg-white/80 backdrop-blur-md py-4 border-black/10" : "bg-white py-8 border-transparent"
    )}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex flex-col">
          <span className="text-sm font-medium tracking-widest uppercase opacity-60">{siteConfig.title}</span>
          <h1 className="text-2xl font-bold tracking-tighter">{siteConfig.subtitle}</h1>
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-sm font-medium hover:opacity-50 transition-opacity">홈</Link>
          <Link to="/essays" className="text-sm font-medium hover:opacity-50 transition-opacity">에세이</Link>
          {user && (
            <>
              <Link to="/admin/new" className="text-sm font-medium hover:opacity-50 transition-opacity">글쓰기</Link>
              <button 
                onClick={onLogout}
                className="flex items-center text-sm font-medium text-red-500 hover:opacity-50 transition-opacity"
              >
                로그아웃
              </button>
            </>
          )}
          <Link to="/admin" className={cn(
            "p-2 rounded-full transition-all",
            user ? "bg-black text-white" : "hover:bg-black hover:text-white"
          )}>
            {user ? <Unlock size={18} /> : <Settings size={18} />}
          </Link>
        </nav>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="bg-white border-t border-black/5 py-16 mt-20">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold tracking-tighter mb-2">{siteConfig.title} {siteConfig.subtitle}</h2>
          <p className="text-sm opacity-60">{siteConfig.description}</p>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-black/5 text-center text-xs opacity-40">
        &copy; 2026 {siteConfig.title}. All rights reserved.
      </div>
    </div>
  </footer>
);

// --- Pages ---

const Home = ({ posts }: { posts: Post[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="container mx-auto px-6 pt-40 pb-20"
  >
    <div className="max-w-4xl mx-auto mb-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-block px-4 py-1 border border-black text-[10px] font-bold tracking-[0.2em] uppercase mb-6"
      >
        Student Perspectives
      </motion.div>
      <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-8">
        세상을 바꾸는 <br />가장 강력한 시각
      </h2>
      <p className="text-xl opacity-60 max-w-2xl mx-auto leading-relaxed">
        순창제일고등학교 학생들이 바라보는 세상, <br />
        그 깊이 있는 고민과 성찰을 담은 에세이 플랫폼입니다.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link to={`/post/${post.id}`} className="group block">
            <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-6 relative">
              <img 
                src={post.thumbnail} 
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                {post.category}
              </div>
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-3 group-hover:underline decoration-2 underline-offset-4">
              {post.title}
            </h3>
            <p className="text-sm opacity-60 line-clamp-2 mb-4 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="flex items-center text-xs font-medium opacity-40">
              <span>{post.author}</span>
              <span className="mx-2">&middot;</span>
              <span>{post.date}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const PostDetail = ({ posts }: { posts: Post[] }) => {
  const { id } = useParams();
  const post = posts.find(p => p.id === id);
  const navigate = useNavigate();

  if (!post) return <div className="pt-40 text-center">포스트를 찾을 수 없습니다.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-20"
    >
      <div className="container mx-auto px-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium opacity-60 hover:opacity-100 mb-12 transition-opacity"
        >
          <ArrowLeft size={16} className="mr-2" /> 목록으로 돌아가기
        </button>

        <article className="max-w-3xl mx-auto">
          <header className="mb-16 text-center">
            <div className="text-xs font-bold tracking-widest uppercase opacity-40 mb-4">{post.category}</div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight mb-8">
              {post.title}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-sm font-medium">
              <span className="opacity-100">{post.author}</span>
              <span className="opacity-20">|</span>
              <span className="opacity-40">{post.date}</span>
            </div>
          </header>

          <div className="aspect-video overflow-hidden bg-gray-100 mb-16">
            <img 
              src={post.thumbnail} 
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="markdown-body">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <div className="mt-20 pt-12 border-t border-black/10 flex justify-end items-center">
            <div className="text-xs opacity-40 font-medium">
              카테고리: {post.category}
            </div>
          </div>
        </article>
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ posts, onDelete }: { posts: Post[], onDelete: (id: string) => void }) => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="pt-40 pb-20 container mx-auto px-6">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter mb-2">관리자 대시보드</h2>
          <p className="opacity-60">에세이 콘텐츠를 관리하고 새로운 글을 작성하세요.</p>
        </div>
        <Link 
          to="/admin/new" 
          className="flex items-center bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-80 transition-opacity"
        >
          <Plus size={18} className="mr-2" /> 새 에세이 작성
        </Link>
      </div>

      <div className="bg-white border border-black/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-black/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">제목</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">작성자</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">날짜</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">카테고리</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {posts.map(post => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{post.title}</td>
                <td className="px-6 py-4 text-sm opacity-60">{post.author}</td>
                <td className="px-6 py-4 text-sm opacity-60">{post.date}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-[10px] font-bold uppercase tracking-wider">
                    {post.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => navigate(`/admin/edit/${post.id}`)}
                      className="p-2 hover:bg-black hover:text-white rounded-full transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteId(post.id)}
                      className="p-2 hover:bg-red-500 hover:text-white rounded-full transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        title="에세이 삭제"
      >
        <div className="space-y-6">
          <div className="flex items-start space-x-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <p className="text-sm text-red-800 leading-relaxed">
              정말로 이 에세이를 삭제하시겠습니까? <br />
              이 작업은 되돌릴 수 없으며 모든 데이터가 영구적으로 삭제됩니다.
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setDeleteId(null)}
              className="flex-1 px-6 py-3 border border-black/10 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button 
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="flex-1 px-6 py-3 bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
            >
              삭제하기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const PostForm = ({ 
  onSave, 
  initialData 
}: { 
  onSave: (post: Post) => void, 
  initialData?: Post 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Post>>(initialData || {
    title: '',
    author: '',
    category: '일반',
    excerpt: '',
    content: '',
    thumbnail: 'https://picsum.photos/seed/new-post/800/600',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
    } as Post);
    navigate('/admin');
  };

  return (
    <div className="pt-40 pb-20 container mx-auto px-6 max-w-4xl">
      <div className="mb-12">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center text-sm font-medium opacity-60 hover:opacity-100 mb-8 transition-opacity"
        >
          <ArrowLeft size={16} className="mr-2" /> 대시보드로 돌아가기
        </button>
        <h2 className="text-4xl font-bold tracking-tighter">
          {initialData ? '에세이 수정' : '새 에세이 작성'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-60">제목</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors"
              placeholder="에세이 제목을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-60">작성자</label>
            <input 
              type="text" 
              required
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
              className="w-full px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors"
              placeholder="작성자 이름"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-60">카테고리</label>
            <input 
              type="text" 
              required
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors"
              placeholder="예: 기술, 환경, 사회"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-60">썸네일 이미지 URL</label>
            <div className="flex space-x-2">
              <input 
                type="url" 
                required
                value={formData.thumbnail}
                onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                className="flex-1 px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors"
                placeholder="https://..."
              />
              <div className="w-12 h-12 bg-gray-100 border border-black/10 overflow-hidden">
                <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider opacity-60">요약 (Excerpt)</label>
          <textarea 
            required
            rows={2}
            value={formData.excerpt}
            onChange={e => setFormData({...formData, excerpt: e.target.value})}
            className="w-full px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors resize-none"
            placeholder="목록에 표시될 짧은 요약글을 입력하세요"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider opacity-60">본문 (Markdown 지원)</label>
          <textarea 
            required
            rows={15}
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            className="w-full px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors font-mono text-sm"
            placeholder="# 제목\n\n내용을 입력하세요..."
          />
        </div>

        <div className="flex justify-end pt-8">
          <button 
            type="submit"
            className="flex items-center bg-black text-white px-10 py-4 rounded-full font-bold hover:opacity-80 transition-opacity"
          >
            <Save size={18} className="mr-2" /> 에세이 저장하기
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: (pass: string) => Promise<boolean> }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    try {
      const success = await onLogin(password);
      if (!success) {
        setError(true);
        setPassword('');
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-40 pb-20 flex items-center justify-center container mx-auto px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 border border-black/10 bg-white shadow-xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6">
            <Lock size={28} />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter">관리자 로그인</h2>
          <p className="text-sm opacity-60 mt-2">비밀번호를 입력하여 접속하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-60">비밀번호</label>
            <input 
              type="password" 
              autoFocus
              disabled={isLoading}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={cn(
                "w-full px-4 py-4 border outline-none transition-all font-mono",
                error ? "border-red-500 bg-red-50" : "border-black/10 focus:border-black",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              placeholder="••••••••"
            />
            {error && <p className="text-xs text-red-500 font-medium">비밀번호가 일치하지 않습니다.</p>}
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full bg-black text-white py-4 font-bold hover:opacity-80 transition-opacity flex items-center justify-center",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? "접속 중..." : "접속하기"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthReady(true);
    });

    const postsQuery = query(collection(db, 'posts'), orderBy('date', 'desc'));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Post[];
      setPosts(fetchedPosts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const handleLogin = async (password: string) => {
    // We still use the password '3824' for UI access, 
    // but we'll also sign in with Google for Firebase security
    if (password === '3824') {
      try {
        await signInWithPopup(auth, googleProvider);
        return true;
      } catch (error) {
        console.error("Login failed", error);
        return false;
      }
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSavePost = async (newPost: Post) => {
    try {
      const postRef = doc(db, 'posts', newPost.id);
      await setDoc(postRef, newPost);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${newPost.id}`);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col selection:bg-black selection:text-white">
        <Header user={user} onLogout={handleLogout} />
        
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home posts={posts} />} />
              <Route path="/essays" element={<Home posts={posts} />} />
              <Route path="/post/:id" element={<PostDetail posts={posts} />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                user ? <AdminDashboard posts={posts} onDelete={handleDeletePost} /> : <AdminLogin onLogin={handleLogin} />
              } />
              <Route path="/admin/new" element={
                user ? <PostForm onSave={handleSavePost} /> : <AdminLogin onLogin={handleLogin} />
              } />
              <Route path="/admin/edit/:id" element={
                user ? <EditWrapper posts={posts} onSave={handleSavePost} /> : <AdminLogin onLogin={handleLogin} />
              } />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

const EditWrapper = ({ posts, onSave }: { posts: Post[], onSave: (post: Post) => void }) => {
  const { id } = useParams();
  const post = posts.find(p => p.id === id);
  if (!post) return <div className="pt-40 text-center">포스트를 찾을 수 없습니다.</div>;
  return <PostForm onSave={onSave} initialData={post} />;
};
