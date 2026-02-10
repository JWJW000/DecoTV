'use client';

/**
 * 极光流体背景组件 (Aurora Lite - 全平台统一版)
 *
 * 设计理念：
 * - 全平台统一使用轻量级 Lite 方案，仅 2 个光斑元素
 * - 纯 CSS 实现，零 JS 主线程阻塞
 * - 响应式尺寸：移动端小光斑，PC 端自动放大
 * - 超低功耗：长周期动画 (10s/12s)，适度模糊
 * - GPU 加速：transform3d + will-change
 */
export default function ParticleBackground() {
  return (
    <div className='fixed inset-0 z-[-1] overflow-hidden'>
      {/* 1. 亮色模式底色 */}
      <div className='absolute inset-0 bg-linear-to-b from-slate-100 via-gray-50 to-white dark:opacity-0 transition-opacity duration-500' />

      {/* 暗色模式：炫酷深邃黑底 + 底部渐变 */}
      <div className='absolute inset-0 opacity-0 dark:opacity-100 bg-[#050508] transition-opacity duration-500' />
      <div className='absolute inset-0 opacity-0 dark:opacity-100 bg-linear-to-b from-transparent to-black/20 pointer-events-none transition-opacity duration-500' />

      {/* ========== 炫酷极光层 - 青绿 / 青蓝 微光 ========== */}
      {/* 青绿光斑 - 左上 */}
      <div
        className='absolute -top-16 -left-16 w-64 h-64 md:w-[40vw] md:h-[40vw] md:max-w-125 md:max-h-125 rounded-full mix-blend-screen filter blur-[50px] md:blur-[80px] animate-blob-slow transform-gpu will-change-transform dark:opacity-90'
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 65%)',
          transform: 'translate3d(0,0,0)',
        }}
      />

      {/* 青蓝光斑 - 右下 */}
      <div
        className='absolute bottom-20 -right-16 md:bottom-0 md:-right-20 w-56 h-56 md:w-[35vw] md:h-[35vw] md:max-w-md md:max-h-md rounded-full mix-blend-screen filter blur-[45px] md:blur-[70px] animate-blob-slow transform-gpu will-change-transform dark:opacity-90'
        style={{
          background:
            'radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 65%)',
          transform: 'translate3d(0,0,0)',
          animationDelay: '5s',
        }}
      />

      {/* 青绿环形微光 - 中下，增加层次 */}
      <div
        className='absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-64 md:h-[30vw] max-w-2xl rounded-full mix-blend-screen filter blur-[60px] md:blur-[90px] animate-blob-slow transform-gpu will-change-transform opacity-0 dark:opacity-70'
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 72%)',
          transform: 'translate3d(0,0,0)',
          animationDelay: '2.5s',
        }}
      />

      {/* 噪点纹理层 - 炫酷质感，暗色略强 */}
      <div
        className='absolute inset-0 opacity-[0.02] dark:opacity-[0.055] pointer-events-none'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 内联 Keyframes 定义 - 超长周期，极低功耗 */}
      <style jsx>{`
        @keyframes blob-slow {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(15px, -25px, 0) scale(1.05);
          }
        }

        .animate-blob-slow {
          animation: blob-slow 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
