import { useState, useEffect, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Bot, Cpu, Database, Layout, Globe, Sun, 
  Zap, Home, ArrowRight, Search, Newspaper, ExternalLink,
  ChevronLeft, FileText, File, X, Eye, Download, Info, MessageSquare, Send, Briefcase
} from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import './index.css';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tree, type NodeModel } from '@minoru/react-dnd-treeview';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  timestamp: string;
};

type Material = {
  id: string;
  name: string;
  module: string;
  timestamp: string;
  isFolder: boolean;
  fileCount: number;
  content?: string;
};

type SubMenuItem = {
  label: string;
  to: string;
  children?: SubMenuItem[];
  desc?: string;
};

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
  { id: 'business', label: '前端业务', icon: <Briefcase size={24} />, desc: '沉浸前端真实业务场景模块，从架构设计到效能提升的深度实践。', path: '/business' },
];

const decodeHtmlEntities = (value: string = '') => {
  const txt = document.createElement('textarea');
  txt.innerHTML = value;
  return txt.value;
};

const normalizeExternalUrl = (url: string = '') => {
  let normalized = decodeHtmlEntities(url).trim();
  for (let i = 0; i < 2; i += 1) {
    const decoded = decodeHtmlEntities(normalized).trim();
    if (decoded === normalized) break;
    normalized = decoded;
  }

  if (!normalized) return null;
  if (normalized.startsWith('//')) normalized = `https:${normalized}`;
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  try {
    const parsed = new URL(normalized);
    return parsed.href;
  } catch {
    return null;
  }
};

const openExternalLink = (url: string) => {
  const safeUrl = normalizeExternalUrl(url);
  if (!safeUrl) return;
  const nextWindow = window.open(safeUrl, '_blank', 'noopener,noreferrer');
  if (nextWindow) nextWindow.opener = null;
};

const Sidebar = ({ submenuConfig }: { submenuConfig: Record<string, SubMenuItem[]> }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const firstSegment = location.pathname.split('/').filter(Boolean)[0];
  const currentSubPageId = location.pathname.startsWith('/materials/') ? 'materials' : firstSegment;
  const currentCategory = CATEGORIES.find((cat) => cat.id === currentSubPageId);
  const subMenus: Record<string, SubMenuItem[]> = submenuConfig || {};
  const defaultSubMenu = currentCategory
    ? [
        { label: `${currentCategory.label}总览`, to: currentCategory.path },
        { label: '已同步资料', to: `${currentCategory.path}#synced-materials` },
        { label: '推荐实践案例', to: `${currentCategory.path}#practice-cases` }
      ]
    : [{ label: '返回主页面', to: '/' }];
  const activeSubMenu = subMenus[currentSubPageId] || defaultSubMenu;
  
  if (currentCategory && currentCategory.id === 'business') {
    const hasUpload = activeSubMenu.some(item => item.to === '/business/upload');
    if (!hasUpload) {
      activeSubMenu.splice(1, 0, { label: '上传与预览', to: '/business/upload', desc: '上传文档当页立即预览' });
    }
  }

  const currentPathWithHash = `${location.pathname}${location.hash || ''}`;

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <Zap size={28} color="var(--primary-solid)" fill="var(--primary-solid)" />
        <span>AI 数据实践宝库</span>
      </div>
      {isHomePage ? (
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
      ) : (
        <nav style={{ flex: 1 }}>
          <Link to="/" className="nav-item">
            <ChevronLeft size={18} />
            <span style={{ marginLeft: '12px' }}>返回到首页</span>
          </Link>
          <div style={{ marginTop: '20px', padding: '0 16px', fontSize: '0.75rem', fontWeight: 700, color: '#AAA', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            {currentCategory?.label || '子页面'} 子菜单
          </div>
          {activeSubMenu.map((item, idx) => (
             <RecursiveSidebarItem key={item.to || idx} item={item} currentPathWithHash={currentPathWithHash} />
          ))}
        </nav>
      )}
      <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', fontSize: '0.8rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>新功能上线</div>
        <div style={{ color: 'var(--text-sec)' }}>已支持 AI RAG 知识检索</div>
      </div>
    </aside>
  );
};

const RecursiveSidebarItem = ({ item, currentPathWithHash, depth = 0 }: { item: SubMenuItem, currentPathWithHash: string, depth?: number }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  
  return (
    <div style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
      <Link 
        to={item.to || '#'} 
        onClick={(e) => { 
          if(hasChildren && !item.to) { e.preventDefault(); setIsOpen(!isOpen); } 
        }} 
        className={`nav-item ${(item.to && (currentPathWithHash === item.to || location.pathname.startsWith(item.to.split('#')[0]))) ? 'active' : ''}`}
        style={{ paddingLeft: depth === 0 ? '16px' : '8px' }}
      >
        <ArrowRight size={16} style={{ opacity: depth > 0 ? 0.5 : 1, transform: hasChildren && isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        <span style={{ marginLeft: '12px' }}>{item.label}</span>
      </Link>
      {hasChildren && isOpen && (
         <div style={{ borderLeft: '1px solid var(--border)', marginLeft: '24px', paddingLeft: '8px', borderLeftColor: 'rgba(150,150,150,0.2)' }}>
            {item.children!.map((child, i) => (
               <RecursiveSidebarItem key={child.to || i} item={child} currentPathWithHash={currentPathWithHash} depth={depth + 1} />
            ))}
         </div>
      )}
    </div>
  );
};

const Header = ({ role, onToggleRole }: { role: 'visitor' | 'editor' | 'admin'; onToggleRole: () => void }) => (
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
      <button
        onClick={onToggleRole}
        style={{
          border: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          color: 'var(--text-main)',
          borderRadius: '999px',
          padding: '0 14px',
          height: '40px',
          cursor: 'pointer'
        }}
      >
        当前角色：{role}
      </button>
      {role === 'admin' && (
        <Link
          to="/admin"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg-sidebar)',
            color: 'var(--text-main)',
            borderRadius: '999px',
            padding: '0 14px',
            height: '40px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none'
          }}
        >
          后台配置
        </Link>
      )}
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Sun size={20} />
      </div>
    </div>
  </header>
);

const AdminConfigPage = ({
  submenuConfig,
  onSaved,
  onRoleChange
}: {
  submenuConfig: Record<string, SubMenuItem[]>;
  onSaved: () => Promise<void>;
  onRoleChange: (role: 'visitor' | 'editor' | 'admin') => void;
}) => {
  const [adminToken, setAdminToken] = useState<string>(localStorage.getItem('admin_token') || '');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'menus' | 'appearance' | 'contents'>('menus');
  const [selectedPage, setSelectedPage] = useState('news');

  // Contents
  const editor = useCreateBlockNote();
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentMenuId, setContentMenuId] = useState('');
  const [contents, setContents] = useState<any[]>([]);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Settings states
  const [themeMode, setThemeMode] = useState('auto');
  const [accentColor, setAccentColor] = useState('#00f2fe');
  const [sidebarWidth, setSidebarWidth] = useState('280');
  const [siteTitle, setSiteTitle] = useState('AI 数据实践宝库');

  const availablePages = Array.from(new Set(['news', ...CATEGORIES.map((c) => c.id), ...Object.keys(submenuConfig || {})]));

  useEffect(() => {
    if (!availablePages.includes(selectedPage)) {
      setSelectedPage(availablePages[0] || 'news');
    }
  }, [selectedPage, availablePages]);

  const flattenTree = (items: SubMenuItem[], parentId: string | number = 0): NodeModel<{to:string}>[] => {
    let result: NodeModel<{to:string}>[] = [];
    items.forEach(item => {
      const id = Math.random().toString(36).substr(2, 9);
      result.push({ id, parent: parentId, text: item.label, droppable: true, data: { to: item.to } });
      if (item.children) {
        result = result.concat(flattenTree(item.children, id));
      }
    });
    return result;
  };

  const nestTree = (flat: NodeModel<{to:string}>[], parentId: string | number = 0): SubMenuItem[] => {
    return flat
      .filter(node => node.parent === parentId)
      .map(node => ({
        label: node.text,
        to: node.data?.to || '',
        children: nestTree(flat, node.id)
      }));
  };

  const [treeData, setTreeData] = useState<NodeModel<{to:string}>[]>([]);
  
  useEffect(() => {
    const source = submenuConfig[selectedPage] || [];
    setTreeData(flattenTree(source));
  }, [selectedPage, submenuConfig]);

  useEffect(() => {
    if (adminToken && activeTab === 'appearance') {
      axios.get('/api/settings').then(res => {
        if (res.data.theme_mode) setThemeMode(res.data.theme_mode);
        if (res.data.accent_color) setAccentColor(res.data.accent_color);
        if (res.data.sidebar_width) setSidebarWidth(res.data.sidebar_width);
        if (res.data.site_title) setSiteTitle(res.data.site_title);
      }).catch(() => {});
    } else if (adminToken && activeTab === 'contents') {
      axios.get('/api/contents').then(res => setContents(res.data || [])).catch(() => {});
    }
  }, [adminToken, activeTab]);

  const buildAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) return;
    setBusy(true); setStatusMessage('');
    try {
      const payload: { username?: string; password: string } = { password: loginPassword.trim() };
      if (loginUsername.trim()) payload.username = loginUsername.trim();
      const res = await axios.post('/api/admin/login', payload);
      const token = res.data?.token || '';
      if (!token) throw new Error('登录失败');
      localStorage.setItem('admin_token', token);
      setAdminToken(token);
      const roles: string[] = res.data?.roles || [];
      if (roles.includes('admin')) { localStorage.setItem('role', 'admin'); onRoleChange('admin'); }
      else if (roles.includes('editor')) { localStorage.setItem('role', 'editor'); onRoleChange('editor'); }
      setLoginPassword(''); setLoginUsername('');
      setStatusMessage('登录成功，可以开始配置。');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) setStatusMessage(error.response?.data?.error || '登录失败，请检查密码。');
      else setStatusMessage('网络错误。');
    } finally { setBusy(false); }
  };

  const handleLogout = async () => {
    setBusy(true);
    try { await axios.post('/api/admin/logout', {}, buildAuthHeaders()); } catch {}
    finally {
      localStorage.removeItem('admin_token'); setAdminToken('');
      setOldPassword(''); setNewPassword(''); setStatusMessage('已退出登录。');
      localStorage.setItem('role', 'visitor'); onRoleChange('visitor'); setBusy(false);
    }
  };

  const handleSaveSubmenu = async () => {
    setBusy(true); setStatusMessage('');
    try {
      const newSubmenus = { ...submenuConfig, [selectedPage]: nestTree(treeData) };
      await axios.put('/api/admin/submenus', { submenus: newSubmenus }, buildAuthHeaders());
      await onSaved();
      setStatusMessage('保存成功！');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) setStatusMessage(error.response?.data?.error || '保存失败。');
    } finally { setBusy(false); }
  };

  const handleSaveContent = async () => {
    if (!contentTitle.trim() || !contentBody.trim()) { setStatusMessage('标题和内容不可为空'); return; }
    setBusy(true); setStatusMessage('');
    try {
      await axios.post('/api/admin/contents', { title: contentTitle, body: contentBody, menu_id: contentMenuId, type: 'richtext' }, buildAuthHeaders());
      setStatusMessage('内容发布成功。');
      setContentTitle(''); setContentBody('');
      axios.get('/api/contents').then(res => setContents(res.data || []));
    } catch {
      setStatusMessage('保存内容失败。');
    } finally { setBusy(false); }
  };

  const handleDeleteContent = async (id: number) => {
    if (!window.confirm('确定要删除吗？')) return;
    setBusy(true);
    try {
      await axios.delete(`/api/admin/contents/${id}`, buildAuthHeaders());
      setStatusMessage('删除成功。');
      axios.get('/api/contents').then(res => setContents(res.data || []));
    } catch {
      setStatusMessage('删除失败。');
    } finally { setBusy(false); }
  };

  const handleSaveSettings = async () => {
    setBusy(true); setStatusMessage('');
    try {
      await axios.put('/api/admin/settings', {
        theme_mode: themeMode,
        accent_color: accentColor,
        sidebar_width: sidebarWidth,
        site_title: siteTitle
      }, buildAuthHeaders());
      setStatusMessage('外观设置保存成功，已全局生效。');
      // Apply immediately locally
      const root = document.documentElement;
      root.style.setProperty('--primary-accent', accentColor);
      root.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
      document.title = siteTitle;
      if (themeMode === 'light') document.body.classList.add('light-theme');
      else if (themeMode === 'dark') document.body.classList.remove('light-theme');
      else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) document.body.classList.add('light-theme');
        else document.body.classList.remove('light-theme');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) setStatusMessage(error.response?.data?.error || '配置保存失败。');
    } finally { setBusy(false); }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim()) return;
    setBusy(true); setStatusMessage('');
    try {
      await axios.put('/api/admin/password', { oldPassword: oldPassword.trim(), newPassword: newPassword.trim() }, buildAuthHeaders());
      localStorage.removeItem('admin_token'); setAdminToken('');
      setOldPassword(''); setNewPassword(''); setStatusMessage('密码已更新，请使用新密码重新登录。');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) setStatusMessage(error.response?.data?.error || '修改密码失败。');
    } finally { setBusy(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '980px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={16} /> 返回到首页
        </Link>
      </div>
      <div style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>后台管理控制台</h2>
          {adminToken && (
            <button onClick={handleLogout} className="btn-pagination" style={{ width: 'auto', borderRadius: '8px', padding: '0 12px' }}>
              退出登录
            </button>
          )}
        </div>

        {!adminToken ? (
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '12px' }}>
            <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="管理员用户名（默认为 admin）" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="请输入管理员密码" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            <button type="submit" className="btn-primary" disabled={busy} style={{ width: 'fit-content' }}>{busy ? '安全校验中...' : '安全登录系统'}</button>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <button onClick={() => setActiveTab('menus')} style={{ background: activeTab === 'menus' ? 'var(--primary-gradient)' : 'transparent', color: activeTab === 'menus' ? '#000' : 'var(--text-sec)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>导航菜单配置</button>
              <button onClick={() => setActiveTab('contents')} style={{ background: activeTab === 'contents' ? 'var(--primary-gradient)' : 'transparent', color: activeTab === 'contents' ? '#000' : 'var(--text-sec)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>图文内容发布</button>
              <button onClick={() => setActiveTab('appearance')} style={{ background: activeTab === 'appearance' ? 'var(--primary-gradient)' : 'transparent', color: activeTab === 'appearance' ? '#000' : 'var(--text-sec)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>全局外观定制</button>
            </div>

            {activeTab === 'menus' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                  {availablePages.map((pageId) => <option key={pageId} value={pageId}>编辑节点: {pageId}</option>)}
                </select>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <DndProvider backend={HTML5Backend}>
                    <Tree
                      tree={treeData}
                      rootId={0}
                      onDrop={(newTree) => setTreeData(newTree as NodeModel<{to:string}>[])}
                      classes={{
                        root: "tree-root",
                        draggingSource: "tree-dragging",
                        dropTarget: "tree-drop-target"
                      }}
                      render={(node, { depth, isOpen, onToggle }) => (
                        <div style={{ marginLeft: depth * 24, display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '4px', background: 'var(--bg-main)', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                          <button onClick={onToggle} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-sec)', display: 'flex', alignItems: 'center' }}>
                            <ArrowRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', opacity: node.droppable ? 1 : 0.2 }}/>
                          </button>
                          <input 
                            value={node.text} 
                            onChange={e => setTreeData(treeData.map(n => n.id === node.id ? { ...n, text: e.target.value } : n))}
                            placeholder="菜单名称"
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', width: '160px' }}
                          />
                          <input 
                            value={node.data?.to} 
                            onChange={e => setTreeData(treeData.map(n => n.id === node.id ? { ...n, data: { to: e.target.value } } : n))}
                            placeholder="路径 (可为空)"
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', flex: 1 }}
                          />
                          <button onClick={() => setTreeData(treeData.filter(n => n.id !== node.id))} className="btn-pagination" style={{ width: 'auto', padding: '0 8px', color: 'red', borderColor: 'red' }}><X size={14}/></button>
                        </div>
                      )}
                    />
                  </DndProvider>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={() => setTreeData([...treeData, { id: Math.random().toString(36).substr(2,9), parent: 0, text: '新菜单项', droppable: true, data: { to: '' } }])} className="btn-pagination" style={{ width: 'auto', borderRadius: '8px', padding: '0 12px' }}>+ 添加顶级菜单</button>
                  <button onClick={handleSaveSubmenu} className="btn-primary" disabled={busy}>{busy ? '应用中...' : '提交菜单修改'}</button>
                </div>
              </div>
            )}

            {activeTab === 'contents' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', borderLeft: '3px solid var(--primary-solid)', paddingLeft: '8px' }}>发布新稿件 / 富文本</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <input type="text" placeholder="文章标题" value={contentTitle} onChange={e => setContentTitle(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                    <select value={contentMenuId} onChange={e => setContentMenuId(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                      <option value="">（自由存放，不绑定到指定模块分类）</option>
                      {availablePages.map(pageId => <option key={pageId} value={pageId}>关联模块: {pageId}</option>)}
                    </select>
                    <div style={{ background: 'var(--bg-card)', borderRadius: '6px', padding: '16px 0', minHeight: '300px', border: '1px solid var(--border)' }}>
                      <BlockNoteView
                        editor={editor}
                        theme={themeMode === 'light' ? 'light' : 'dark'}
                        onChange={async () => {
                          const html = await editor.blocksToHTMLLossy(editor.document);
                          setContentBody(html);
                        }}
                      />
                    </div>
                    <button onClick={handleSaveContent} className="btn-primary" disabled={busy} style={{ width: 'fit-content' }}>{busy ? '保存中...' : '提交图文内容'}</button>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', borderLeft: '3px solid var(--primary-solid)', paddingLeft: '8px' }}>已发布内容列表 ({contents.length})</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {contents.length === 0 && <div style={{ color: 'var(--text-sec)', fontSize: '0.85rem' }}>暂无发布的内容。</div>}
                    {contents.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>{c.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#666', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>挂载模块: {c.menu_id || '未绑定'} / 时间: {new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <button onClick={() => handleDeleteContent(c.id)} className="btn-pagination" style={{ width: 'auto', padding: '0 12px', borderRadius: '4px', border: '1px solid red', color: 'red' }}>删除</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-sec)', fontSize: '0.85rem' }}>空间总览标题</label>
                  <input type="text" value={siteTitle} onChange={e => setSiteTitle(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-sec)', fontSize: '0.85rem' }}>色彩主题规范</label>
                    <select value={themeMode} onChange={e => setThemeMode(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                      <option value="auto">跟随系统设置适配 (Auto)</option>
                      <option value="dark">沉浸极客深色 (Dark)</option>
                      <option value="light">清爽阅读浅色 (Light)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-sec)', fontSize: '0.85rem' }}>全局强调色 (Accent Color)</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                      <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-sec)', fontSize: '0.85rem' }}>
                    侧边空间宽度: {sidebarWidth}px
                  </label>
                  <input type="range" min="200" max="400" value={sidebarWidth} onChange={e => setSidebarWidth(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary-solid)' }} />
                </div>
                <button onClick={handleSaveSettings} className="btn-primary" disabled={busy} style={{ width: 'fit-content' }}>
                  {busy ? '引擎同步中...' : '发布并应用新外观'}
                </button>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '8px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>高级与安全: 账户重置</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="现实验证密码" style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="新的安全密钥（至少6位）" style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                <button type="submit" className="btn-primary" disabled={busy} style={{ padding: '8px 24px' }}>修改密码</button>
              </div>
            </form>
          </div>
        )}

        {statusMessage && <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--primary-solid)', color: 'var(--text-main)', fontSize: '0.85rem' }}>ℹ️ {statusMessage}</div>}
      </div>
    </div>
  );
};

const GITHUB_TOP10: Record<'agents' | 'skills', Array<{ name: string; url: string }>> = {
  agents: [
    { name: 'langchain-ai/langchain', url: 'https://github.com/langchain-ai/langchain' },
    { name: 'langchain-ai/langgraph', url: 'https://github.com/langchain-ai/langgraph' },
    { name: 'microsoft/autogen', url: 'https://github.com/microsoft/autogen' },
    { name: 'crewAIInc/crewAI', url: 'https://github.com/crewAIInc/crewAI' },
    { name: 'Significant-Gravitas/AutoGPT', url: 'https://github.com/Significant-Gravitas/AutoGPT' },
    { name: 'OpenBMB/ChatDev', url: 'https://github.com/OpenBMB/ChatDev' },
    { name: 'All-Hands-AI/OpenHands', url: 'https://github.com/All-Hands-AI/OpenHands' },
    { name: 'camel-ai/camel', url: 'https://github.com/camel-ai/camel' },
    { name: 'geekan/MetaGPT', url: 'https://github.com/geekan/MetaGPT' },
    { name: 'run-llama/llama_index', url: 'https://github.com/run-llama/llama_index' }
  ],
  skills: [
    { name: 'dair-ai/Prompt-Engineering-Guide', url: 'https://github.com/dair-ai/Prompt-Engineering-Guide' },
    { name: 'openai/openai-cookbook', url: 'https://github.com/openai/openai-cookbook' },
    { name: 'huggingface/transformers', url: 'https://github.com/huggingface/transformers' },
    { name: 'huggingface/trl', url: 'https://github.com/huggingface/trl' },
    { name: 'microsoft/DeepSpeed', url: 'https://github.com/microsoft/DeepSpeed' },
    { name: 'deepspeedai/DeepSpeedExamples', url: 'https://github.com/deepspeedai/DeepSpeedExamples' },
    { name: 'unslothai/unsloth', url: 'https://github.com/unslothai/unsloth' },
    { name: 'OpenRLHF/OpenRLHF', url: 'https://github.com/OpenRLHF/OpenRLHF' },
    { name: 'stanfordnlp/dspy', url: 'https://github.com/stanfordnlp/dspy' },
    { name: 'karpathy/llm.c', url: 'https://github.com/karpathy/llm.c' }
  ]
};

const FileUpload = ({ compact = false, onUploaded, onUploadedId, targetModuleOverride }: { compact?: boolean; onUploaded?: () => void; onUploadedId?: (id: string) => void; targetModuleOverride?: string }) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileList | null>(null);
  const [targetModule, setTargetModule] = useState(targetModuleOverride || 'frameworks');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const folderInputProps: Record<string, string> = { webkitdirectory: '', directory: '' };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress(0);
    
    try {
      const file = files[0];
      const webkitRelativePath = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath;
      const isFolder = files.length > 1 || !!webkitRelativePath;
      const filename = isFolder ? (webkitRelativePath || '').split('/')[0] : file.name;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', filename);
      formData.append('module', targetModule);
      formData.append('isFolder', String(!!isFolder));
      formData.append('fileCount', String(files.length));
      
      const uploadRes = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      
      setProgress(100);
      const newMaterialId = uploadRes.data?.id;
      setTimeout(() => {
        setUploading(false);
        setFiles(null);
        setProgress(0);
        onUploaded?.();
        if (newMaterialId) {
          if (onUploadedId) {
            onUploadedId(newMaterialId);
          } else {
            navigate(`/materials/${newMaterialId}`);
          }
        }
      }, 500);
    } catch {
      alert('上传失败，请检查网络或后端服务。');
      setUploading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: compact ? '0' : '40px' }}>
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
                {...folderInputProps}
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

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px', marginBottom: '40px' }}>
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

    <section>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>子页面预览</h2>
      <p style={{ color: 'var(--text-sec)', marginBottom: '20px' }}>每个模块均提供主页预览，点击即可进入对应子页面。</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {CATEGORIES.map((cat) => (
          <Link
            key={`preview-${cat.id}`}
            to={cat.path}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--primary-solid)', display: 'flex', alignItems: 'center' }}>{cat.icon}</span>
              <strong>{cat.label}</strong>
            </div>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>{cat.desc}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary-solid)' }}>点击进入独立页面 →</span>
          </Link>
        ))}
      </div>
    </section>
  </div>
);

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});

  useEffect(() => {
    axios.get('/api/news')
      .then((res) => {
        setNews(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleAnalyze = async (e: MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzing(id);
    try {
      const res = await axios.get(`/api/news/${id}/analyze`);
      setAnalysis((prev) => ({ ...prev, [id]: res.data.analysis }));
    } catch {
      console.error('Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const visibleNews = news.slice(0, 50);
  const getSummary = (summary: string) =>
    decodeHtmlEntities(summary).replace(/&lt;[^&]*&gt;/g, '').replace(/<[^>]*>/g, '');

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '16px' }}>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={16} /> 返回到首页
        </Link>
      </div>
      <section style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>AI 热点新闻</h1>
          <p style={{ color: 'var(--text-sec)' }}>单页滚动展示最多 50 条热点，快速连续浏览全球资讯摘要。</p>
        </div>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>正在加载今日热点...</div>
      ) : (
        <>
          <div className="news-list" id="news-list">
            {visibleNews.map((item: NewsItem) => (
              <div 
                key={item.id} 
                className="standard-card"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '16px 20px', 
                  textDecoration: 'none',
                  minHeight: '160px',
                  justifyContent: 'flex-start',
                  aspectRatio: 'auto',
                  cursor: 'pointer'
                }}
                onClick={() => openExternalLink(item.url)}
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
                  WebkitLineClamp: 2,
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
                    {getSummary(item.summary)}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="news-url-badge">
                      <ExternalLink size={10} />
                      {(() => { try { return new URL(item.url).hostname; } catch { return '原文链接'; } })()}
                    </span>
                    <button
                      onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openExternalLink(item.url);
                      }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                      <ExternalLink size={14} color="#AAA" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div id="ai-analysis" />
          {news.length === 0 && <div style={{ textAlign: 'center', padding: '40px' }}>今日暂无新闻更新。</div>}
        </>
      )}
    </div>
  );
};

const CategoryPage = ({ category, submenuConfig }: { category: { id: string; label: string; icon: ReactNode }; submenuConfig: Record<string, SubMenuItem[]> }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`/api/materials/${category.id}`)
      .then((res) => {
        setMaterials(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    axios.get(`/api/contents?menu_id=${category.id}`)
      .then((res) => {
        setContents(res.data);
      }).catch(() => {});
  }, [category.id]);

  const handleAIAnalyze = async (e: MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzingId(id);
    try {
      const res = await axios.post(`/api/materials/analyze/${id}`);
      alert(`AI 摘要分析：\n\n${res.data.analysis}`);
    } catch {
      alert("AI 分析失败，请检查 MiniMax 配置或网络连接。");
    } finally {
      setAnalyzingId(null);
    }
  };

  const githubTop10 = category.id === 'agents' || category.id === 'skills' ? GITHUB_TOP10[category.id] : null;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '16px' }}>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={16} /> 返回到首页
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="card-icon" style={{ marginBottom: 0 }}>{category.icon}</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{category.label}</h1>
        </div>
      </div>

      {submenuConfig[category.id] && submenuConfig[category.id].length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={22} color="var(--primary-solid)" /> 子菜单预览
          </h2>
          <p style={{ color: 'var(--text-sec)', marginBottom: '20px' }}>点击预览卡片右下角的“进入页面”按钮，即可跳转到对应内容。</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {submenuConfig[category.id].map((item: SubMenuItem) => (
              <div key={item.to} className="submenu-preview-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <ArrowRight size={16} color="var(--primary-solid)" />
                  <strong style={{ fontSize: '1rem' }}>{item.label}</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', margin: '0 0 auto 0', lineHeight: 1.5 }}>
                  {item.desc || `查看 ${item.label} 相关内容与资源`}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <Link
                    to={item.to}
                    className="btn-enter-page"
                    onClick={(e) => {
                      if (item.to.includes('#')) {
                        e.preventDefault();
                        const hash = item.to.split('#')[1];
                        const el = document.getElementById(hash);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    进入页面 <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {githubTop10 && (
        <section style={{ marginBottom: '28px' }} id="github-top10">
          <h3 style={{ borderLeft: '3px solid var(--primary-solid)', paddingLeft: '12px', marginBottom: '16px' }}>
            GitHub TOP10
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
            {githubTop10.map((repo, index) => {
              const safeUrl = normalizeExternalUrl(repo.url);
              return (
                <a
                  key={repo.url}
                  href={safeUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!safeUrl) e.preventDefault();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-solid)', fontWeight: 700 }}>TOP {index + 1}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{repo.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-sec)', overflowWrap: 'anywhere' }}>{repo.url}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {contents.length > 0 && (
        <section style={{ marginBottom: '40px' }} id="module-contents">
          <h3 style={{ borderLeft: '3px solid var(--primary-solid)', paddingLeft: '12px', marginBottom: '20px' }}>精选专栏文章</h3>
          <div style={{ display: 'grid', gap: '20px' }}>
            {contents.map((c) => (
              <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', color: 'var(--text-main)' }}>{c.title}</h4>
                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: c.body }} style={{ padding: '0' }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: '40px' }} id="synced-materials">
        <h3 style={{ borderLeft: '3px solid var(--primary-solid)', paddingLeft: '12px', marginBottom: '20px' }}>已同步资料 ({materials.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {materials.map((m: Material) => (
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
              暂无上传资料，请通过右上角“上传资料”入口进行定向上传。
            </div>
          )}
        </div>
      </section>

      <section id="practice-cases">
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

const DocumentPreview = ({ id, isPreview = false }: { id: string; isPreview?: boolean }) => {
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [docHtml, setDocHtml] = useState('');
  const [excelHtml, setExcelHtml] = useState('');
  const [parseError, setParseError] = useState('');

  useEffect(() => {
    axios.get(`/api/materials/detail/${id}`)
      .then(async res => {
        const mat = res.data;
        setMaterial(mat);
        setLoading(false);
        
        const fn = (mat.name || '').toLowerCase();
        if (mat.content && typeof mat.content === 'string') {
          try {
            let bytes: Uint8Array | null = null;
            if (mat.content.startsWith('data:')) {
              const base64Str = mat.content.split(',')[1];
              if (!base64Str) return;
              const binaryString = window.atob(base64Str);
              bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
              }
            } else if (mat.content.startsWith('/uploads/')) {
              if (fn.endsWith('.docx') || fn.endsWith('.xlsx') || fn.endsWith('.xls') || fn.endsWith('.csv')) {
                 const fileRes = await axios.get(mat.content, { responseType: 'arraybuffer' });
                 bytes = new Uint8Array(fileRes.data);
              }
            }
            
            if (bytes) {
              if (fn.endsWith('.docx')) {
                 const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer as ArrayBuffer });
                 setDocHtml(result.value);
              } else if (fn.endsWith('.xlsx') || fn.endsWith('.xls') || fn.endsWith('.csv')) {
                 const workbook = xlsx.read(bytes.buffer, { type: 'array' });
                 const firstSheetName = workbook.SheetNames[0];
                 const html = xlsx.utils.sheet_to_html(workbook.Sheets[firstSheetName]);
                 setExcelHtml(html);
              }
            }
          } catch (err) {
             setParseError('本地解析引擎异常：' + (err as Error).message);
          }
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  if (!material) return <div style={{ padding: '40px', textAlign: 'center' }}>资料不存在。</div>;

  const renderContent = () => {
    const fileName = (material.name || '').toLowerCase();
    const content = material.content || '';
    const isDataUrl = typeof content === 'string' && content.startsWith('data:');
    const isPdf = fileName.endsWith('.pdf');
    const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown');
    const isText = fileName.endsWith('.txt') || fileName.endsWith('.json');
    const hasTextContent = typeof content === 'string' && content.length > 0 && !isDataUrl;
    const isDocx = fileName.endsWith('.docx');
    const isDoc = fileName.endsWith('.doc') && !fileName.endsWith('.docx');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
    const isPpt = fileName.endsWith('.ppt') || fileName.endsWith('.pptx');

    if (!content) {
      return <div style={{ color: '#555', fontStyle: 'italic', textAlign: 'center', padding: '100px 0' }}>未包含可阅读的数据流。</div>;
    }

    if (parseError) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
          <h3>文档解析失败</h3>
          <p>{parseError}</p>
          <a href={content} download={material.name} className="btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>回退：直接下载原文件</a>
        </div>
      );
    }

    if (isDocx && docHtml) {
      return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: docHtml }} style={{ background: '#fff', padding: '24px', borderRadius: '8px', color: '#000' }} />;
    }

    if (isDoc && (isDataUrl || content.startsWith('/uploads/'))) {
      return (
        <div style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
            <div className="card-icon" style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #2B5797, #4078c0)' }}>
              <FileText size={32} color="#fff" />
            </div>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(43,87,151,0.15)', color: '#2B5797', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '16px' }}>Word 文档 (.doc)</span>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px', wordBreak: 'break-all' }}>{material.name}</h3>
            <p style={{ color: 'var(--text-sec)', marginBottom: '24px', fontSize: '0.85rem' }}>.doc 格式文档请下载后使用 Word 或 WPS 打开（浏览器仅支持 .docx 在线预览）。</p>
            <a href={content} download={material.name} className="btn-primary" style={{ textDecoration: 'none', padding: '12px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> 下载 Word 文档
            </a>
          </div>
        </div>
      );
    }

    if (isExcel && excelHtml) {
      return (
        <div style={{ overflowX: 'auto', background: '#fff', padding: '16px', borderRadius: '8px', color: '#000' }}>
          <div dangerouslySetInnerHTML={{ __html: excelHtml }} style={{ borderCollapse: 'collapse', width: '100%' }} />
        </div>
      );
    }

    if (isPdf && (isDataUrl || content.startsWith('/uploads/'))) {
      return <iframe src={content} width="100%" height="800px" style={{ border: 'none', borderRadius: '8px' }} title={material.name} />;
    }

    if (isMarkdown && hasTextContent) {
      return <div className="markdown-body" style={{ color: 'var(--text-main)' }}><ReactMarkdown>{content}</ReactMarkdown></div>;
    }

    if (isText || hasTextContent) {
      return <article style={{ fontSize: '1.05rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{content}</article>;
    }

    if (isPpt) {
      return (
        <div style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
            <div className="card-icon" style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              <FileText size={32} color="#fff" />
            </div>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,107,53,0.15)', color: '#FF6B35', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '16px' }}>PPT 演示文稿</span>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px', wordBreak: 'break-all' }}>{material.name}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '20px 0', fontSize: '0.85rem', color: 'var(--text-sec)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Info size={14} /> 上传时间: {new Date(material.timestamp).toLocaleString()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Info size={14} /> 所属模块: {CATEGORIES.find(c => c.id === material.module)?.label || material.module}</div>
            </div>
            <p style={{ color: 'var(--text-sec)', marginBottom: '24px', fontSize: '0.85rem' }}>PPT 文件暂不支持浏览器内预览，请下载至本地使用 PowerPoint 或 WPS 打开。</p>
            <a href={content} download={material.name} className="btn-primary" style={{ textDecoration: 'none', padding: '12px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> 下载演示文稿
            </a>
          </div>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '60px 40px' }}>
         <h3>该类型文件不支持本地原生渲染</h3>
         <a href={content} download={material.name} className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>安全下载至本地</a>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', minHeight: '80vh' }}>
      <aside style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', height: 'fit-content', position: 'sticky', top: '24px' }}>
        {!isPreview && (
          <Link to="/" style={{ color: 'var(--primary-solid)', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
            <ChevronLeft size={16} /> 返回到首页
          </Link>
        )}
        <div className="card-icon" style={{ width: '48px', height: '48px', marginBottom: '16px' }}>
          {material.name.toLowerCase().endsWith('.pdf') ? <FileText size={24} color="var(--primary-solid)" /> : material.name.toLowerCase().endsWith('.ppt') || material.name.toLowerCase().endsWith('.pptx') ? <FileText size={24} color="#FF6B35" /> : material.name.toLowerCase().endsWith('.doc') || material.name.toLowerCase().endsWith('.docx') ? <FileText size={24} color="#2B5797" /> : material.isFolder ? <Box size={24} color="var(--primary-solid)" /> : <File size={24} color="var(--primary-solid)" />}
        </div>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', wordBreak: 'break-all' }}>{material.name}</h2>
        {(() => {
          const ext = material.name.split('.').pop()?.toUpperCase() || '';
          const typeMap: Record<string, { label: string; color: string }> = {
            'PDF': { label: 'PDF 文档', color: '#E53E3E' },
            'DOCX': { label: 'Word 文档', color: '#2B5797' },
            'DOC': { label: 'Word 文档', color: '#2B5797' },
            'PPT': { label: 'PPT 演示文稿', color: '#FF6B35' },
            'PPTX': { label: 'PPT 演示文稿', color: '#FF6B35' },
            'MD': { label: 'Markdown', color: '#00b4d8' },
            'TXT': { label: '文本文件', color: '#94a3b8' },
          };
          const info = typeMap[ext];
          return info ? (
            <span style={{ display: 'inline-block', padding: '3px 10px', background: `${info.color}22`, color: info.color, borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '16px' }}>{info.label}</span>
          ) : null;
        })()}
        <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', color: '#AAA', marginBottom: '2px' }}>上传时间</label>
            {new Date(material.timestamp).toLocaleString()}
          </div>
          <div>
            <label style={{ display: 'block', color: '#AAA', marginBottom: '2px' }}>文件类型</label>
            {material.isFolder ? `${material.fileCount} 个文件 (文件夹)` : `单文件资料 (.${material.name.split('.').pop()})`}
          </div>
          <div>
            <label style={{ display: 'block', color: '#AAA', marginBottom: '2px' }}>所属模块</label>
            {CATEGORIES.find(c => c.id === material.module)?.label || material.module}
          </div>
        </div>
        {material.content && typeof material.content === 'string' && material.content.startsWith('data:') && (
          <a href={material.content} download={material.name} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px', textDecoration: 'none', fontSize: '0.85rem', padding: '10px 16px' }}>
            <Download size={14} /> 下载原文件
          </a>
        )}
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

const MaterialDetailRoute = () => {
  const { id } = useParams();
  if (!id) return null;
  return <DocumentPreview id={id} />;
};

const UploadPage = ({ category }: { category: { id: string; label: string; icon: ReactNode; path: string } }) => {
  const [uploadedMaterialId, setUploadedMaterialId] = useState<string | null>(null);
  
  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to={category.path} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={16} /> 返回 {category.label}
        </Link>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          {category.icon} {category.label} - 上传与预览
        </h1>
        <p style={{ color: 'var(--text-sec)', marginTop: '8px' }}>在当前专区上传文件，成功后将在本页当场进行跨格式快速渲染预览。</p>
      </div>
      <FileUpload compact={false} onUploadedId={(id) => setUploadedMaterialId(id)} targetModuleOverride={category.id} />
      {uploadedMaterialId && (
        <div style={{ marginTop: '60px', borderTop: '2px dashed var(--border)', paddingTop: '40px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={24} color="var(--primary-solid)" /> 上传文件快速预览
          </h2>
          <DocumentPreview id={uploadedMaterialId} isPreview={true} />
        </div>
      )}
    </div>
  );
};


// --- Chat Widget ---
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: msg });
      const answer = res.data.answer;
      setMessages(prev => [...prev, { role: 'ai', text: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，知识库助理暂时无法响应。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
      {isOpen && (
        <div style={{ width: '360px', height: '500px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bot size={18} color="var(--primary-solid)" /> 知识库助理 (RAG)</strong>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-sec)', marginTop: '40px' }}>有什么关于您的资料库想问的吗？</div>}
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? 'var(--primary-solid)' : 'rgba(255,255,255,0.05)', color: m.role === 'user' ? '#fff' : 'var(--text-main)', padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', wordBreak: 'break-word', border: m.role === 'ai' ? '1px solid var(--border)' : 'none' }}>
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', color: 'var(--text-sec)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>正在检索并思考...</div>}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="询问关于库内资料的问题..." 
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
              />
              <button onClick={sendMessage} disabled={loading} style={{ background: 'var(--primary-solid)', color: '#fff', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer' }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ width: '56px', height: '56px', borderRadius: '28px', background: 'var(--primary-solid)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,242,254,0.3)', transition: 'transform 0.2s', transform: isOpen ? 'scale(0.9)' : 'scale(1)' }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

// --- App Entry ---

function App() {
  const [submenuConfig, setSubmenuConfig] = useState<Record<string, SubMenuItem[]>>({});
  const [currentRole, setCurrentRole] = useState<'visitor' | 'editor' | 'admin'>('visitor');

  const applySettings = (config: any) => {
    const root = document.documentElement;
    if (config.accent_color) root.style.setProperty('--primary-accent', config.accent_color);
    if (config.sidebar_width) root.style.setProperty('--sidebar-width', `${config.sidebar_width}px`);
    if (config.site_title) document.title = config.site_title;
    
    if (config.theme_mode === 'light') {
      document.body.classList.add('light-theme');
    } else if (config.theme_mode === 'dark') {
      document.body.classList.remove('light-theme');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      applySettings(res.data);
    } catch {}
  };

  const fetchSubmenuConfig = async () => {
    try {
      const res = await axios.get('/api/submenus');
      setSubmenuConfig(res.data || {});
    } catch {
      setSubmenuConfig({});
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedRole = localStorage.getItem('role');
      if (storedRole === 'admin' || storedRole === 'editor' || storedRole === 'visitor') {
        setCurrentRole(storedRole as 'admin' | 'editor' | 'visitor');
      } else {
        localStorage.setItem('role', 'visitor');
        setCurrentRole('visitor');
      }
      fetchSubmenuConfig();
      fetchSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleRole = () => {
    const nextRole = currentRole === 'visitor' ? 'editor' : currentRole === 'editor' ? 'admin' : 'visitor';
    localStorage.setItem('role', nextRole);
    setCurrentRole(nextRole);
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar submenuConfig={submenuConfig} />
        <main className="main-content">
          <Header role={currentRole} onToggleRole={handleToggleRole} />
          <div className="page-wrapper">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminConfigPage submenuConfig={submenuConfig} onSaved={fetchSubmenuConfig} onRoleChange={setCurrentRole} />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/business/upload" element={<UploadPage category={CATEGORIES.find(c => c.id === 'business')!} />} />
              <Route path="/materials/:id" element={<MaterialDetailRoute />} />
              {CATEGORIES.filter((cat) => cat.id !== 'news').map(cat => (
                <Route key={cat.id} path={cat.path} element={<CategoryPage category={cat} submenuConfig={submenuConfig} />} />
              ))}
              <Route path="/:type/:id" element={<div className="fade-in">
                <h1 style={{fontSize: '2.5rem'}}>详情页面加载中...</h1>
                <p>内容正在同步最新实战案例，请稍后。</p>
                <Link to="/" className="btn-primary" style={{textDecoration:'none', display:'inline-block'}}>返回到首页</Link>
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
          <ChatWidget />
        </main>
      </div>
    </Router>
  );
}

export default App;
