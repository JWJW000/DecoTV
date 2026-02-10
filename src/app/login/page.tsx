'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

// 版本显示组件（仅展示当前版本，不再检查更新）
function VersionDisplay() {
  return (
    <button
      onClick={() =>
        window.open(
          (process.env.NEXT_PUBLIC_REPO_URL as string) ||
            (process.env.NEXT_PUBLIC_UPDATE_REPO
              ? `https://github.com/${process.env.NEXT_PUBLIC_UPDATE_REPO}`
              : 'https://github.com/Decohererk/DecoTV'),
          '_blank',
        )
      }
      className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 transition-all duration-300 cursor-pointer hover:scale-105 group'
      title='点击查看仓库'
    >
      <span className='font-mono font-medium'>v{CURRENT_VERSION}</span>
    </button>
  );
}

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldAskUsername, setShouldAskUsername] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  // 默认使用图片直链
  const [loginBackground, setLoginBackground] = useState<string>(
    'https://pan.yyds.nyc.mn/background.png',
  );

  const { siteName } = useSite();

  // 在客户端挂载后设置配置
  useEffect(() => {
    // 从服务端获取配置
    fetch('/api/server-config')
      .then((res) => res.json())
      .then((data) => {
        const storageType = data.StorageType;
        setShouldAskUsername(!!storageType && storageType !== 'localstorage');
        setRegistrationEnabled(
          data.EnableRegistration && storageType !== 'localstorage',
        );
        // 设置登录背景图（如果服务器返回空，则使用默认值）
        setLoginBackground(
          data.LoginBackground || 'https://pan.yyds.nyc.mn/background.png',
        );
      })
      .catch(() => {
        // 失败时使用默认值
        setShouldAskUsername(false);
        setRegistrationEnabled(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!password || (shouldAskUsername && !username)) return;

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          ...(shouldAskUsername ? { username } : {}),
        }),
      });

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else if (res.status === 401) {
        setError('密码错误');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '服务器错误');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden login-bg'>
      {/* 自定义背景图 */}
      {loginBackground && (
        <>
          {/* 隐藏的 img 标签用于预加载和检测加载失败 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={loginBackground}
            alt=''
            className='hidden'
            onError={() => setLoginBackground('')}
          />
          <div
            className='absolute inset-0 z-0'
            style={{
              backgroundImage: `url(${loginBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* 背景遮罩层，提升文字可读性 */}
            <div className='absolute inset-0 bg-black/40 dark:bg-black/60' />
          </div>
        </>
      )}

      {/* Animated background gradient - 仅在没有自定义背景时显示（青绿赛博风） */}
      {!loginBackground && (
        <>
          <div className='absolute inset-0 bg-linear-to-br from-emerald-900/25 via-slate-900/30 to-cyan-900/25 dark:from-emerald-900/45 dark:via-slate-950/60 dark:to-cyan-900/45 animate-gradient-shift'></div>

          {/* Floating orbs */}
          <div className='absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/30 rounded-full blur-xl animate-float-slow'></div>
          <div className='absolute top-3/4 right-1/4 w-24 h-24 bg-cyan-500/30 rounded-full blur-xl animate-float-slower'></div>
          <div className='absolute bottom-1/4 left-1/3 w-20 h-20 bg-teal-400/30 rounded-full blur-xl animate-float'></div>
        </>
      )}

      <div className='absolute top-4 right-4 z-20'>
        <ThemeToggle />
      </div>

      <div className='relative z-10 w-full max-w-md rounded-3xl p-10 backdrop-blur-xl login-card'>
        <h1 className='tracking-tight text-center text-4xl font-extrabold mb-8 bg-clip-text neon-text neon-flicker'>
          {siteName}
        </h1>
        <form onSubmit={handleSubmit} className='space-y-8'>
          {shouldAskUsername && (
            <div>
              <label htmlFor='username' className='sr-only'>
                用户名
              </label>
              <input
                id='username'
                type='text'
                autoComplete='username'
                className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur transition-all duration-300 hover:ring-emerald-400 focus:shadow-lg focus:shadow-emerald-500/25 login-input'
                placeholder='输入用户名'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <label htmlFor='password' className='sr-only'>
              密码
            </label>
            <input
              id='password'
              type='password'
              autoComplete='current-password'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur transition-all duration-300 hover:ring-emerald-400 focus:shadow-lg focus:shadow-emerald-500/25 login-input'
              placeholder='输入访问密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}

          {/* 登录按钮 */}
          <button
            type='submit'
            disabled={!password || loading || (shouldAskUsername && !username)}
            className='inline-flex w-full justify-center rounded-lg bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 py-3 text-base font-semibold text-white transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 neon-pulse login-button cursor-pointer'
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {/* 注册链接 */}
          {registrationEnabled && (
            <div className='text-center'>
              <Link
                href='/register'
                className='text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors'
              >
                没有账号？立即注册
              </Link>
            </div>
          )}
        </form>
      </div>

      {/* 版本信息显示 */}
      <VersionDisplay />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}
