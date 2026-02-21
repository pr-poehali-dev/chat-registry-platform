import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type User = {
  id: number;
  name: string;
  username: string;
  bio: string;
  followers: number;
  following: number;
  avatar?: string;
};

type Comment = {
  id: number;
  userId: number;
  userName: string;
  text: string;
  likes: number;
  liked: boolean;
};

type Post = {
  id: number;
  userId: number;
  userName: string;
  userUsername: string;
  userAvatar?: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  showComments: boolean;
};

type ChatMessage = {
  id: number;
  fromMe: boolean;
  text: string;
  time: string;
};

type Dialog = {
  id: number;
  from: string;
  preview: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
};

type Page = "feed" | "profile" | "messages" | "search" | "settings";

function Ava({ name, src, size = "md" }: { name: string; src?: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-20 h-20 text-xl" };
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover shrink-0 border border-gray-100`} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-500 shrink-0`}>
      {initials}
    </div>
  );
}

const DEMO_USERS: User[] = [
  { id: 1, name: "Алексей Громов", username: "alexgromov", bio: "Дизайнер продуктов. Люблю минимализм и кофе.", followers: 1240, following: 389 },
  { id: 2, name: "Мария Сова", username: "mariasova", bio: "Фотограф и путешественник.", followers: 3421, following: 102 },
  { id: 3, name: "Иван Петров", username: "ivanpetrov", bio: "Разработчик, любитель Open Source.", followers: 876, following: 450 },
];

const INITIAL_POSTS: Post[] = [
  {
    id: 1, userId: 2, userName: "Мария Сова", userUsername: "mariasova",
    text: "Снял сегодня закат в Питере — небо было просто нереальным. Иногда важно остановиться и посмотреть вокруг.",
    time: "2 мин назад", likes: 48, liked: false,
    comments: [
      { id: 1, userId: 3, userName: "Иван Петров", text: "Потрясающе! Где именно снял?", likes: 5, liked: false },
      { id: 2, userId: 1, userName: "Алексей Громов", text: "Питер всегда красив в золотой час.", likes: 3, liked: false },
    ],
    showComments: false,
  },
  {
    id: 2, userId: 1, userName: "Алексей Громов", userUsername: "alexgromov",
    text: "Работаю над новой дизайн-системой. Минимализм — это не отсутствие элементов, это присутствие только нужных.",
    time: "1 ч назад", likes: 134, liked: false,
    comments: [
      { id: 3, userId: 2, userName: "Мария Сова", text: "Согласна на 100%. Меньше — это больше.", likes: 12, liked: false },
    ],
    showComments: false,
  },
  {
    id: 3, userId: 3, userName: "Иван Петров", userUsername: "ivanpetrov",
    text: "Запустил open source проект — инструмент для анализа зависимостей в монорепозиториях. Буду рад звёздочкам и фидбэку!",
    time: "3 ч назад", likes: 89, liked: false,
    comments: [],
    showComments: false,
  },
];

const INITIAL_DIALOGS: Dialog[] = [
  {
    id: 1, from: "Мария Сова", preview: "Привет! Видел мой последний пост?", time: "14:32", unread: 2,
    messages: [
      { id: 1, fromMe: false, text: "Привет! Видел мой последний пост?", time: "14:30" },
      { id: 2, fromMe: true, text: "Да, очень красиво получилось!", time: "14:31" },
      { id: 3, fromMe: false, text: "Спасибо 😊 Снимала на закате в Питере.", time: "14:32" },
    ],
  },
  {
    id: 2, from: "Иван Петров", preview: "Спасибо за фидбэк по проекту!", time: "12:05", unread: 0,
    messages: [
      { id: 1, fromMe: true, text: "Посмотрел твой проект — интересная идея!", time: "11:58" },
      { id: 2, fromMe: false, text: "Спасибо за фидбэк по проекту!", time: "12:05" },
    ],
  },
  {
    id: 3, from: "Алексей Громов", preview: "Как дела? Давно не общались.", time: "Вчера", unread: 1,
    messages: [
      { id: 1, fromMe: false, text: "Как дела? Давно не общались.", time: "Вчера" },
    ],
  },
];

const PAGE_TITLES: Record<Page, string> = {
  feed: "Лента",
  search: "Поиск",
  messages: "Сообщения",
  profile: "Профиль",
  settings: "Настройки",
};

export default function Index() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [page, setPage] = useState<Page>("feed");
  const [currentUser, setCurrentUser] = useState<User>({
    id: 0, name: "Вы", username: "me", bio: "Расскажите о себе...", followers: 0, following: 0,
  });
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState("");
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [dialogs, setDialogs] = useState<Dialog[]>(INITIAL_DIALOGS);
  const [activeDialog, setActiveDialog] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const totalUnread = dialogs.reduce((acc, d) => acc + d.unread, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDialog, dialogs]);

  const handleAuth = () => {
    if (!form.email || !form.password) return;
    if (authMode === "register" && form.name) {
      setCurrentUser(u => ({ ...u, name: form.name, username: form.name.toLowerCase().replace(/\s+/g, "") }));
    }
    setIsAuthed(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      setCurrentUser(u => ({ ...u, avatar: src }));
    };
    reader.readAsDataURL(file);
  };

  const handleLikePost = (postId: number) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const handleLikeComment = (postId: number, commentId: number) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? {
        ...p,
        comments: p.comments.map(c =>
          c.id === commentId ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
        )
      } : p
    ));
  };

  const handleToggleComments = (postId: number) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, showComments: !p.showComments } : p
    ));
  };

  const handleAddComment = (postId: number) => {
    const text = newComment[postId];
    if (!text?.trim()) return;
    setPosts(prev => prev.map(p =>
      p.id === postId ? {
        ...p,
        comments: [...p.comments, { id: Date.now(), userId: 0, userName: currentUser.name, text, likes: 0, liked: false }]
      } : p
    ));
    setNewComment(prev => ({ ...prev, [postId]: "" }));
  };

  const handleAddPost = () => {
    if (!newPostText.trim()) return;
    const post: Post = {
      id: Date.now(), userId: 0, userName: currentUser.name, userUsername: currentUser.username,
      userAvatar: currentUser.avatar,
      text: newPostText, time: "только что", likes: 0, liked: false, comments: [], showComments: false
    };
    setPosts(prev => [post, ...prev]);
    setNewPostText("");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || activeDialog === null) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setDialogs(prev => prev.map(d =>
      d.id === activeDialog ? {
        ...d, preview: chatInput, time, unread: 0,
        messages: [...d.messages, { id: Date.now(), fromMe: true, text: chatInput, time }]
      } : d
    ));
    setChatInput("");
  };

  const openDialog = (id: number) => {
    setActiveDialog(id);
    setDialogs(prev => prev.map(d => d.id === id ? { ...d, unread: 0 } : d));
  };

  const filteredUsers = DEMO_USERS.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDialog = dialogs.find(d => d.id === activeDialog);

  const navItems: { id: Page; icon: string; label: string }[] = [
    { id: "feed", icon: "Home", label: "Главная" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "messages", icon: "MessageCircle", label: "Сообщения" },
    { id: "profile", icon: "User", label: "Профиль" },
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  const navigate = (p: Page) => { setPage(p); setActiveDialog(null); setShowUserMenu(false); };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-gray-900 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-white text-xl font-light">С</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Сфера</h1>
            <p className="text-gray-400 text-sm mt-1">общение без лишнего</p>
          </div>

          <div className="flex border border-gray-100 rounded-xl p-1 mb-8 bg-gray-50">
            <button className={`flex-1 py-2 text-sm rounded-lg transition-all ${authMode === "login" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-400"}`} onClick={() => setAuthMode("login")}>Войти</button>
            <button className={`flex-1 py-2 text-sm rounded-lg transition-all ${authMode === "register" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-400"}`} onClick={() => setAuthMode("register")}>Регистрация</button>
          </div>

          <div className="space-y-3">
            {authMode === "register" && (
              <Input placeholder="Ваше имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-12 border-gray-200 rounded-xl bg-white text-sm focus-visible:ring-gray-900" />
            )}
            <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-12 border-gray-200 rounded-xl bg-white text-sm focus-visible:ring-gray-900" />
            <Input type="password" placeholder="Пароль" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="h-12 border-gray-200 rounded-xl bg-white text-sm focus-visible:ring-gray-900" />
            <Button onClick={handleAuth} className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium">
              {authMode === "login" ? "Войти" : "Создать аккаунт"}
            </Button>
          </div>

          <p className="text-center text-xs text-gray-300 mt-8">Нажимая кнопку, вы принимаете условия использования</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── TOP BAR ── */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Logo */}
          <button onClick={() => navigate("feed")} className="flex items-center gap-2 mr-4">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-light">С</span>
            </div>
            <span className="font-semibold text-gray-900 tracking-tight hidden sm:block">Сфера</span>
          </button>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all relative ${
                  page === item.id ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
                {item.id === "messages" && totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-900 rounded-full text-white text-xs flex items-center justify-center">{totalUnread}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1 md:flex-none" />

          {/* Right: user menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Ava name={currentUser.name} src={currentUser.avatar} size="sm" />
              <span className="text-sm font-medium text-gray-800 hidden sm:block max-w-[100px] truncate">{currentUser.name}</span>
              <Icon name="ChevronDown" size={14} className="text-gray-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100 overflow-hidden animate-scale-in z-30">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-400">@{currentUser.username}</p>
                </div>
                {[
                  { icon: "User", label: "Профиль", action: () => navigate("profile") },
                  { icon: "MessageCircle", label: "Сообщения", action: () => navigate("messages") },
                  { icon: "Settings", label: "Настройки", action: () => navigate("settings") },
                ].map(item => (
                  <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Icon name={item.icon} size={15} className="text-gray-400" />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-gray-50">
                  <button onClick={() => { setIsAuthed(false); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 transition-colors">
                    <Icon name="LogOut" size={15} />
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 pt-14 pb-16 md:pb-0">
        <div className={`mx-auto px-4 py-6 ${page === "messages" ? "max-w-4xl" : "max-w-xl"}`}>

          {/* Page title (mobile) */}
          <h2 className="text-xl font-semibold text-gray-900 mb-5">{PAGE_TITLES[page]}</h2>

          {/* ── FEED ── */}
          {page === "feed" && (
            <div className="animate-fade-in space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex gap-3">
                  <Ava name={currentUser.name} src={currentUser.avatar} size="sm" />
                  <Textarea
                    placeholder="Что у вас нового?"
                    value={newPostText}
                    onChange={e => setNewPostText(e.target.value)}
                    className="flex-1 border-0 resize-none text-sm text-gray-800 placeholder:text-gray-300 focus-visible:ring-0 p-0 min-h-[60px]"
                  />
                </div>
                <div className="flex justify-end mt-3 border-t border-gray-50 pt-3">
                  <Button onClick={handleAddPost} disabled={!newPostText.trim()} className="bg-gray-900 text-white hover:bg-black text-xs rounded-xl h-8 px-4 disabled:opacity-30">
                    Опубликовать
                  </Button>
                </div>
              </div>

              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Ava name={post.userName} src={post.userAvatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{post.userName}</p>
                      <p className="text-xs text-gray-400">{post.time}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{post.text}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleLikePost(post.id)} className={`flex items-center gap-1.5 text-xs transition-all ${post.liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}>
                      <Icon name="Heart" size={15} /><span>{post.likes}</span>
                    </button>
                    <button onClick={() => handleToggleComments(post.id)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-all">
                      <Icon name="MessageCircle" size={15} /><span>{post.comments.length}</span>
                    </button>
                  </div>

                  {post.showComments && (
                    <div className="mt-4 animate-fade-in">
                      <Separator className="mb-3" />
                      <div className="space-y-3">
                        {post.comments.map(c => (
                          <div key={c.id} className="flex gap-2.5">
                            <Ava name={c.userName} size="xs" />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-xs font-medium text-gray-800">{c.userName} </span>
                                  <span className="text-xs text-gray-600">{c.text}</span>
                                </div>
                                <button onClick={() => handleLikeComment(post.id, c.id)} className={`flex items-center gap-0.5 text-xs shrink-0 transition-all ${c.liked ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}>
                                  <Icon name="Heart" size={11} />
                                  {c.likes > 0 && <span>{c.likes}</span>}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Input
                          placeholder="Комментарий..."
                          value={newComment[post.id] || ""}
                          onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && handleAddComment(post.id)}
                          className="h-8 text-xs border-gray-100 rounded-xl bg-gray-50 focus-visible:ring-gray-200"
                        />
                        <Button onClick={() => handleAddComment(post.id)} className="h-8 px-3 bg-gray-900 text-white hover:bg-black rounded-xl text-xs">
                          <Icon name="Send" size={13} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {page === "messages" && (
            <div className="animate-fade-in flex gap-4 h-[calc(100vh-160px)]">
              <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col ${activeDialog ? "hidden md:flex w-72 shrink-0" : "flex-1 md:w-72 md:flex-none md:shrink-0"}`}>
                <div className="p-3 border-b border-gray-50">
                  <p className="text-xs font-medium text-gray-400 px-1">Диалоги</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {dialogs.map((dialog, i) => (
                    <div key={dialog.id}>
                      <button onClick={() => openDialog(dialog.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${activeDialog === dialog.id ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                        <Ava name={dialog.from} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{dialog.from}</p>
                            <p className="text-xs text-gray-400">{dialog.time}</p>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{dialog.preview}</p>
                        </div>
                        {dialog.unread > 0 && (
                          <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-xs">{dialog.unread}</span>
                          </div>
                        )}
                      </button>
                      {i < dialogs.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>

              {activeDialog && currentDialog ? (
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                    <button onClick={() => setActiveDialog(null)} className="md:hidden text-gray-400 hover:text-gray-700 mr-1">
                      <Icon name="ArrowLeft" size={18} />
                    </button>
                    <Ava name={currentDialog.from} size="sm" />
                    <p className="text-sm font-medium text-gray-900">{currentDialog.from}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {currentDialog.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.fromMe ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                          <p>{msg.text}</p>
                          <p className="text-xs mt-1 opacity-50">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Написать сообщение..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                        className="h-10 text-sm border-gray-100 rounded-xl bg-gray-50 focus-visible:ring-gray-200"
                      />
                      <Button onClick={handleSendMessage} disabled={!chatInput.trim()} className="h-10 px-3.5 bg-gray-900 text-white hover:bg-black rounded-xl disabled:opacity-30">
                        <Icon name="Send" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex flex-1 bg-white rounded-2xl border border-gray-100 items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Icon name="MessageCircle" size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-400">Выберите диалог</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE ── */}
          {page === "profile" && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
                <div className="flex items-start gap-5">
                  {/* Avatar with upload */}
                  <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <Ava name={currentUser.name} src={currentUser.avatar} size="lg" />
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="Camera" size={20} className="text-white" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{currentUser.name}</h3>
                    <p className="text-sm text-gray-400">@{currentUser.username}</p>

                    {editBio ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={bioInput}
                          onChange={e => setBioInput(e.target.value)}
                          placeholder="О себе..."
                          className="h-8 text-xs border-gray-200 rounded-xl"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              setCurrentUser(u => ({ ...u, bio: bioInput }));
                              setEditBio(false);
                            }
                          }}
                        />
                        <Button onClick={() => { setCurrentUser(u => ({ ...u, bio: bioInput })); setEditBio(false); }} className="h-8 px-3 bg-gray-900 text-white rounded-xl text-xs">Сохранить</Button>
                      </div>
                    ) : (
                      <p
                        className="text-sm text-gray-500 mt-2 cursor-pointer hover:text-gray-700 transition-colors"
                        onClick={() => { setBioInput(currentUser.bio); setEditBio(true); }}
                        title="Нажмите, чтобы изменить"
                      >
                        {currentUser.bio} <span className="text-gray-300 text-xs">✎</span>
                      </p>
                    )}

                    <div className="flex gap-6 mt-4">
                      <div><p className="text-base font-semibold text-gray-900">{currentUser.followers}</p><p className="text-xs text-gray-400">подписчики</p></div>
                      <div><p className="text-base font-semibold text-gray-900">{currentUser.following}</p><p className="text-xs text-gray-400">подписки</p></div>
                      <div><p className="text-base font-semibold text-gray-900">{posts.filter(p => p.userId === 0).length}</p><p className="text-xs text-gray-400">посты</p></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400 text-center">Нажмите на фото, чтобы загрузить аватарку</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1">Мои посты</p>
                {posts.filter(p => p.userId === 0).length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <p className="text-sm text-gray-400">У вас ещё нет постов</p>
                    <button onClick={() => setPage("feed")} className="text-sm text-gray-900 font-medium mt-2 hover:underline">Написать первый</button>
                  </div>
                ) : (
                  posts.filter(p => p.userId === 0).map(post => (
                    <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <p className="text-sm text-gray-700">{post.text}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Icon name="Heart" size={12} />{post.likes}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Icon name="MessageCircle" size={12} />{post.comments.length}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── SEARCH ── */}
          {page === "search" && (
            <div className="animate-fade-in">
              <div className="relative mb-4">
                <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Найти пользователей..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 border-gray-100 rounded-xl bg-white text-sm focus-visible:ring-gray-200" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filteredUsers.map((user, i) => (
                  <div key={user.id}>
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                      <Ava name={user.name} src={user.avatar} size="md" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">@{user.username} · {user.followers.toLocaleString()} подписчиков</p>
                      </div>
                      <Button variant="outline" className="text-xs h-7 px-3 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">Подписаться</Button>
                    </div>
                    {i < filteredUsers.length - 1 && <Separator />}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center"><p className="text-sm text-gray-400">Пользователи не найдены</p></div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {page === "settings" && (
            <div className="animate-fade-in space-y-2">
              {[
                { icon: "User", label: "Редактировать профиль", desc: "Имя, фото, описание", action: () => setPage("profile") },
                { icon: "Bell", label: "Уведомления", desc: "Управление оповещениями", action: () => {} },
                { icon: "Lock", label: "Приватность", desc: "Кто видит ваш профиль", action: () => {} },
                { icon: "Shield", label: "Безопасность", desc: "Пароль и вход", action: () => {} },
              ].map(item => (
                <button key={item.label} onClick={item.action} className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Icon name={item.icon} size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300" />
                </button>
              ))}
              <button onClick={() => setIsAuthed(false)} className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:bg-red-50 transition-colors text-left group">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100">
                  <Icon name="LogOut" size={16} className="text-red-400" />
                </div>
                <p className="text-sm font-medium text-red-400">Выйти из аккаунта</p>
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 flex z-20">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors relative ${page === item.id ? "text-gray-900" : "text-gray-300"}`}
          >
            <Icon name={item.icon} size={20} />
            <span className="text-xs">{item.label}</span>
            {item.id === "messages" && totalUnread > 0 && (
              <span className="absolute top-2 right-1/4 w-4 h-4 bg-gray-900 rounded-full text-white text-xs flex items-center justify-center">{totalUnread}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Overlay for user menu */}
      {showUserMenu && <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />}
    </div>
  );
}
