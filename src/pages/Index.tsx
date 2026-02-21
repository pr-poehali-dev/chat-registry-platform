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

function Ava({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-lg" };
  return (
    <div className={`${sizes[size]} rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-600 shrink-0`}>
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

export default function Index() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [page, setPage] = useState<Page>("feed");
  const [currentUser] = useState<User>({ id: 0, name: "Вы", username: "me", bio: "Расскажите о себе...", followers: 0, following: 0 });
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState("");
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [dialogs, setDialogs] = useState<Dialog[]>(INITIAL_DIALOGS);
  const [activeDialog, setActiveDialog] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDialog, dialogs]);

  const handleAuth = () => {
    if (!form.email || !form.password) return;
    setIsAuthed(true);
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
        ...d,
        preview: chatInput,
        time,
        unread: 0,
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
            <button
              className={`flex-1 py-2 text-sm rounded-lg transition-all ${authMode === "login" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-400"}`}
              onClick={() => setAuthMode("login")}
            >Войти</button>
            <button
              className={`flex-1 py-2 text-sm rounded-lg transition-all ${authMode === "register" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-400"}`}
              onClick={() => setAuthMode("register")}
            >Регистрация</button>
          </div>

          <div className="space-y-3">
            {authMode === "register" && (
              <Input
                placeholder="Ваше имя"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="h-12 border-gray-200 rounded-xl bg-white text-sm focus-visible:ring-gray-900"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="h-12 border-gray-200 rounded-xl bg-white text-sm focus-visible:ring-gray-900"
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="h-12 border-gray-200 rounded-xl bg-white text-sm focus-visible:ring-gray-900"
            />
            <Button
              onClick={handleAuth}
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium"
            >
              {authMode === "login" ? "Войти" : "Создать аккаунт"}
            </Button>
          </div>

          <p className="text-center text-xs text-gray-300 mt-8">
            Нажимая кнопку, вы принимаете условия использования
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 fixed h-full z-10">
        <div className="px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-light">С</span>
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">Сфера</span>
          </div>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setActiveDialog(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 ${
                page === item.id ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <Ava name="Вы" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">@{currentUser.username}</p>
            </div>
            <button onClick={() => setIsAuthed(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <div className={`mx-auto px-4 py-6 ${page === "messages" ? "max-w-3xl" : "max-w-xl"}`}>

          {/* Feed */}
          {page === "feed" && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Лента</h2>

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <Textarea
                  placeholder="Что у вас нового?"
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  className="border-0 resize-none text-sm text-gray-800 placeholder:text-gray-300 focus-visible:ring-0 p-0 min-h-[72px]"
                />
                <div className="flex justify-end mt-3">
                  <Button
                    onClick={handleAddPost}
                    disabled={!newPostText.trim()}
                    className="bg-gray-900 text-white hover:bg-black text-xs rounded-xl h-8 px-4 disabled:opacity-30"
                  >Опубликовать</Button>
                </div>
              </div>

              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Ava name={post.userName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{post.userName}</p>
                      <p className="text-xs text-gray-400">{post.time}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{post.text}</p>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-all ${post.liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
                    >
                      <Icon name="Heart" size={15} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-all"
                    >
                      <Icon name="MessageCircle" size={15} />
                      <span>{post.comments.length}</span>
                    </button>
                  </div>

                  {post.showComments && (
                    <div className="mt-4 animate-fade-in">
                      <Separator className="mb-4" />
                      <div className="space-y-3">
                        {post.comments.map(c => (
                          <div key={c.id} className="flex gap-3">
                            <Ava name={c.userName} size="sm" />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-xs font-medium text-gray-800">{c.userName} </span>
                                  <span className="text-xs text-gray-600">{c.text}</span>
                                </div>
                                <button
                                  onClick={() => handleLikeComment(post.id, c.id)}
                                  className={`flex items-center gap-1 text-xs ml-3 shrink-0 transition-all ${c.liked ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                                >
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

          {/* Messages */}
          {page === "messages" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Сообщения</h2>
              <div className="flex gap-4 h-[calc(100vh-140px)]">

                {/* Dialog list */}
                <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col ${activeDialog ? "hidden md:flex w-72 shrink-0" : "flex-1 md:w-72 md:flex-none md:shrink-0"}`}>
                  <div className="p-3 border-b border-gray-50">
                    <p className="text-xs font-medium text-gray-400 px-1">Диалоги</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {dialogs.map((dialog, i) => (
                      <div key={dialog.id}>
                        <button
                          onClick={() => openDialog(dialog.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${activeDialog === dialog.id ? "bg-gray-50" : "hover:bg-gray-50"}`}
                        >
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

                {/* Chat window */}
                {activeDialog && currentDialog ? (
                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
                    {/* Chat header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                      <button onClick={() => setActiveDialog(null)} className="md:hidden text-gray-400 hover:text-gray-700 mr-1">
                        <Icon name="ArrowLeft" size={18} />
                      </button>
                      <Ava name={currentDialog.from} size="sm" />
                      <p className="text-sm font-medium text-gray-900">{currentDialog.from}</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {currentDialog.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.fromMe
                              ? "bg-gray-900 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}>
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.fromMe ? "text-gray-400" : "text-gray-400"}`}>{msg.time}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Написать сообщение..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                          className="h-10 text-sm border-gray-100 rounded-xl bg-gray-50 focus-visible:ring-gray-200"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim()}
                          className="h-10 px-3.5 bg-gray-900 text-white hover:bg-black rounded-xl disabled:opacity-30"
                        >
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
            </div>
          )}

          {/* Profile */}
          {page === "profile" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Профиль</h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
                <div className="flex items-start gap-4">
                  <Ava name="Вы" size="lg" />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{currentUser.name}</h3>
                    <p className="text-sm text-gray-400">@{currentUser.username}</p>
                    <p className="text-sm text-gray-500 mt-2">{currentUser.bio}</p>
                    <div className="flex gap-6 mt-4">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{currentUser.followers}</p>
                        <p className="text-xs text-gray-400">подписчики</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">{currentUser.following}</p>
                        <p className="text-xs text-gray-400">подписки</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">{posts.filter(p => p.userId === 0).length}</p>
                        <p className="text-xs text-gray-400">посты</p>
                      </div>
                    </div>
                  </div>
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

          {/* Search */}
          {page === "search" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Поиск</h2>
              <div className="relative mb-4">
                <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Найти пользователей..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-gray-100 rounded-xl bg-white text-sm focus-visible:ring-gray-200"
                />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filteredUsers.map((user, i) => (
                  <div key={user.id}>
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                      <Ava name={user.name} size="md" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">@{user.username} · {user.followers.toLocaleString()} подписчиков</p>
                      </div>
                      <Button variant="outline" className="text-xs h-7 px-3 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                        Подписаться
                      </Button>
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

          {/* Settings */}
          {page === "settings" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Настройки</h2>
              <div className="space-y-2">
                {[
                  { icon: "User", label: "Редактировать профиль", desc: "Имя, фото, описание" },
                  { icon: "Bell", label: "Уведомления", desc: "Управление оповещениями" },
                  { icon: "Lock", label: "Приватность", desc: "Кто видит ваш профиль" },
                  { icon: "Shield", label: "Безопасность", desc: "Пароль и вход" },
                ].map(item => (
                  <button key={item.label} className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left">
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
                <button
                  onClick={() => setIsAuthed(false)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:bg-red-50 transition-colors text-left group"
                >
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100">
                    <Icon name="LogOut" size={16} className="text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-red-400">Выйти из аккаунта</p>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setPage(item.id); setActiveDialog(null); }}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${page === item.id ? "text-gray-900" : "text-gray-300"}`}
          >
            <Icon name={item.icon} size={20} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
