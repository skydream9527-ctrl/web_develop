import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { 
  Box, Bot, Cpu, Database, Layout, Globe, Sun, 
  Zap, Home, ArrowRight, Search, Newspaper, ExternalLink,
  ChevronLeft, ChevronRight, FileText, File
} from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './index.css';

// --- Aligned Data ---
const CATEGORIES = [
  { id: 'news', label: 'AI 热点新闻', icon: <Newspaper size={24} />, desc: '每日 6:00 更新，汇聚全球 AI 领域最新资讯、摘要及原网页跳转。', path: '/news' },
  { id: 'frameworks', label: 'AI 实践框架', icon: <Cpu size={24} />, desc: '深度学习与机器学习框架实战，涵盖 TensorFlow、PyTorch 等主流工具。', path: '/frameworks' },
  { id: 'agents', label: 'AI Agent', icon: <Bot size={24} />, desc: '探索自主代理 AI 的构建与应用，从 AutoGPT 到复杂任务规划系统。', path: '/agents' },
  { id: 'skills', label: 'AI Skill', icon: <Zap size={24} />, desc: 'Prompt Engineering、模型微调等核心 AI 技能进阶指南。', path: '/skills' },
  { id: 'knowledge', label: 'AI 知识库', icon: <Database size={24} />, desc: '向量数据库、RAG 检索增强生成等知识管理技术的深度实践。', path: '/knowledge' },
  { id: 'materials', label: '学习资料', icon: <Box size={24} />, desc: '精选 AI 学习路线图、电子书及高质量视频课程资源下载。', path: '/materials' },
  { id: 'tools', label: '好用工具', icon: <Layout size={24} />, desc: '提升开发效率的 AI 工具箱，包含代码生成、图像识别等实用工具。', path: '/tools' },
  { id: 'apps', label: 'APP 开发', icon: <Globe size={24} />, desc: 'AI 助手、创作工具等实际落地应用的移动端开发全流程。', path: '/apps' },
  { id: 'webs', label: '网页开发', icon: <Search size={24} />, desc: '基于 AI 的网页抓取、自动化分析及智能交互的前端技术。', path: '/webs' },
];

// --- Global Components ---

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="sidebar">
      <div className="logo-area">
        <Zap size={28} color="var(--primary-solid)" fill="var(--primary-solid)" />
        <span>AI 数据实践宝库</span>
      </div>
      <nav style={{ flex: 1 }}>
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <Home size={20} />
          <span style={{ marginLeft: '12px' }}>全景地图</span>
        </Link>
        <div style={{ marginTop: '32px', padding: '0 16px', fontSize: '0.75rem', fontWeight: 700, color: '#AAA', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
          资源分类
        </div>
        {CATEGORIES.map(cat => (
          <Link key={cat.id} to={cat.path} className={`nav-item ${location.pathname.includes(cat.id) ? 'active' : ''}`}>
            {cat.icon}
            <span style={{ marginLeft: '12px' }}>{cat.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', fontSize: '0.8rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>新功能上线</div>
        <div style={{ color: 'var(--text-sec)' }}>已支持 PDF/Markdown 在线阅读</div>
      </div>
    </aside>
  );
};

const Header = () => (
  <header className="header-actions">
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-sec)', fontSize: '0.9rem' }}>
      <Home size={16} /> / <span>首页</span>
    </div>
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#AAA' }} />
        <input 
          type="text" 
          placeholder="搜索资源..." 
          style={{ padding: '10px 16px 10px 40px', borderRadius: '30px', border: '1px solid var(--border)', width: '240px', outline: 'none' }} 
        />
      </div>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Sun size={20} />
      </div>
    </div>
  </header>
);

const FileUpload = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [targetModule, setTargetModule] = useState('frameworks');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : 90));
    }, 100);

    try {
      const file = files[0];
      let content = "";
      
      // Handle different file types
      if (files.length === 1) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.pdf') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
          content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        } else if (file.type.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.endsWith('.json')) {
          content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          });
        }
      }

      const fileList = Array.from(files).map(f => ({ name: f.name, size: f.size }));
      const isFolder = files.length > 1 || (file as any).webkitRelativePath;
      
      await axios.post('/api/upload', { 
        name: isFolder ? (file as any).webkitRelativePath.split('/')[0] : file.name,
        module: targetModule,
        isFolder: !!isFolder,
        files: fileList,
        content: content
      });
      
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        alert('上传成功！资料已同步到模块页面。');
        setUploading(false);
        setFiles(null);
        setProgress(0);
        window.location.reload(); 
      }, 500);
    } catch (err) {
      clearInterval(interval);
      alert('上传失败，请检查网络或后端服务。');
      setUploading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '40px' }}>
      <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={20} color="var(--primary-solid)" /> AI 资料定向存储
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#AAA', marginBottom: '4px' }}>目标模块</label>
          <select 
            value={targetModule} 
            onChange={(e) => setTargetModule(e.target.value)}
            style={{ width: '100%', padding: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px' }}
          >
            {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#AAA', marginBottom: '4px' }}>上传类型</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="btn-pagination" style={{ width: 'auto', padding: '0 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
              <input 
                type="file" 
                multiple
                onChange={(e) => setFiles(e.target.files)}
                style={{ display: 'none' }}
              />
              {files && files.length === 1 ? '文件已选' : files && files.length > 1 ? `${files.length}个文件` : '选择文件'}
            </label>
            <label className="btn-pagination" style={{ width: 'auto', padding: '0 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
              <input 
                type="file" 
                {...({ webkitdirectory: "", directory: "" } as any)} 
                onChange={(e) => setFiles(e.target.files)}
                style={{ display: 'none' }}
              />
              上传文件夹
            </label>
          </div>
        </div>
      </div>
      <button 
        onClick={handleUpload} 
        disabled={!files || uploading}
        className={`btn-primary ${files && !uploading ? 'pulse-button' : ''}`} 
        style={{ width: '100%', padding: '10px', fontSize: '0.9rem', opacity: (!files || uploading) ? 0.5 : 1 }}
      >
        {uploading ? `同步中 ${progress}%` : '开始定向上传'}
      </button>
      {uploading && (
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', marginTop: '16px', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.3s' }}></div>
        </div>
      )}
    </div>
  );
};

const HomePage = () => (
  <div className="fade-in">
    <section style={{ marginBottom: '48px' }}>
      <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1.5px', color: 'var(--text-main)' }}>
        构建你的 <span style={{ color: 'var(--primary-solid)' }}>AI 实践</span> 路线图
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-sec)', maxWidth: '700px' }}>
        整合全球顶尖 AI 框架、Agent 开发及行业实战，打造一站式 AI 数据能力提升平台。
      </p>
    </section>

    <FileUpload />

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
      {CATEGORIES.map(cat => (
        <Link key={cat.id} to={cat.path} className="standard-card">
          <div className="card-icon">{cat.icon}</div>
          <h3 className="card-title">{cat.label}</h3>
          <p className="card-desc">{cat.desc}</p>
          <div className="card-cta">
            进入学习 <ArrowRight size={18} />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

const NewsPage = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{[key: string]: string}>({});
  const itemsPerPage = 4;

  useEffect(() => {
    axios.get('/api/news')
      .then(res => {
        setNews(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching news:', err);
        setLoading(false);
      });
  }, []);

  const handleAnalyze = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzing(id);
    try {
      const res = await axios.get(`/api/news/${id}/analyze`);
      setAnalysis(prev => ({ ...prev, [id]: res.data.analysis }));
    } catch (err) {
      console.error('Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value.replace(/&lt;[^&]*&gt;/g, '').replace(/<[^>]*>/g, '');
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNews = news.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(news.length / itemsPerPage);

  return (
    <div className="fade-in">
      <section style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>AI 热点新闻</h1>
          <p style={{ color: 'var(--text-sec)' }}>双列极简布局，快速获取全球资讯摘要。</p>
        </div>
        
        {/* Pagination Controls */}
        {!loading && news.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-pagination"
              style={{ opacity: currentPage === 1 ? 0.3 : 1 }}
            >
              <ChevronLeft size={20} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontWeight: 600, fontSize: '0.9rem' }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-pagination"
              style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>正在加载今日热点...</div>
      ) : (
        <>
          <div className="news-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gridAutoRows: 'min-content',
            gap: '16px' 
          }}>
            {currentNews.map((item: any) => (
              <div 
                key={item.id} 
                className="standard-card"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '16px 20px', 
                  textDecoration: 'none',
                  minHeight: '160px',
                  justifyContent: 'flex-start'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary-solid)', borderRadius: '4px', fontWeight: 600 }}>
                    {item.source}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#AAA' }}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '1rem', 
                  color: 'var(--text-main)', 
                  fontWeight: 600, 
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{item.title}</h3>
                
                {analysis[item.id] ? (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '10px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '8px', 
                    fontSize: '0.75rem', 
                    color: 'var(--primary-solid)',
                    borderLeft: '2px solid var(--primary-solid)'
                  }}>
                    <strong>Gemini 摘要:</strong> {analysis[item.id]}
                  </div>
                ) : (
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.8rem', 
                    color: 'var(--text-sec)', 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>
                    {decodeHtml(item.summary)}
                  </p>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={(e) => handleAnalyze(e, item.id)}
                    disabled={analyzing === item.id}
                    style={{ 
                      background: 'none', 
                      border: '1px solid var(--border)', 
                      color: 'var(--text-sec)', 
                      fontSize: '0.7rem', 
                      padding: '4px 10px', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Bot size={12} /> {analyzing === item.id ? '分析中...' : 'AI 深度摘要'}
                  </button>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} color="#AAA" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          {news.length === 0 && <div style={{ textAlign: 'center', padding: '40px' }}>今日暂无新闻更新。</div>}
        </>
      )}
    </div>
  );
};

const CategoryPage = ({ category }: { category: any }) => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`/api/materials/${category.id}`)
      .then(res => {
        setMaterials(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category.id]);

  const handleAIAnalyze = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzingId(id);
    try {
      const res = await axios.post(`/api/materials/analyze/${id}`);
      alert(`AI 摘要分析：\n\n${res.data.analysis}`);
    } catch (err) {
      alert("AI 分析失败，请检查 MiniMax 配置或网络连接。");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div className="card-icon" style={{ marginBottom: 0 }}>{category.icon}</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{category.label}</h1>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ borderLeft: '3px solid var(--primary-solid)', paddingLeft: '12px', marginBottom: '20px' }}>已同步资料 ({materials.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {materials.map(m => (
            <Link 
              key={m.id} 
              to={`/materials/${m.id}`}
              className="standard-card" 
              style={{ aspectRatio: 'auto', padding: '16px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {m.name.toLowerCase().endsWith('.pdf') ? <FileText size={18} color="#FF5722" /> : m.isFolder ? <Box size={18} color="var(--primary-solid)" /> : <File size={18} color="#AAA" />}
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#666' }}>
                {new Date(m.timestamp).toLocaleString()} • {m.isFolder ? `${m.fileCount} 个文件` : '单文件'}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn-pagination" style={{ fontSize: '0.7rem', height: '28px', flex: 1 }}>查看内容</button>
                <button 
                  onClick={(e) => handleAIAnalyze(e, m.id)}
                  disabled={analyzingId === m.id}
                  className="btn-pagination" 
                  style={{ fontSize: '0.7rem', height: '28px', flex: 1, opacity: analyzingId === m.id ? 0.5 : 1 }}
                >
                  {analyzingId === m.id ? '分析中...' : 'AI 摘要'}
                </button>
              </div>
            </Link>
          ))}
          {materials.length === 0 && !loading && (
            <div style={{ color: '#555', fontSize: '0.9rem', padding: '20px', border: '1px dashed #333', borderRadius: '8px', textAlign: 'center', gridColumn: '1/-1' }}>
              暂无上传资料，请在首页通过“AI 资料实验室”进行定向上传。
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 style={{ borderLeft: '3px solid var(--primary-solid)', paddingLeft: '12px', marginBottom: '20px' }}>推荐实践案例</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="standard-card" style={{ aspectRatio: 'auto', padding: '24px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-solid)', marginBottom: '8px', fontWeight: 600 }}>PREMIUM RESOURCE</div>
              <h3 style={{ margin: '0 0 12px 0' }}>{category.label} 实战案例 #{i}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', margin: 0 }}>深入探讨 {category.label} 在 2026 年的核心应用场景与性能优化策略。</p>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <ArrowRight size={16} color="var(--primary-solid)" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const MaterialDetail = () => {
  const { id } = useParams();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/materials/detail/${id}`)
      .then(res => {
        setMaterial(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  if (!material) return <div style={{ padding: '40px', textAlign: 'center' }}>资料不存在。</div>;

  const renderContent = () => {
    if (!material.content) {
      return (
        <div style={{ color: '#555', fontStyle: 'italic', textAlign: 'center', padding: '100px 0' }}>
          此资料仅包含元数据，或文件格式暂不支持在线阅读。
        </div>
      );
    }

    const fileName = material.name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      return (
        <iframe 
          src={material.content} 
          width="100%" 
          height="800px" 
          style={{ border: 'none', borderRadius: '8px' }}
          title={material.name}
        />
      );
    }

    if (fileName.endsWith('.md')) {
      return (
        <div className="markdown-body" style={{ color: 'var(--text-main)' }}>
          <ReactMarkdown>{material.content}</ReactMarkdown>
        </div>
      );
    }

    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Box size={48} color="var(--primary-solid)" style={{ marginBottom: '16px' }} />
          <h3>PowerPoint 演示文稿</h3>
          <p style={{ color: 'var(--text-sec)' }}>目前支持 PDF 和 Markdown 在线预览。</p>
          <a href={material.content} download={material.name} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            下载并在本地查看
          </a>
        </div>
      );
    }

    return (
      <article style={{ 
        fontSize: '1.1rem', 
        lineHeight: '1.8', 
        color: 'var(--text-main)', 
        whiteSpace: 'pre-wrap',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {material.content}
      </article>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', minHeight: '80vh' }}>
      <aside style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', height: 'fit-content', position: 'sticky', top: '24px' }}>
        <Link to="/" style={{ color: 'var(--primary-solid)', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
          <ChevronLeft size={16} /> 返回列表
        </Link>
        <div className="card-icon" style={{ width: '48px', height: '48px', marginBottom: '16px' }}>
          {material.name.toLowerCase().endsWith('.pdf') ? <FileText size={24} color="var(--primary-solid)" /> : material.isFolder ? <Box size={24} color="var(--primary-solid)" /> : <File size={24} color="var(--primary-solid)" />}
        </div>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', wordBreak: 'break-all' }}>{material.name}</h2>
        <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', color: '#AAA', marginBottom: '2px' }}>上传时间</label>
            {new Date(material.timestamp).toLocaleString()}
          </div>
          <div>
            <label style={{ display: 'block', color: '#AAA', marginBottom: '2px' }}>文件类型</label>
            {material.isFolder ? `${material.fileCount} 个文件 (文件夹)` : '单文件资料'}
          </div>
          <div>
            <label style={{ display: 'block', color: '#AAA', marginBottom: '2px' }}>所属模块</label>
            {CATEGORIES.find(c => c.id === material.module)?.label || material.module}
          </div>
        </div>
      </aside>

      <main style={{ background: 'var(--bg-sidebar)', padding: '48px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <header style={{ borderBottom: '1px solid var(--border)', marginBottom: '32px', paddingBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>{material.name}</h1>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};


// --- App Entry ---

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="page-wrapper">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/materials/:id" element={<MaterialDetail />} />
              {CATEGORIES.map(cat => (
                <Route key={cat.id} path={cat.path} element={<CategoryPage category={cat} />} />
              ))}
              <Route path="/:type/:id" element={<div className="fade-in">
                <h1 style={{fontSize: '2.5rem'}}>详情页面加载中...</h1>
                <p>内容正在同步最新实战案例，请稍后。</p>
                <Link to="/" className="btn-primary" style={{textDecoration:'none', display:'inline-block'}}>返回全景图</Link>
              </div>} />
            </Routes>
          </div>
          
          <footer style={{ marginTop: '80px', padding: '40px 0', borderTop: '1px solid var(--border)', color: 'var(--text-sec)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>© 2026 AI 数据实践宝库. All Rights Reserved.</span>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>帮助文档</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>更新日志</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>社区支持</a>
            </div>
          </footer>
        </main>
      </div>
    </Router>
  );
}

export default App;
